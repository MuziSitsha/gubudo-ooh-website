import { useEffect, useMemo, useRef, useState } from 'react';
import { createPopup } from '@typeform/embed';
import '@typeform/embed/build/css/popup.css';
import './landing.css';
import { publicConfig, supabaseClient } from './lib/publicConfig.js';
import { clearDraft, loadDraft, saveDraft, upsertLocalSubmission } from './lib/submissions.js';

const TOTAL_STEPS = 4;
const PROCESS_STEPS = [
  {
    number: '01',
    title: 'Apply Online',
    body: ''
  },
  {
    number: '02',
    title: 'Get Approved + Install Box',
    body: ''
  },
  {
    number: '03',
    title: 'Earn Monthly + Bonuses',
    body: ''
  }
];

const TRUST_ITEMS = [
  'Real payouts. Monthly.',
  'Used by delivery riders across Gauteng',
  'No hidden fees. Deposit is refundable.'
];

const TICKER_ITEMS = [
  'Limited slots available in your area',
  'Applications reviewed daily',
  'Priority given to high-traffic riders',
  'Limited pilot - early riders earn more'
];

const PERKS = [
  {
    title: 'No long pages',
    text: 'Break into steps',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    )
  },
  {
    title: 'Show progress bar',
    text: 'Clear steps from start to finish',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 12h18" />
        <path d="M3 6h10" />
        <path d="M3 18h14" />
      </svg>
    )
  },
  {
    title: 'Auto-save',
    text: 'Progress stays saved',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
        <path d="M17 21v-8H7v8" />
        <path d="M7 3v5h8" />
      </svg>
    )
  }
];

const AREA_OPTIONS = [
  {
    label: 'Johannesburg',
    values: ['Johannesburg CBD', 'Sandton / Rosebank', 'Soweto', 'Randburg / Roodepoort', 'East Rand (Boksburg / Germiston)', 'South Johannesburg']
  },
  {
    label: 'Pretoria',
    values: ['Pretoria CBD', 'Centurion', 'Pretoria East (Menlyn / Faerie Glen)', 'Pretoria North / West', 'Midrand']
  },
  {
    label: 'Other Gauteng',
    values: ['Vaal / Vanderbijlpark', 'Krugersdorp / Mogale City', 'Other Gauteng']
  }
];

const HOURS_OPTIONS = [
  'Morning only (06:00 - 12:00)',
  'Afternoon only (12:00 - 18:00)',
  'Evening only (18:00 - 24:00)',
  'Morning + Afternoon (06:00 - 18:00)',
  'Afternoon + Evening (12:00 - 24:00)',
  'Full Day (06:00 - 24:00)',
  'Flexible / Varies'
];

const PLATFORM_OPTIONS = ['Uber Eats', 'Mr Delivery', 'Bolt Food', 'Multiple Platforms', 'Other'];
const BIKE_TYPE_OPTIONS = ['Scooter (50-125cc)', 'Motorbike (150cc+)', 'Electric Scooter', 'Other'];
const BIKE_AGE_OPTIONS = [
  { value: 'lt1', label: 'Less than 1 year' },
  { value: '1-2', label: '1 to 2 years' },
  { value: '3-5', label: '3 to 5 years' },
  { value: '6-10', label: '6 to 10 years' },
  { value: '10+', label: '10 or more years' }
];

const CONDITION_OPTIONS = ['Good', 'Average', 'Poor'];
const HIGH_TRAFFIC_AREAS = ['Sandton / Rosebank', 'Johannesburg CBD', 'Pretoria East (Menlyn / Faerie Glen)', 'Centurion', 'Midrand'];
const ACTIVITY_ZONE_LABELS = {
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

function normalizePhone(phone) {
  return String(phone || '').replace(/\s+/g, '').trim();
}

function formatPhoneForOtp(phone) {
  const normalized = normalizePhone(phone);
  if (!normalized) {
    return '';
  }
  if (normalized.startsWith('+27')) {
    return normalized;
  }
  if (normalized.startsWith('0')) {
    return `+27${normalized.slice(1)}`;
  }
  return normalized;
}

function createInitialFormState() {
  const draft = loadDraft();
  return {
    step: draft?.step && draft.step > 0 && draft.step <= TOTAL_STEPS ? draft.step : 1,
    values: {
      name: draft?.name || '',
      phone: draft?.phone || '',
      email: draft?.email || '',
      idNumber: draft?.idNumber || '',
      platform: draft?.platform || '',
      bikeType: draft?.bikeType || '',
      bikeAge: draft?.bikeAge || '',
      condition: draft?.condition || '',
      routes: draft?.routes || '',
      area: draft?.area || '',
      hours: draft?.hours || ''
    }
  };
}

function buildSubmissionId() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  return `local-${Date.now()}`;
}

function sanitizeFileName(fileName) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '-');
}

