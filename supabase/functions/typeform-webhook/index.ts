// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type TypeformAnswer = {
  field?: { id?: string; ref?: string };
  type?: string;
  text?: string;
  email?: string;
  phone_number?: string;
  choice?: { label?: string };
};

type TypeformField = {
  id?: string;
  title?: string;
  ref?: string;
};

type TypeformBody = {
  event_id?: string;
  form_response?: {
    token?: string;
    hidden?: Record<string, string | undefined>;
    answers?: TypeformAnswer[];
    definition?: {
      fields?: TypeformField[];
    };
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  });
}

function readEnv(name: string) {
  return (Deno.env.get(name) || '').trim();
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function getAnswerLabel(answer: TypeformAnswer) {
  if (answer.type === 'choice') {
    return answer.choice?.label || '';
  }
  if (answer.type === 'email') {
    return answer.email || '';
  }
  if (answer.type === 'phone_number') {
    return answer.phone_number || '';
  }
  return answer.text || '';
}

function getFieldTitle(fields: TypeformField[], answer: TypeformAnswer) {
  const fieldId = answer.field?.id;
  const fieldRef = answer.field?.ref;
  const match = fields.find((field) => field.id === fieldId || (fieldRef && field.ref === fieldRef));
  return match?.title || fieldRef || fieldId || '';
}

function getValueByTitle(fields: TypeformField[], answers: TypeformAnswer[], patterns: string[]) {
  const normalizedPatterns = patterns.map(normalizeText);
  for (const answer of answers) {
    const title = normalizeText(getFieldTitle(fields, answer));
    if (normalizedPatterns.some((pattern) => title.includes(pattern))) {
      return getAnswerLabel(answer);
    }
  }
  return '';
}

function getActivityZone(area: string) {
  const labels: Record<string, string> = {
    'Johannesburg CBD': 'Johannesburg',
    'Sandton / Rosebank': 'Johannesburg',
    Soweto: 'Johannesburg',
    'Randburg / Roodepoort': 'West Rand',
    'East Rand (Boksburg / Germiston)': 'East Rand',
    'South Johannesburg': 'Johannesburg',
    'Pretoria CBD': 'Pretoria',
    Centurion: 'Pretoria',
    'Pretoria East (Menlyn / Faerie Glen)': 'Pretoria',
    'Pretoria North / West': 'Pretoria',
    Midrand: 'Midrand',
    'Vaal / Vanderbijlpark': 'Vaal',
    'Krugersdorp / Mogale City': 'West Rand',
    'Other Gauteng': 'Other Gauteng'
  };

  return labels[area] || 'Other Gauteng';
}

function getTrafficPotential(area: string, hours: string) {
  const highTrafficAreas = ['Sandton / Rosebank', 'Johannesburg CBD', 'Pretoria East (Menlyn / Faerie Glen)', 'Centurion', 'Midrand'];
  if (highTrafficAreas.includes(area)) {
    return 'High';
  }
  if (!area) {
    return 'Low';
  }
  if (hours.includes('Full Day') || hours.includes('+')) {
    return 'Medium';
  }
  return 'Low';
}

function calcQualityScore(bikeAge: string, condition: string, area: string, hours: string) {
  let score = 0;

  if (condition === 'Good') {
    score += 3;
  } else if (condition === 'Average') {
    score += 1;
  }

  if (bikeAge === 'Less than 1 year' || bikeAge === '1 to 2 years') {
    score += 3;
  } else if (bikeAge === '3 to 5 years') {
    score += 2;
  }

  if (['Sandton / Rosebank', 'Johannesburg CBD', 'Pretoria East (Menlyn / Faerie Glen)', 'Centurion', 'Midrand'].includes(area)) {
    score += 3;
  } else if (area) {
    score += 1;
  }

  if (hours.includes('Full Day') || hours.includes('Afternoon + Evening')) {
    score += 2;
  } else if (hours.includes('+')) {
    score += 1;
  }

  return score;
}

function getScoreTag(score: number) {
  if (score >= 8) {
    return 'High-value applicant';
  }
  if (score >= 5) {
    return 'Medium priority';
  }
  return 'Standard review';
}

function evaluateMinimumStandard(bikeAge: string, condition: string) {
  const failures: string[] = [];
  if (condition === 'Poor') {
    failures.push('Bike condition must be Good or Average');
  }
  if (bikeAge === '10 or more years') {
    failures.push('Bike age must be less than 10 years');
  }
  return {
    passed: failures.length === 0,
    reason: failures.join('. ')
  };
}

serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const supabaseUrl = readEnv('PROJECT_URL');
  const serviceRoleKey = readEnv('SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: 'Missing Supabase service role configuration' }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  let body: TypeformBody;
  try {
    body = await request.json();
  } catch (_error) {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const response = body.form_response;
  if (!response?.token) {
    return json({ error: 'Missing form_response.token' }, 400);
  }

  const fields = response.definition?.fields || [];
  const answers = response.answers || [];
  const hidden = response.hidden || {};

  const fullName = getValueByTitle(fields, answers, ['full name']);
  const formPhone = getValueByTitle(fields, answers, ['phone number']);
  const email = getValueByTitle(fields, answers, ['email address']);
  const idNumber = getValueByTitle(fields, answers, ['sa id number', 'id number']);
  const platform = getValueByTitle(fields, answers, ['delivery platform']);
  const bikeType = getValueByTitle(fields, answers, ['type of bike', 'bike type']);
  const bikeAge = getValueByTitle(fields, answers, ['old is your bike', 'bike age']);
  const condition = getValueByTitle(fields, answers, ['current condition of your bike', 'bike condition']);
  const routes = getValueByTitle(fields, answers, ['routes or areas you usually ride', 'daily routes']);
  const area = getValueByTitle(fields, answers, ['which gauteng area', 'gauteng area']);
  const hours = getValueByTitle(fields, answers, ['typical working hours']);
  const verifiedPhoneValue = String(hidden.verified_phone || '').trim();
  const verifiedAtValue = String(hidden.verified_at || '').trim();
  const phoneVerified = String(hidden.phone_verified || '').trim().toLowerCase() === 'true' && Boolean(verifiedPhoneValue);
  const phone = verifiedPhoneValue || formPhone;

  if (!fullName || !phone || !email || !idNumber || !platform || !bikeType || !bikeAge || !condition || !area || !hours) {
    return json({ error: 'Webhook payload is missing required application fields' }, 400);
  }

  const { data: photoUpload } = await supabase
    .from('application_photo_uploads')
    .select('*')
    .eq('typeform_response_id', response.token)
    .maybeSingle();

  const activityZone = getActivityZone(area);
  const trafficPotential = getTrafficPotential(area, hours);
  const qualityScore = calcQualityScore(bikeAge, condition, area, hours);
  const minimumStandard = evaluateMinimumStandard(bikeAge, condition);

  const payload = {
    full_name: fullName,
    phone,
    email,
    id_number: idNumber,
    platform,
    bike_type: bikeType,
    bike_age: bikeAge,
    condition,
    routes,
    area,
    activity_zone: activityZone,
    traffic_potential: trafficPotential,
    hours,
    quality_score: qualityScore,
    score_tag: getScoreTag(qualityScore),
    minimum_standard_passed: minimumStandard.passed,
    minimum_standard_reason: minimumStandard.reason || null,
    bike_photo_name: photoUpload?.bike_photo_name || null,
    rider_photo_name: photoUpload?.rider_photo_name || null,
    bike_photo_path: photoUpload?.bike_photo_path || null,
    rider_photo_path: photoUpload?.rider_photo_path || null,
    bike_photo_url: photoUpload?.bike_photo_url || null,
    rider_photo_url: photoUpload?.rider_photo_url || null,
    verified_phone: phoneVerified,
    verified_at: phoneVerified && verifiedAtValue ? verifiedAtValue : null,
    typeform_response_id: response.token,
    source: phoneVerified ? 'typeform+otp' : 'typeform',
    status: 'Pending'
  };

  const { error } = await supabase
    .from('rider_applications')
    .upsert(payload, { onConflict: 'typeform_response_id' });

  if (error) {
    return json({ error: error.message }, 500);
  }

  if (photoUpload) {
    await supabase
      .from('application_photo_uploads')
      .update({ status: 'Linked' })
      .eq('typeform_response_id', response.token);
  }

  return json({ ok: true, typeformResponseId: response.token });
});
