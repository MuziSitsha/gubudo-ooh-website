import { useEffect, useMemo, useRef, useState } from 'react';
import { createPopup } from '@typeform/embed';
import '@typeform/embed/build/css/popup.css';
import './landing.css';
import { publicConfig, supabaseClient } from './lib/publicConfig.js';
import { clearDraft, loadDraft, saveDraft, upsertLocalSubmission } from './lib/submissions.js';
import fleetCityImage from './assets/landing/fleet-city.jpg';
import studioBikeImage from './assets/landing/studio-bike.jpg';
import cityRiderImage from './assets/landing/city-rider.jpg';
import motionPackshotImage from './assets/landing/motion-packshot.jpg';
import parkingProofImage from './assets/landing/parking-proof.jpg';

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

const HERO_IMAGES = [
  {
    src: fleetCityImage,
    alt: 'A small fleet of Gubudo delivery riders in traffic with branded ad boxes mounted on their bikes.',
    kicker: 'Fleet Visibility',
    title: 'Built to stand out in real Gauteng traffic.',
    copy: 'A clean, premium-looking box matters because riders need fast approval and brands need confidence.'
  },
  {
    src: parkingProofImage,
    alt: 'A Gubudo rider parked with several branded bikes visible in the background.',
    kicker: 'Brand Presence',
    title: 'Professional enough for advertisers, practical enough for riders.',
    copy: 'The setup looks credible on the road, in parking lots, and at delivery pickup points where visibility matters.'
  },
  {
    src: cityRiderImage,
    alt: 'A Gubudo rider on a scooter in city traffic with a large branded delivery box.',
    kicker: 'Street Ready',
    title: 'One rider. One bike. One highly visible moving asset.',
    copy: 'This is the real-world proof that riders can earn from the same routes they already work every day.'
  },
  {
    src: motionPackshotImage,
    alt: 'A moving Gubudo rider with two more branded riders following behind.',
    kicker: 'Daily Exposure',
    title: 'Seen on the move, not hidden in a static billboard corner.',
    copy: 'Riders spend hours in active zones, which is exactly where your best applications create the most value.'
  },
  {
    src: studioBikeImage,
    alt: 'A polished studio-style render of a Gubudo rider on a branded bike.',
    kicker: 'Premium Finish',
    title: 'A cleaner product story from first glance to final install.',
    copy: 'The system should feel premium, organized, and reliable from the very first click on the landing page.'
  }
];

