export const SAVE_KEY = 'gubudo_draft';
export const SUBMISSIONS_KEY = 'gubudo_submissions';
export const channel = 'BroadcastChannel' in window ? new BroadcastChannel('gubudo-ooh-live') : null;

export function loadStoredSubmissions() {
  try {
    return JSON.parse(localStorage.getItem(SUBMISSIONS_KEY) || '[]');
  } catch (error) {
    return [];
  }
}

export function upsertLocalSubmission(submission) {
  const existing = loadStoredSubmissions();
  const index = existing.findIndex((item) => String(item.id) === String(submission.id));
  if (index >= 0) {
    existing[index] = submission;
  } else {
    existing.push(submission);
  }
  localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(existing));
  if (channel) {
    channel.postMessage({ type: 'submission-created', payload: submission });
  }
}

export function saveDraft(draft) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(draft));
}

export function loadDraft() {
  try {
    return JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
  } catch (error) {
    return null;
  }
}

export function clearDraft() {
  localStorage.removeItem(SAVE_KEY);
}
