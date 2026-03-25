import { createClient } from '@supabase/supabase-js';

const appConfig = window.GUBUDO_CONFIG || {};
const supabaseConfig = appConfig.supabase || {};
const typeformConfig = appConfig.typeform || {};
const storageConfig = appConfig.storage || {};

const placeholders = {
  supabaseUrl: 'YOUR_PROJECT_REF',
  supabaseAnonKey: 'REPLACE_WITH_YOUR_SUPABASE_ANON_KEY',
  typeformId: 'REPLACE_WITH_YOUR_TYPEFORM_ID',
  storageBucket: 'REPLACE_WITH_YOUR_STORAGE_BUCKET'
};

const hasValue = (value, placeholder) => typeof value === 'string' && value.trim() && !value.includes(placeholder);

export const publicConfig = {
  typeformFormId: hasValue(typeformConfig.formId, placeholders.typeformId) ? typeformConfig.formId.trim() : '',
  supabaseUrl: hasValue(supabaseConfig.url, placeholders.supabaseUrl) ? supabaseConfig.url.trim() : '',
  supabaseAnonKey: hasValue(supabaseConfig.anonKey, placeholders.supabaseAnonKey) ? supabaseConfig.anonKey.trim() : '',
  table: supabaseConfig.table || 'rider_applications',
  storageBucket: hasValue(storageConfig.bucket || supabaseConfig.storageBucket, placeholders.storageBucket)
    ? (storageConfig.bucket || supabaseConfig.storageBucket).trim()
    : '',
  region: typeformConfig.region || 'us',
  otpEnabled: appConfig.otp?.enabled !== false,
  adminAllowedEmails: Array.isArray(appConfig.admin?.allowedEmails) ? appConfig.admin.allowedEmails.map((email) => String(email).trim().toLowerCase()).filter(Boolean) : [],
  notificationFunctionUrl: typeof appConfig.notifications?.functionUrl === 'string' && appConfig.notifications.functionUrl.trim()
    ? appConfig.notifications.functionUrl.trim()
    : (hasValue(supabaseConfig.url, placeholders.supabaseUrl) ? `${supabaseConfig.url.trim()}/functions/v1/notify-signup` : ''),
  mapEnabled: appConfig.map?.enabled !== false
};

export const supabaseClient = publicConfig.supabaseUrl && publicConfig.supabaseAnonKey
  ? createClient(publicConfig.supabaseUrl, publicConfig.supabaseAnonKey, { auth: { persistSession: false } })
  : null;