function readFilePreview(file) {
  return new Promise((resolve) => {
    if (!file) {
      resolve('');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

function calcQualityScore(values) {
  let score = 0;

  if (values.condition === 'Good') {
    score += 3;
  } else if (values.condition === 'Average') {
    score += 1;
  }

  if (['lt1', '1-2'].includes(values.bikeAge)) {
    score += 3;
  } else if (values.bikeAge === '3-5') {
    score += 2;
  }

  if (HIGH_TRAFFIC_AREAS.includes(values.area)) {
    score += 3;
  } else if (values.area) {
    score += 1;
  }

  if (values.hours.includes('Full Day') || values.hours.includes('Afternoon + Evening')) {
    score += 2;
  } else if (values.hours.includes('+')) {
    score += 1;
  }

  return score;
}

function getActivityZone(area) {
  return ACTIVITY_ZONE_LABELS[area] || 'Other Gauteng';
}

function getTrafficPotential(values) {
  if (HIGH_TRAFFIC_AREAS.includes(values.area)) {
    return 'High';
  }

  if (!values.area) {
    return 'Low';
  }

  if (values.hours.includes('Full Day') || values.hours.includes('+')) {
    return 'Medium';
  }

  return 'Low';
}

function getScoreTag(score) {
  if (score >= 8) {
    return 'High-value applicant';
  }
  if (score >= 5) {
    return 'Medium priority';
  }
  return 'Standard review';
}

function evaluateMinimumStandard(values) {
  const failures = [];

  if (values.condition === 'Poor') {
    failures.push('Bike condition must be Good or Average');
  }

  if (values.bikeAge === '10+') {
    failures.push('Bike age must be less than 10 years');
  }

  return {
    passed: failures.length === 0,
    reason: failures.join('. ')
  };
}

function validateStep(step, values, bikePhoto) {
  const nextErrors = {};

  if (step === 1) {
    if (values.name.trim().length <= 1) {
      nextErrors.name = 'Please enter your full name';
    }
    if (!/^(\+27|0)[6-8][0-9]{8}$/.test(normalizePhone(values.phone))) {
      nextErrors.phone = 'Enter a valid SA number';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      nextErrors.email = 'Enter a valid email';
    }
    if (!/^\d{13}$/.test(values.idNumber)) {
      nextErrors.idNumber = 'Enter a valid 13-digit ID number';
    }
  }

  if (step === 2) {
    if (!values.platform) {
      nextErrors.platform = 'Please select your platform';
    }
    if (!values.bikeType) {
      nextErrors.bikeType = 'Please select bike type';
    }
    if (!values.bikeAge) {
      nextErrors.bikeAge = 'Please select bike age';
    }
    if (!values.condition) {
      nextErrors.condition = 'Please select bike condition';
    }
    if (!values.routes.trim()) {
      nextErrors.routes = 'Please add your daily routes / areas';
    }

    const minimumStandard = evaluateMinimumStandard(values);
    if (!minimumStandard.passed) {
      nextErrors.minimumStandard = minimumStandard.reason;
    }
  }

  if (step === 3) {
    if (!values.area) {
      nextErrors.area = 'Please select your area';
    }
    if (!values.hours) {
      nextErrors.hours = 'Please select your working hours';
    }
  }

  if (step === 4 && !bikePhoto) {
    nextErrors.bikePhoto = 'A bike photo is required';
  }

  return nextErrors;
}

async function uploadPhoto(file, submissionId, kind) {
  if (!file) {
    return { name: '', path: '', url: '' };
  }

  if (!supabaseClient || !publicConfig.storageBucket) {
    return { name: file.name, path: '', url: '' };
  }

  const extension = file.name.includes('.') ? file.name.split('.').pop() : 'jpg';
  const sanitizedBase = sanitizeFileName(file.name.replace(/\.[^.]+$/, ''));
  const path = `${submissionId}/${kind}-${Date.now()}-${sanitizedBase}.${extension}`;

  const { error } = await supabaseClient.storage.from(publicConfig.storageBucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false
  });

  if (error) {
    throw error;
  }

  const { data } = supabaseClient.storage.from(publicConfig.storageBucket).getPublicUrl(path);

  return {
    name: file.name,
    path,
    url: data?.publicUrl || ''
  };
}

async function dispatchNotifications(submission, eventTypes) {
  if (!publicConfig.notificationFunctionUrl || !eventTypes.length) {
    return;
  }

  const response = await fetch(publicConfig.notificationFunctionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(publicConfig.supabaseAnonKey
        ? {
            apikey: publicConfig.supabaseAnonKey,
            Authorization: `Bearer ${publicConfig.supabaseAnonKey}`
          }
        : {})
    },
    body: JSON.stringify({ submission, eventTypes })
  });

  if (!response.ok) {
    throw new Error('Notification relay failed');
  }
}

async function saveSubmissionRecord(values, bikePhoto, riderPhoto, responseId, verification) {
  const submissionId = buildSubmissionId();
  const qualityScore = calcQualityScore(values);
  const trafficPotential = getTrafficPotential(values);
  const activityZone = getActivityZone(values.area);
  const minimumStandard = evaluateMinimumStandard(values);
  const [bikeUpload, riderUpload, bikePreview, riderPreview] = await Promise.all([
    uploadPhoto(bikePhoto, submissionId, 'bike'),
    uploadPhoto(riderPhoto, submissionId, 'rider'),
    readFilePreview(bikePhoto),
    readFilePreview(riderPhoto)
  ]);

  const submission = {
    id: submissionId,
    name: values.name,
    phone: values.phone,
    email: values.email,
    idNumber: values.idNumber,
    platform: values.platform,
    bikeType: values.bikeType,
    bikeAge: values.bikeAge,
    condition: values.condition,
    routes: values.routes,
    area: values.area,
    activityZone,
    trafficPotential,
    hours: values.hours,
    qualityScore,
    scoreTag: getScoreTag(qualityScore),
    minimumStandardPassed: minimumStandard.passed,
    minimumStandardReason: minimumStandard.reason,
    status: 'Pending',
    timestamp: new Date().toISOString(),
    bikePhotoName: bikeUpload.name || bikePhoto?.name || '',
    riderPhotoName: riderUpload.name || riderPhoto?.name || '',
    bikePhotoPath: bikeUpload.path || '',
    riderPhotoPath: riderUpload.path || '',
    bikePhotoPreview: bikeUpload.url || bikePreview,
    riderPhotoPreview: riderUpload.url || riderPreview,
    verifiedPhone: verification.verified,
    verifiedAt: verification.verifiedAt || '',
    typeformResponseId: responseId,
    source: 'react-typeform'
  };

  upsertLocalSubmission(submission);

  if (supabaseClient) {
    const payload = {
      id: submission.id,
      full_name: submission.name,
      phone: submission.phone,
      email: submission.email,
      id_number: submission.idNumber,
      platform: submission.platform,
      bike_type: submission.bikeType,
      bike_age: submission.bikeAge,
      condition: submission.condition,
      routes: submission.routes,
      area: submission.area,
      activity_zone: submission.activityZone,
      traffic_potential: submission.trafficPotential,
      hours: submission.hours,
      quality_score: submission.qualityScore,
      score_tag: submission.scoreTag,
      minimum_standard_passed: submission.minimumStandardPassed,
      minimum_standard_reason: submission.minimumStandardReason || null,
      status: submission.status,
      created_at: submission.timestamp,
      bike_photo_name: submission.bikePhotoName,
      rider_photo_name: submission.riderPhotoName,
      bike_photo_path: submission.bikePhotoPath,
      rider_photo_path: submission.riderPhotoPath,
      bike_photo_url: submission.bikePhotoPreview,
      rider_photo_url: submission.riderPhotoPreview,
      verified_phone: submission.verifiedPhone,
      verified_at: submission.verifiedAt || null,
      typeform_response_id: submission.typeformResponseId,
      source: submission.source
    };

    const { error } = await supabaseClient.from(publicConfig.table).upsert(payload);
    if (error) {
      throw error;
    }
  }

  try {
    await dispatchNotifications(submission, qualityScore >= 8 ? ['new_signup', 'high_value_applicant'] : ['new_signup']);
  } catch (error) {
  }

  clearDraft();
  return submission;
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 9 7" fill="none" xmlns="http://www.w3.org/2000/svg" width="10">
      <path d="M1 3.5l2 2L8 1" stroke="#00E676" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function LandingApp() {
  const initial = useMemo(() => createInitialFormState(), []);
  const [step, setStep] = useState(initial.step);
  const [values, setValues] = useState(initial.values);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ message: '', tone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bikePhoto, setBikePhoto] = useState(null);
  const [riderPhoto, setRiderPhoto] = useState(null);
  const [otpCode, setOtpCode] = useState('');
  const [otpRequestedPhone, setOtpRequestedPhone] = useState('');
  const [otpVerifiedPhone, setOtpVerifiedPhone] = useState('');
  const [otpVerifiedAt, setOtpVerifiedAt] = useState('');
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpStatus, setOtpStatus] = useState({ message: '', tone: '' });
  const completedRef = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      document.getElementById('nav')?.classList.toggle('scrolled', window.scrollY > 50);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('vis');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.fu').forEach((element) => observer.observe(element));
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  useEffect(() => {
    if (!success) {
      saveDraft({ ...values, step });
    }
  }, [step, success, values]);

  const buttonText = step === TOTAL_STEPS ? 'Submit Application' : 'Continue';
  const qualityScore = calcQualityScore(values);

  function updateValue(field, nextValue) {
    if (field === 'phone') {
      const nextPhone = formatPhoneForOtp(nextValue);
      if (otpRequestedPhone && otpRequestedPhone !== nextPhone) {
        setOtpRequestedPhone('');
        setOtpCode('');
        setOtpStatus({ message: '', tone: '' });
      }
      if (otpVerifiedPhone && otpVerifiedPhone !== nextPhone) {
        setOtpVerifiedPhone('');
        setOtpVerifiedAt('');
        setOtpStatus({ message: '', tone: '' });
      }
    }

    setValues((current) => ({ ...current, [field]: nextValue }));
    setErrors((current) => {
      if (!current[field] && !(field === 'phone' && current.phoneVerification)) {
        return current;
      }
      const nextErrors = { ...current };
      delete nextErrors[field];
      if (field === 'phone') {
        delete nextErrors.phoneVerification;
      }
      return nextErrors;
    });
  }

  function updateFile(kind, file) {
    if (kind === 'bike') {
      setBikePhoto(file || null);
      setErrors((current) => {
        if (!current.bikePhoto) {
          return current;
        }
        const nextErrors = { ...current };
        delete nextErrors.bikePhoto;
        return nextErrors;
      });
      return;
    }
    setRiderPhoto(file || null);
  }

  function goBack() {
    setStatus({ message: '', tone: '' });
    setErrors({});
    setStep((current) => Math.max(1, current - 1));
  }

  async function requestOtp() {
    if (!publicConfig.otpEnabled) {
      return;
    }

    const formattedPhone = formatPhoneForOtp(values.phone);
    if (!/^(\+27)[6-8][0-9]{8}$/.test(formattedPhone)) {
      setErrors((current) => ({ ...current, phone: 'Enter a valid SA number' }));
      return;
    }

    if (!supabaseClient) {
      setOtpStatus({ message: 'Supabase phone authentication is not configured yet.', tone: 'err' });
      return;
    }

    setOtpBusy(true);
    setOtpStatus({ message: 'Sending OTP to your phone...', tone: '' });

    const { error } = await supabaseClient.auth.signInWithOtp({
      phone: formattedPhone,
      options: { shouldCreateUser: true }
    });

    setOtpBusy(false);

    if (error) {
      setOtpStatus({ message: error.message || 'Unable to send OTP right now.', tone: 'err' });
      return;
    }

    setOtpRequestedPhone(formattedPhone);
    setOtpStatus({ message: 'OTP sent. Enter the code below to verify your number.', tone: 'ok' });
  }

  async function verifyOtp() {
    if (!otpRequestedPhone) {
      setOtpStatus({ message: 'Request an OTP first.', tone: 'err' });
      return;
    }

    if (otpCode.trim().length < 6) {
      setOtpStatus({ message: 'Enter the 6-digit OTP code.', tone: 'err' });
      return;
    }

    if (!supabaseClient) {
      setOtpStatus({ message: 'Supabase phone authentication is not configured yet.', tone: 'err' });
      return;
    }

    setOtpBusy(true);
    const { error } = await supabaseClient.auth.verifyOtp({
      phone: otpRequestedPhone,
      token: otpCode.trim(),
      type: 'sms'
    });
    setOtpBusy(false);

    if (error) {
      setOtpStatus({ message: error.message || 'OTP verification failed.', tone: 'err' });
      return;
    }

    const verifiedAt = new Date().toISOString();
    setOtpVerifiedPhone(otpRequestedPhone);
    setOtpVerifiedAt(verifiedAt);
    setOtpStatus({ message: 'Phone number verified successfully.', tone: 'ok' });
    setErrors((current) => {
      if (!current.phoneVerification) {
        return current;
      }
      const nextErrors = { ...current };
      delete nextErrors.phoneVerification;
      return nextErrors;
    });
  }

  async function openTypeform() {
    if (!publicConfig.typeformFormId) {
      setSubmitting(false);
      setStatus({ message: 'Add your Typeform form ID in config.js before opening submissions.', tone: 'err' });
      return;
    }

    completedRef.current = false;

  const trafficPotential = getTrafficPotential(values);
  const minimumStandard = evaluateMinimumStandard(values);

    const hidden = {
      full_name: values.name,
      phone: values.phone,
      email: values.email,
      id_number: values.idNumber,
      platform: values.platform,
      bike_type: values.bikeType,
      bike_age: values.bikeAge,
      condition: values.condition,
      routes: values.routes,
      area: values.area,
      activity_zone: getActivityZone(values.area),
      traffic_potential: trafficPotential,
      hours: values.hours,
      quality_score: String(qualityScore),
      score_tag: getScoreTag(qualityScore),
      minimum_standard_passed: minimumStandard.passed ? 'true' : 'false',
      minimum_standard_reason: minimumStandard.reason,
      verified_phone: otpVerifiedPhone === formatPhoneForOtp(values.phone) ? 'true' : 'false',
      verified_at: otpVerifiedAt || '',
      bike_photo_name: bikePhoto?.name || '',
      rider_photo_name: riderPhoto?.name || '',
      source: 'react-website'
    };

    const popup = createPopup(publicConfig.typeformFormId, {
      hidden,
      size: 95,
      keepSession: true,
      autoClose: 1200,
      preventReopenOnClose: true,
      region: publicConfig.region,
      onClose: () => {
        if (!completedRef.current) {
          setSubmitting(false);
          setStatus({ message: 'Typeform was closed before the application was completed.', tone: 'err' });
        }
      },
      onSubmit: async ({ responseId }) => {
        try {
          completedRef.current = true;
          setStatus({ message: 'Saving files and applicant record...', tone: '' });
          await saveSubmissionRecord(values, bikePhoto, riderPhoto, responseId || '', {
            verified: otpVerifiedPhone === formatPhoneForOtp(values.phone),
            verifiedAt: otpVerifiedAt
          });
          setSubmitting(false);
          setSuccess(true);
          setStatus({ message: 'Application saved. Your verified details, photos, and rider profile are now in the review queue.', tone: 'ok' });
        } catch (error) {
          setSubmitting(false);
          setStatus({ message: 'Typeform completed, but saving to Supabase failed. Check config.js and storage setup.', tone: 'err' });
        }
      }
    });

    popup.open();
  }

  async function handlePrimaryAction() {
    setStatus({ message: '', tone: '' });
    const nextErrors = validateStep(step, values, bikePhoto);

    if (step === 1 && publicConfig.otpEnabled && otpVerifiedPhone !== formatPhoneForOtp(values.phone)) {
      nextErrors.phoneVerification = 'Verify your phone number to continue';
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      if (nextErrors.minimumStandard) {
        setStatus({ message: `Minimum standard not met: ${nextErrors.minimumStandard}.`, tone: 'err' });
      }
      if (nextErrors.phoneVerification) {
        setOtpStatus({ message: 'Verify your phone number before continuing.', tone: 'err' });
      }
      return;
    }

    if (step < TOTAL_STEPS) {
      setStep((current) => current + 1);
      return;
    }

    setSubmitting(true);
    setStatus({ message: 'Opening secure Typeform flow...', tone: '' });
    await openTypeform();
  }

  return (
    <>
      <nav className="nav" id="nav">
        <div className="nav-inner">
          <div className="nav-logo">
            GUBUDO <span>OOH</span>
          </div>
          <a href="#apply" className="nav-cta">
            Apply Now
          </a>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-bg"></div>
        <div className="hero-grid"></div>
        <div className="hero-glow"></div>
        <div className="hero-content">
          <div className="container">
            <div className="hero-grid-layout">
              <div>
                <div className="hero-eyebrow">Gauteng Rider Pilot</div>
                <h1 className="hero-headline">
                  Earn R500/month using your bike.
                  <br />
                  <span className="accent">We install the box.</span>
                </h1>
                <p className="hero-sub">
                  No cost to install. Earn more in busy areas. Limited spots in Gauteng.
                </p>
                <ul className="hero-props">
                  <li className="hero-prop">
                    <span className="prop-dot"></span>
                    We pay for the box
                  </li>
                  <li className="hero-prop">
                    <span className="prop-dot"></span>
                    R500/month guaranteed
                  </li>
                  <li className="hero-prop">
                    <span className="prop-dot"></span>
                    extra incentives in high-traffic zones
                  </li>
                  <li className="hero-prop">
                    <span className="prop-dot"></span>
                    Quick signup, fast approval
                  </li>
                </ul>
                <div className="hero-actions">
                  <a href="#apply" className="btn-primary">
                    Apply Now
                  </a>
                  <span className="hero-note">Applications reviewed daily</span>
                </div>
              </div>
              <div className="hero-card">
                <div className="card-label">Limited pilot - early riders earn more</div>
                <div className="stat-num">R500</div>
                <div className="stat-desc">Base Monthly</div>
                <div className="card-div"></div>
                <div className="card-rows">
                  <div className="card-row">
                    <span className="cr-label">Install Cost</span>
                    <span className="cr-val g">FREE</span>
                  </div>
                  <div className="card-row">
                    <span className="cr-label">Hot Zone Bonus</span>
                    <span className="cr-val y">Variable</span>
                  </div>
                  <div className="card-row">
                    <span className="cr-label">Deposit</span>
                    <span className="cr-val">R1,000 (Refundable)</span>
                  </div>
                </div>
                <div className="pilot-tag">Top riders in high-traffic zones earn more.</div>
              </div>
            </div>
          </div>
        </div>
        <div className="scroll-ind">
          <div className="scroll-line"></div>
        </div>
      </section>

      <div className="trust-bar">
        <div className="container">
          <div className="trust-inner">
            {TRUST_ITEMS.map((item, index) => (
              <div key={item} className="trust-item-wrap">
                <div className="trust-item">
                  <div className="t-check">
                    <CheckIcon />
                  </div>
                  {item}
                </div>
                {index < TRUST_ITEMS.length - 1 ? <div className="trust-sep"></div> : null}
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className="section" id="how">
        <div className="container">
          <div className="sec-label">The Process</div>
          <h2 className="sec-title">How It Works</h2>
          <div className="steps-grid">
            {PROCESS_STEPS.map((stepItem) => (
              <div key={stepItem.number} className="step fu">
                <div className="step-n">{stepItem.number}</div>
                <div className="step-t">{stepItem.title}</div>
                {stepItem.body ? <p className="step-b">{stepItem.body}</p> : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="ticker" aria-hidden="true">
        <div className="ticker-track">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, index) => (
            <span key={`${item}-${index}`} className="ticker-item">
              {item}
            </span>
          ))}
        </div>
      </div>

      <section className="section earnings" id="earnings">
        <div className="container">
          <div className="earn-grid">
            <div className="earn-copy fu">
              <div className="sec-label">What You Make</div>
              <h2 className="sec-title">
                Earnings Breakdown
              </h2>
              <p>Base Monthly: R500</p>
              <p>Hot Zone Bonus: Variable</p>
              <div className="badges">
                <span className="badge">R500 Base / Month</span>
                <span className="badge">Free Installation</span>
                <span className="badge">Hot Zone Bonus</span>
                <span className="badge">Refundable Deposit</span>
              </div>
            </div>
            <div className="fu">
              <div className="earn-table">
                <div className="e-row hdr">
                  <span className="e-lbl">Component</span>
                  <span className="e-lbl">Amount</span>
                </div>
                <div className="e-row">
                  <span className="e-lbl">Base Monthly</span>
                  <span className="e-val big">R500</span>
                </div>
                <div className="e-row">
                  <span className="e-lbl">Hot Zone Bonus</span>
                  <span className="e-val y">Variable</span>
                </div>
                <div className="e-row">
                  <span className="e-lbl">Install Cost</span>
                  <span className="e-val g">FREE</span>
                </div>
                <div className="e-row">
                  <span className="e-lbl">Deposit</span>
                  <span className="e-val">R1,000 (Refundable)</span>
                </div>
              </div>
              <p className="e-note">Top riders in high-traffic zones earn more.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section apply" id="apply">
        <div className="container">
          <div className="apply-grid">
            <div className="apply-aside fu">
              <div className="sec-label">Form Logic</div>
              <h2 className="sec-title">
                Apply Now
              </h2>
              <p>Quick signup, fast approval.</p>
              <ul className="perks">
                {PERKS.map((perk) => (
                  <li key={perk.title} className="perk">
                    <div className="perk-ico">{perk.icon}</div>
                    <div className="perk-txt">
                      <strong>{perk.title}</strong>
                      <span>{perk.text}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="form-card fu">
              {!success ? (
                <>
                  <div className="prog" id="prog">
                    <div className="prog-steps">
                      {[1, 2, 3, 4].map((stepNumber) => (
                        <div key={stepNumber} className="prog-step">
                          <div className={`ps-d${stepNumber < step ? ' done' : stepNumber === step ? ' active' : ''}`}>
                            {stepNumber < step ? <CheckIcon /> : stepNumber}
                          </div>
                          {stepNumber < TOTAL_STEPS ? <div className={`ps-l${stepNumber < step ? ' done' : ''}`}></div> : null}
                        </div>
                      ))}
                    </div>
                    <div className="prog-lbl-row">
                      {['Personal', 'Your Bike', 'Location', 'Photos'].map((label, index) => (
                        <span key={label} className={`prog-lbl${index + 1 === step ? ' active' : ''}`}>
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className={`fstep${step === 1 ? ' active' : ''}`}>
                    <div className="fstep-h">Personal Details</div>
                    <div className="fstep-s">Phone Number (PRIMARY contact)</div>
                    <div className="fgrid">
                      <div className="ff full">
                        <label htmlFor="i-name">
                          Full Name <span className="req">*</span>
                        </label>
                        <input
                          id="i-name"
                          type="text"
                          className={errors.name ? 'err' : ''}
                          autoComplete="name"
                          placeholder="e.g. Sipho Dlamini"
                          value={values.name}
                          onChange={(event) => updateValue('name', event.target.value)}
                        />
                        <div className="ferr" style={{ display: errors.name ? 'block' : 'none' }}>
                          {errors.name}
                        </div>
                      </div>
                      <div className="ff">
                        <label htmlFor="i-phone">
                          Phone Number <span className="req">*</span>
                        </label>
                        <input
                          id="i-phone"
                          type="tel"
                          className={errors.phone ? 'err' : ''}
                          autoComplete="tel"
                          placeholder="e.g. 082 000 0000"
                          inputMode="tel"
                          value={values.phone}
                          onChange={(event) => updateValue('phone', event.target.value)}
                        />
                        <div className="ferr" style={{ display: errors.phone ? 'block' : 'none' }}>
                          {errors.phone}
                        </div>
                        <div className="otp-box">
                          <div className="otp-actions">
                            <button type="button" className="otp-btn" disabled={otpBusy} onClick={requestOtp}>
                              {otpBusy ? 'Sending...' : otpRequestedPhone === formatPhoneForOtp(values.phone) ? 'Resend OTP' : 'Send OTP'}
                            </button>
                            <span className={`otp-chip${otpVerifiedPhone === formatPhoneForOtp(values.phone) ? ' ok' : ''}`}>
                              {otpVerifiedPhone === formatPhoneForOtp(values.phone) ? 'Verified' : 'Verification Required'}
                            </span>
                          </div>
                          <div className="otp-input-row">
                            <input
                              type="text"
                              inputMode="numeric"
                              maxLength={6}
                              placeholder="Enter OTP"
                              value={otpCode}
                              onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, ''))}
                            />
                            <button type="button" className="otp-btn secondary" disabled={otpBusy} onClick={verifyOtp}>
                              Verify
                            </button>
                          </div>
                          <div className={`otp-status${otpStatus.tone ? ` ${otpStatus.tone}` : ''}`} aria-live="polite">
                            {otpStatus.message}
                          </div>
                          <div className="ferr" style={{ display: errors.phoneVerification ? 'block' : 'none' }}>
                            {errors.phoneVerification}
                          </div>
                        </div>
                      </div>
                      <div className="ff">
                        <label htmlFor="i-email">
                          Email Address <span className="req">*</span>
                        </label>
                        <input
                          id="i-email"
                          type="email"
                          className={errors.email ? 'err' : ''}
                          autoComplete="email"
                          placeholder="you@email.com"
                          inputMode="email"
                          value={values.email}
                          onChange={(event) => updateValue('email', event.target.value)}
                        />
                        <div className="ferr" style={{ display: errors.email ? 'block' : 'none' }}>
                          {errors.email}
                        </div>
                      </div>
                      <div className="ff full">
                        <label htmlFor="i-id">
                          SA ID Number <span className="req">*</span>
                        </label>
                        <input
                          id="i-id"
                          type="text"
                          className={errors.idNumber ? 'err' : ''}
                          placeholder="13-digit ID number"
                          maxLength={13}
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={values.idNumber}
                          onChange={(event) => updateValue('idNumber', event.target.value)}
                        />
                        <div className="ferr" style={{ display: errors.idNumber ? 'block' : 'none' }}>
                          {errors.idNumber}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`fstep${step === 2 ? ' active' : ''}`}>
                    <div className="fstep-h">Bike &amp; Work</div>
                    <div className="fstep-s">Delivery Platform, Type of Bike, Bike Age, Condition, Daily Routes / Areas</div>
                    <div className="fgrid">
                      <div className="ff full">
                        <label htmlFor="i-platform">
                          Delivery Platform <span className="req">*</span>
                        </label>
                        <select id="i-platform" className={errors.platform ? 'err' : ''} value={values.platform} onChange={(event) => updateValue('platform', event.target.value)}>
                          <option value="">Select your main platform</option>
                          {PLATFORM_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                        <div className="ferr" style={{ display: errors.platform ? 'block' : 'none' }}>
                          {errors.platform}
                        </div>
                      </div>
                      <div className="ff">
                        <label htmlFor="i-bike-type">
                          Bike Type <span className="req">*</span>
                        </label>
                        <select id="i-bike-type" className={errors.bikeType ? 'err' : ''} value={values.bikeType} onChange={(event) => updateValue('bikeType', event.target.value)}>
                          <option value="">Select type</option>
                          {BIKE_TYPE_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                        <div className="ferr" style={{ display: errors.bikeType ? 'block' : 'none' }}>
                          {errors.bikeType}
                        </div>
                      </div>
                      <div className="ff">
                        <label htmlFor="i-bike-age">
                          Bike Age <span className="req">*</span>
                        </label>
                        <select id="i-bike-age" className={errors.bikeAge ? 'err' : ''} value={values.bikeAge} onChange={(event) => updateValue('bikeAge', event.target.value)}>
                          <option value="">Select age</option>
                          {BIKE_AGE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <div className="ferr" style={{ display: errors.bikeAge ? 'block' : 'none' }}>
                          {errors.bikeAge}
                        </div>
                      </div>
                      <div className="ff full">
                        <label>
                          Bike Condition <span className="req">*</span>
                        </label>
                        <div className="radio-row">
                          {CONDITION_OPTIONS.map((option) => {
                            const radioId = `cond-${option.toLowerCase()}`;
                            return (
                              <div key={option} className="ropt">
                                <input
                                  id={radioId}
                                  type="radio"
                                  name="cond"
                                  value={option}
                                  checked={values.condition === option}
                                  onChange={(event) => updateValue('condition', event.target.value)}
                                />
                                <label htmlFor={radioId}>{option}</label>
                              </div>
                            );
                          })}
                        </div>
                        <div className="ferr" style={{ display: errors.condition ? 'block' : 'none' }}>
                          {errors.condition}
                        </div>
                      </div>
                      <div className="ff full">
                        <label htmlFor="i-routes">Daily Routes / Areas You Ride</label>
                        <textarea
                          id="i-routes"
                          placeholder="e.g. Sandton CBD, Rosebank, Melrose Arch - ride daily from 8am to 8pm..."
                          value={values.routes}
                          onChange={(event) => updateValue('routes', event.target.value)}
                        ></textarea>
                        <div className="ferr" style={{ display: errors.routes ? 'block' : 'none' }}>
                          {errors.routes}
                        </div>
                        <div className="ferr" style={{ display: errors.minimumStandard ? 'block' : 'none' }}>
                          {errors.minimumStandard}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`fstep${step === 3 ? ' active' : ''}`}>
                    <div className="fstep-h">Location</div>
                    <div className="fstep-s">Area (Dropdown: Gauteng zones) and Typical working hours</div>
                    <div className="fgrid one">
                      <div className="ff">
                        <label htmlFor="i-area">
                          Gauteng Area <span className="req">*</span>
                        </label>
                        <select id="i-area" className={errors.area ? 'err' : ''} value={values.area} onChange={(event) => updateValue('area', event.target.value)}>
                          <option value="">Select your zone</option>
                          {AREA_OPTIONS.map((group) => (
                            <optgroup key={group.label} label={group.label}>
                              {group.values.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                        <div className="ferr" style={{ display: errors.area ? 'block' : 'none' }}>
                          {errors.area}
                        </div>
                      </div>
                      <div className="ff">
                        <label htmlFor="i-hours">
                          Typical Working Hours <span className="req">*</span>
                        </label>
                        <select id="i-hours" className={errors.hours ? 'err' : ''} value={values.hours} onChange={(event) => updateValue('hours', event.target.value)}>
                          <option value="">Select your schedule</option>
                          {HOURS_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                        <div className="ferr" style={{ display: errors.hours ? 'block' : 'none' }}>
                          {errors.hours}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`fstep${step === 4 ? ' active' : ''}`}>
                    <div className="fstep-h">Uploads</div>
                    <div className="fstep-s">Photo of bike (REQUIRED). Optional: rider + bike</div>
                    <div className="fgrid one">
                      <div className="ff">
                        <label>
                          Photo of Your Bike <span className="req">*</span>
                        </label>
                        <div className="upbox">
                          <input type="file" accept="image/*" onChange={(event) => updateFile('bike', event.target.files?.[0] || null)} />
                          <div className="up-ico">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                            </svg>
                          </div>
                          <div className="up-lbl">Tap to upload bike photo</div>
                          <div className="up-hint">JPG, PNG, WEBP - max 10MB</div>
                          <div className="up-name">{bikePhoto?.name || ''}</div>
                        </div>
                        <div className="ferr" style={{ display: errors.bikePhoto ? 'block' : 'none' }}>
                          {errors.bikePhoto}
                        </div>
                      </div>
                      <div className="ff">
                        <label>
                          Photo of Rider + Bike <span className="opt-tag">Optional</span>
                        </label>
                        <div className="upbox">
                          <input type="file" accept="image/*" onChange={(event) => updateFile('rider', event.target.files?.[0] || null)} />
                          <div className="up-ico">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                              <circle cx="12" cy="7" r="4" />
                            </svg>
                          </div>
                          <div className="up-lbl">Tap to upload rider photo</div>
                          <div className="up-hint">Optional - helps with approval</div>
                          <div className="up-name">{riderPhoto?.name || ''}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`form-status${status.tone ? ` ${status.tone}` : ''}`} aria-live="polite">
                    {status.message}
                  </div>

                  <div className="fnav">
                    <button type="button" className="btn-back" style={{ visibility: step > 1 ? 'visible' : 'hidden' }} onClick={goBack}>
                      Back
                    </button>
                    <button type="button" className={step === TOTAL_STEPS ? 'btn-submit' : 'btn-next'} disabled={submitting} onClick={handlePrimaryAction}>
                      {submitting ? 'Sending...' : buttonText}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="fsuccess" style={{ display: 'block' }}>
                    <div className="sico">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </div>
                    <div className="stitle">Application Received</div>
                    <p className="smsg">
                      We will review your application and contact you on the phone number provided.
                    </p>
                  </div>
                  <div className="form-status ok" aria-live="polite">
                    {status.message}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <div className="foot-inner">
            <div className="foot-logo">
              GUBUDO <span>OOH</span>
            </div>
            <span className="foot-copy">2026 GUBUDO OOH. Gauteng, South Africa.</span>
            <a href="mailto:info@gubudo.co.za" className="foot-link">
              info@gubudo.co.za
            </a>
          </div>
        </div>
      </footer>

      <div className="mobile-cta">
        <a href="#apply" className="btn-primary">
          Apply Now
        </a>
      </div>
    </>
  );
}
