// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

  let body: { typeformResponseId?: string };
  try {
    body = await request.json();
  } catch (_error) {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  if (!body.typeformResponseId) {
    return json({ error: 'typeformResponseId is required' }, 400);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  const { data: uploadRow, error: uploadError } = await supabase
    .from('application_photo_uploads')
    .select('*')
    .eq('typeform_response_id', body.typeformResponseId)
    .maybeSingle();

  if (uploadError) {
    return json({ error: uploadError.message }, 500);
  }

  if (!uploadRow) {
    return json({ ok: true, linked: false, reason: 'No photo upload row found yet' });
  }

  const { data: applicationRow, error: applicationError } = await supabase
    .from('rider_applications')
    .select('id')
    .eq('typeform_response_id', body.typeformResponseId)
    .maybeSingle();

  if (applicationError) {
    return json({ error: applicationError.message }, 500);
  }

  if (!applicationRow) {
    return json({ ok: true, linked: false, reason: 'Typeform submission not ingested yet' });
  }

  const { error: updateError } = await supabase
    .from('rider_applications')
    .update({
      bike_photo_name: uploadRow.bike_photo_name || null,
      rider_photo_name: uploadRow.rider_photo_name || null,
      bike_photo_path: uploadRow.bike_photo_path || null,
      rider_photo_path: uploadRow.rider_photo_path || null,
      bike_photo_url: uploadRow.bike_photo_url || null,
      rider_photo_url: uploadRow.rider_photo_url || null
    })
    .eq('typeform_response_id', body.typeformResponseId);

  if (updateError) {
    return json({ error: updateError.message }, 500);
  }

  await supabase
    .from('application_photo_uploads')
    .update({ status: 'Linked' })
    .eq('typeform_response_id', body.typeformResponseId);

  return json({ ok: true, linked: true });
});
