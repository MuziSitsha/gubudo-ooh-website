window.GUBUDO_CONFIG = {
  typeform: {
    formId: 'REPLACE_WITH_YOUR_TYPEFORM_ID',
    region: 'us'
  },
  supabase: {
    url: 'https://YOUR_PROJECT_REF.supabase.co',
    anonKey: 'REPLACE_WITH_YOUR_SUPABASE_ANON_KEY',
    table: 'rider_applications',
    storageBucket: 'REPLACE_WITH_YOUR_STORAGE_BUCKET'
  },
  storage: {
    bucket: 'REPLACE_WITH_YOUR_STORAGE_BUCKET'
  },
  otp: {
    enabled: true
  },
  admin: {
    allowedEmails: ['admin@gubudo.co.za'],
    localDevBypass: true,
    localDevLabel: 'Local Dev Bypass'
  },
  notifications: {
    functionUrl: ''
  },
  map: {
    enabled: true
  }
};