const PROOF_CARDS = [
  {
    src: motionPackshotImage,
    alt: 'A Gubudo rider in motion on the road with branded bikes behind.',
    label: 'High-Traffic Proof',
    title: 'Designed for active delivery routes.',
    text: 'Riders in busy zones create stronger visibility and better earning potential.'
  },
  {
    src: parkingProofImage,
    alt: 'A Gubudo rider parked beside a branded bike while other branded bikes stand in the background.',
    label: 'Clean Brand Standard',
    title: 'A setup that looks advertiser-ready.',
    text: 'Sharp branding helps the pilot feel serious, premium, and easier to trust.'
  },
  {
    src: studioBikeImage,
    alt: 'A studio-style branded Gubudo rider on a motorbike.',
    label: 'Professional Finish',
    title: 'Polished enough to sell the vision fast.',
    text: 'The page now shows the box as a real product, not just a concept.'
  }
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
  'Johannesburg CBD',
  'Sandton / Rosebank',
  'Soweto',
  'Randburg / Roodepoort',
  'East Rand (Boksburg / Germiston)',
  'South Johannesburg',
  'Pretoria CBD',
  'Centurion',
  'Pretoria East (Menlyn / Faerie Glen)',
  'Pretoria North / West',
  'Midrand',
  'Vaal / Vanderbijlpark',
  'Krugersdorp / Mogale City',
  'Other Gauteng'
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
  const [bikePreview, riderPreview] = await Promise.all([
    readFilePreview(bikePhoto),
    readFilePreview(riderPhoto)
  ]);
  let bikeUpload = { name: bikePhoto?.name || '', path: '', url: '' };
  let riderUpload = { name: riderPhoto?.name || '', path: '', url: '' };

  try {
    [bikeUpload, riderUpload] = await Promise.all([
      uploadPhoto(bikePhoto, submissionId, 'bike'),
      uploadPhoto(riderPhoto, submissionId, 'rider')
    ]);
  } catch (error) {
  }

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
    source: 'website'
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

    const { error } = await supabaseClient.from(publicConfig.table).insert(payload);
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

async function saveUploadOnlyStep({ responseId, bikePhoto, riderPhoto }) {
  if (!responseId) {
    throw new Error('Missing Typeform response ID');
  }

  const [bikePreview, riderPreview] = await Promise.all([
    readFilePreview(bikePhoto),
    readFilePreview(riderPhoto)
  ]);

  let bikeUpload = { name: bikePhoto?.name || '', path: '', url: bikePreview };
  let riderUpload = { name: riderPhoto?.name || '', path: '', url: riderPreview };

  try {
    [bikeUpload, riderUpload] = await Promise.all([
      uploadPhoto(bikePhoto, responseId, 'bike'),
      uploadPhoto(riderPhoto, responseId, 'rider')
    ]);
  } catch (error) {
  }

  if (!supabaseClient) {
    throw new Error('Supabase is not configured');
  }

  const payload = {
    typeform_response_id: responseId,
    bike_photo_name: bikeUpload.name || bikePhoto?.name || '',
    rider_photo_name: riderUpload.name || riderPhoto?.name || '',
    bike_photo_path: bikeUpload.path || '',
    rider_photo_path: riderUpload.path || '',
    bike_photo_url: bikeUpload.url || bikePreview,
    rider_photo_url: riderUpload.url || riderPreview,
    status: 'Pending'
  };

  const { error: insertError } = await supabaseClient.from('application_photo_uploads').insert(payload);
  if (insertError) {
    const isDuplicate = String(insertError.message || '').toLowerCase().includes('duplicate') || insertError.code === '23505';
    if (!isDuplicate) {
      throw insertError;
    }

    const { error: updateError } = await supabaseClient
      .from('application_photo_uploads')
      .update(payload)
      .eq('typeform_response_id', responseId);

    if (updateError) {
      throw updateError;
    }
  }

  if (publicConfig.supabaseUrl && publicConfig.supabaseAnonKey) {
    try {
      await fetch(`${publicConfig.supabaseUrl}/functions/v1/sync-photo-uploads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: publicConfig.supabaseAnonKey,
          Authorization: `Bearer ${publicConfig.supabaseAnonKey}`
        },
        body: JSON.stringify({ typeformResponseId: responseId })
      });
    } catch (error) {
    }
  }

  return payload;
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
  const [typeformResponseId, setTypeformResponseId] = useState('');
  const [uploadReady, setUploadReady] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({ message: '', tone: '' });
  const [activeHeroImage, setActiveHeroImage] = useState(0);
  const typeformCompletedRef = useRef(false);
  const formattedPhone = formatPhoneForOtp(values.phone);
  const phoneVerified = !publicConfig.otpEnabled || (formattedPhone && otpVerifiedPhone === formattedPhone);
  const currentHeroImage = HERO_IMAGES[activeHeroImage];

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

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveHeroImage((current) => (current + 1) % HERO_IMAGES.length);
    }, 4500);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

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
    setOtpCode('');
    setOtpStatus({ message: 'Phone number verified successfully.', tone: 'ok' });
    try {
      await supabaseClient.auth.signOut();
    } catch (_error) {
    }
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
      setStatus({ message: 'Add your Typeform form ID in config.js before opening applications.', tone: 'err' });
      return;
    }

    typeformCompletedRef.current = false;

    const popup = createPopup(publicConfig.typeformFormId, {
      size: 95,
      keepSession: true,
      autoClose: 1200,
      preventReopenOnClose: true,
      region: publicConfig.region,
      hidden: {
        verified_phone: publicConfig.otpEnabled && phoneVerified ? (otpVerifiedPhone || formattedPhone || '') : '',
        verified_at: publicConfig.otpEnabled && phoneVerified ? otpVerifiedAt || '' : '',
        phone_verified: publicConfig.otpEnabled && phoneVerified ? 'true' : 'false'
      },
      onClose: () => {
        setSubmitting(false);
        if (!typeformCompletedRef.current) {
          setStatus({ message: 'Complete the Typeform application first, then continue below to upload the required images.', tone: 'err' });
        }
      },
      onSubmit: ({ responseId }) => {
        typeformCompletedRef.current = true;
        setTypeformResponseId(responseId || '');
        setUploadReady(true);
        setSubmitting(false);
        setStatus({ message: 'Application form completed. Please upload the required photos to finish your review.', tone: 'ok' });
      }
    });

    popup.open();
  }

  async function handleUploadOnlySubmit() {
    const nextErrors = validateStep(4, values, bikePhoto);
    setErrors(nextErrors);
    if (nextErrors.bikePhoto) {
      setUploadStatus({ message: nextErrors.bikePhoto, tone: 'err' });
      return;
    }

    if (!typeformResponseId) {
      setUploadStatus({ message: 'Complete the Typeform application first.', tone: 'err' });
      return;
    }

    setSubmitting(true);
    setUploadStatus({ message: 'Uploading your photos...', tone: '' });

    try {
      await saveUploadOnlyStep({ responseId: typeformResponseId, bikePhoto, riderPhoto });
      clearDraft();
      setSubmitting(false);
      setSuccess(true);
      setUploadStatus({ message: 'Photos uploaded successfully. Your application is complete and ready for review.', tone: 'ok' });
    } catch (error) {
      setSubmitting(false);
      setUploadStatus({ message: error instanceof Error ? error.message : 'Photo upload failed. Check Supabase storage and try again.', tone: 'err' });
    }
  }

  async function handlePrimaryAction() {
    setStatus({ message: '', tone: '' });

    if (publicConfig.otpEnabled) {
      const nextErrors = {};

      if (!/^(\+27)[6-8][0-9]{8}$/.test(formattedPhone)) {
        nextErrors.phone = 'Enter a valid SA number';
      }

      if (!phoneVerified) {
        nextErrors.phoneVerification = 'Verify this phone number before continuing';
      }

      if (Object.keys(nextErrors).length) {
        setErrors((current) => ({ ...current, ...nextErrors }));
        setStatus({ message: 'Verify your phone number before opening the application form.', tone: 'err' });
        return;
      }
    }

    setSubmitting(true);
    setStatus({ message: 'Opening application form...', tone: '' });
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
                  <span className="headline-main">Earn R500/month using your bike.</span>
                  <br />
                  <span className="accent headline-accent">We install the box.</span>
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
              <div className="hero-visual fu">
                <div className="hero-media-frame">
                  <img
                    src={currentHeroImage.src}
                    alt={currentHeroImage.alt}
                    className="hero-media-image"
                    loading="eager"
                    fetchPriority="high"
                  />
                  <div className="hero-media-badge">
                    {String(activeHeroImage + 1).padStart(2, '0')} / {String(HERO_IMAGES.length).padStart(2, '0')}
                  </div>
                  <div className="hero-media-copy">
                    <div className="card-label">{currentHeroImage.kicker}</div>
                    <div className="hero-media-title">{currentHeroImage.title}</div>
                    <p>{currentHeroImage.copy}</p>
                  </div>
                </div>
                <div className="hero-card hero-metrics">
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
                <div className="hero-thumbs" aria-label="Gubudo rider gallery">
                  {HERO_IMAGES.map((image, index) => (
                    <button
                      key={image.title}
                      type="button"
                      className={`hero-thumb${index === activeHeroImage ? ' active' : ''}`}
                      onClick={() => setActiveHeroImage(index)}
                      aria-pressed={index === activeHeroImage}
                    >
                      <img src={image.src} alt={image.alt} />
                      <span>{image.kicker}</span>
                    </button>
                  ))}
                </div>
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

      <section className="section proof">
        <div className="container">
          <div className="proof-head">
            <div className="fu">
              <div className="sec-label">Visual Proof</div>
              <h2 className="sec-title">Show the product like it already works.</h2>
            </div>
            <p className="proof-copy fu">
              These visuals make the model easier to understand fast: branded boxes, real road presence, and a setup that feels credible enough for riders and operations to trust.
            </p>
          </div>
          <div className="proof-grid">
            {PROOF_CARDS.map((item) => (
              <article key={item.title} className="proof-card fu">
                <img src={item.src} alt={item.alt} className="proof-card-image" loading="lazy" />
                <div className="proof-card-body">
                  <div className="proof-card-label">{item.label}</div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

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
                  <div className="fstep active">
                    <div className="fstep-h">Verify Your Phone First</div>
                    <div className="fstep-s">Use your real South African mobile number. Once verified, the Typeform application opens and your verified number is passed through with the submission.</div>
                    <div className="fgrid one">
                      <div className="ff">
                        <label>
                          Mobile Number <span className="req">*</span>
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          inputMode="tel"
                          value={values.phone}
                          onChange={(event) => updateValue('phone', event.target.value)}
                          placeholder="082 123 4567 or +27821234567"
                          autoComplete="tel-national"
                          enterKeyHint="done"
                        />
                        <div className="ferr" style={{ display: errors.phone ? 'block' : 'none' }}>
                          {errors.phone}
                        </div>
                      </div>
                    </div>
                    <div className="otp-box">
                      <div className="otp-actions">
                        <span className={`otp-chip${phoneVerified ? ' ok' : ''}`}>
                          {phoneVerified ? 'Phone verified' : 'Verification required'}
                        </span>
                        <button type="button" className="otp-btn secondary" disabled={otpBusy} onClick={requestOtp}>
                          {otpBusy ? 'Sending...' : otpRequestedPhone === formattedPhone && otpRequestedPhone ? 'Resend OTP' : 'Send OTP'}
                        </button>
                      </div>
                      <div className="otp-input-row">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={otpCode}
                          onChange={(event) => setOtpCode(event.target.value.replace(/\D+/g, '').slice(0, 6))}
                          placeholder="Enter 6-digit OTP"
                          maxLength={6}
                        />
                        <button type="button" className="otp-btn" disabled={otpBusy || !otpRequestedPhone || otpCode.trim().length < 6} onClick={verifyOtp}>
                          {otpBusy ? 'Checking...' : 'Verify OTP'}
                        </button>
                      </div>
                      <div className={`otp-status${otpStatus.tone ? ` ${otpStatus.tone}` : ''}`} aria-live="polite">
                        {otpStatus.message || 'This number must match the one you use inside the application form.'}
                      </div>
                      <div className="ferr" style={{ display: errors.phoneVerification ? 'block' : 'none' }}>
                        {errors.phoneVerification}
                      </div>
                    </div>
                    <div className={`form-status${status.tone ? ` ${status.tone}` : ''}`} aria-live="polite">{status.message}</div>
                    <div className="fnav">
                      <button type="button" className="btn-submit" disabled={submitting} onClick={handlePrimaryAction}>
                        {submitting ? 'Opening...' : 'Open Verified Application'}
                      </button>
                    </div>
                  </div>

                  <div className={`fstep${uploadReady ? ' active' : ''}`}>
                    <div className="fstep-h">Uploads</div>
                    <div className="fstep-s">Final step after Typeform: upload the required bike photos to complete your review.</div>
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
                    <div className={`form-status${uploadStatus.tone ? ` ${uploadStatus.tone}` : ''}`} aria-live="polite">
                      {uploadStatus.message}
                    </div>
                    <div className="fnav">
                      <button type="button" className="btn-submit" disabled={submitting || !uploadReady} onClick={handleUploadOnlySubmit}>
                        {submitting ? 'Uploading...' : 'Complete Photo Upload'}
                      </button>
                    </div>
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
                    {uploadStatus.message || status.message}
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
            <a href="mailto:sales@gubudo.com" className="foot-link">
              sales@gubudo.com
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
