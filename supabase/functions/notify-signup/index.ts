import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

type SubmissionPayload = {
  id?: string;
  name?: string;
  full_name?: string;
  phone?: string;
  email?: string;
  area?: string;
  activityZone?: string;
  activity_zone?: string;
  platform?: string;
  trafficPotential?: string;
  traffic_potential?: string;
  qualityScore?: number;
  quality_score?: number;
  scoreTag?: string;
  score_tag?: string;
  status?: string;
  timestamp?: string;
};

type EmailPayload = {
  to: string[];
  subject: string;
  text: string;
  reply_to?: string[];
};

type RequestBody = {
  submission?: SubmissionPayload;
  eventTypes?: string[];
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
  const value = Deno.env.get(name);
  return value ? value.trim() : '';
}

function buildMessage(eventType: string, submission: SubmissionPayload) {
  const name = submission.name || submission.full_name || 'Unknown rider';
  const phone = submission.phone || 'No phone';
  const area = submission.area || 'Unknown area';
  const activityZone = submission.activityZone || submission.activity_zone || 'Unknown activity zone';
  const platform = submission.platform || 'Unknown platform';
  const score = String(submission.qualityScore ?? submission.quality_score ?? 'n/a');
  const trafficPotential = submission.trafficPotential || submission.traffic_potential || 'Low';
  const scoreTag = submission.scoreTag || submission.score_tag || 'Standard review';

  if (eventType === 'high_value_applicant') {
    return `High-value rider alert: ${name} scored ${score} (${scoreTag}) and applied from ${area} in ${activityZone}. Platform: ${platform}. Traffic potential: ${trafficPotential}. Phone: ${phone}.`;
  }

  if (eventType === 'application_completed') {
    return `Application approved: ${name} is ready for installation. Area: ${area}. Activity zone: ${activityZone}. Platform: ${platform}. Phone: ${phone}.`;
  }

  return `New rider signup: ${name} applied from ${area} in ${activityZone} on ${platform}. Traffic potential: ${trafficPotential}. Phone: ${phone}.`;
}

function buildApplicantMessage(eventType: string, submission: SubmissionPayload) {
  const name = submission.name || submission.full_name || 'there';

  if (eventType === 'application_completed') {
    return {
      subject: 'GUBUDO OOH application update',
      text: `Hi ${name},\n\nYour GUBUDO OOH application has been approved and is ready for the next step. Our team will contact you shortly with installation details.\n\nRegards,\nGUBUDO OOH`
    };
  }

  return {
    subject: 'We received your GUBUDO OOH application',
    text: `Hi ${name},\n\nThank you for applying to GUBUDO OOH. We have received your application and our team will review it shortly. We will contact you using the phone number or email address you submitted.\n\nRegards,\nGUBUDO OOH`
  };
}

async function postWebhook(url: string, payload: Record<string, unknown>) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Webhook failed: ${detail}`);
  }
}

async function sendResendEmail(payload: EmailPayload) {
  const apiKey = readEnv('RESEND_API_KEY');
  const from = readEnv('RESEND_FROM_EMAIL');

  if (!apiKey || !from || !payload.to.length) {
    return false;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ from, ...payload })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Resend failed: ${detail}`);
  }

  return true;
}

async function sendTwilioMessage(to: string, from: string, body: string) {
  const accountSid = readEnv('TWILIO_ACCOUNT_SID');
  const authToken = readEnv('TWILIO_AUTH_TOKEN');

  if (!accountSid || !authToken || !to || !from) {
    return false;
  }

  const auth = btoa(`${accountSid}:${authToken}`);
  const form = new URLSearchParams({ To: to, From: from, Body: body });
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: form.toString()
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Twilio failed: ${detail}`);
  }

  return true;
}

serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  let body: RequestBody;
  try {
    body = await request.json();
  } catch (_error) {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const submission = body.submission;
  const eventTypes = Array.isArray(body.eventTypes) ? body.eventTypes.filter(Boolean) : [];

  if (!submission || !eventTypes.length) {
    return json({ error: 'submission and eventTypes are required' }, 400);
  }

  const genericWebhook = readEnv('GENERIC_WEBHOOK_URL');
  const newSignupWebhook = readEnv('NEW_SIGNUP_WEBHOOK_URL') || genericWebhook;
  const highValueWebhook = readEnv('HIGH_VALUE_WEBHOOK_URL') || genericWebhook;
  const completionWebhook = readEnv('COMPLETION_WEBHOOK_URL') || genericWebhook;
  const adminEmail = readEnv('ADMIN_EMAIL') || 'sales@gubudo.com';
  const smsRecipient = readEnv('ADMIN_SMS_TO');
  const whatsappRecipient = readEnv('ADMIN_WHATSAPP_TO');
  const smsFrom = readEnv('TWILIO_FROM_SMS');
  const whatsappFrom = readEnv('TWILIO_FROM_WHATSAPP');

  const results: Array<{ eventType: string; channel: string; ok: boolean; detail?: string }> = [];

  for (const eventType of eventTypes) {
    const message = buildMessage(eventType, submission);
    const webhookUrl = eventType === 'high_value_applicant'
      ? highValueWebhook
      : eventType === 'application_completed'
        ? completionWebhook
        : newSignupWebhook;

    if (webhookUrl) {
      try {
        await postWebhook(webhookUrl, { eventType, submission, message });
        results.push({ eventType, channel: 'webhook', ok: true });
      } catch (error) {
        results.push({ eventType, channel: 'webhook', ok: false, detail: error instanceof Error ? error.message : 'Unknown webhook error' });
      }
    }

    try {
      const adminEmailSent = await sendResendEmail({
        to: [adminEmail],
        subject: `GUBUDO notification: ${eventType}`,
        text: message,
        reply_to: submission.email ? [submission.email] : undefined
      });
      if (adminEmailSent) {
        results.push({ eventType, channel: 'email', ok: true });
      }
    } catch (error) {
      results.push({ eventType, channel: 'email', ok: false, detail: error instanceof Error ? error.message : 'Unknown email error' });
    }

    if (submission.email) {
      try {
        const applicantMessage = buildApplicantMessage(eventType, submission);
        const applicantEmailSent = await sendResendEmail({
          to: [submission.email],
          subject: applicantMessage.subject,
          text: applicantMessage.text,
          reply_to: [adminEmail]
        });
        if (applicantEmailSent) {
          results.push({ eventType, channel: 'applicant-email', ok: true });
        }
      } catch (error) {
        results.push({ eventType, channel: 'applicant-email', ok: false, detail: error instanceof Error ? error.message : 'Unknown applicant email error' });
      }
    }

    try {
      const smsSent = await sendTwilioMessage(smsRecipient, smsFrom, message);
      if (smsSent) {
        results.push({ eventType, channel: 'sms', ok: true });
      }
    } catch (error) {
      results.push({ eventType, channel: 'sms', ok: false, detail: error instanceof Error ? error.message : 'Unknown sms error' });
    }

    try {
      const whatsappSent = await sendTwilioMessage(whatsappRecipient, whatsappFrom, message);
      if (whatsappSent) {
        results.push({ eventType, channel: 'whatsapp', ok: true });
      }
    } catch (error) {
      results.push({ eventType, channel: 'whatsapp', ok: false, detail: error instanceof Error ? error.message : 'Unknown whatsapp error' });
    }
  }

  const success = results.some((result) => result.ok);
  return json({ ok: success, results }, success ? 200 : 502);
});