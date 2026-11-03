// Uses configurable environment variable for deployment (Vercel, Netlify, Render, etc.)
// Defaults to relative '/api' which works seamlessly with Vite dev proxy and unified production servers.
const API_BASE = (import.meta.env && import.meta.env.VITE_API_BASE_URL) ? import.meta.env.VITE_API_BASE_URL : '/api';

/**
 * Builds query params from filters object
 */
function buildQueryString(filters = {}) {
  const params = new URLSearchParams();
  if (filters.dataset_id) params.append('dataset_id', filters.dataset_id);
  if (filters.age_min !== undefined) params.append('age_min', filters.age_min);
  if (filters.age_max !== undefined) params.append('age_max', filters.age_max);
  if (filters.gender && filters.gender !== 'all') params.append('gender', filters.gender);
  if (filters.platform && filters.platform !== 'all') params.append('platform', filters.platform);
  if (filters.social_media_min !== undefined) params.append('social_media_min', filters.social_media_min);
  if (filters.social_media_max !== undefined) params.append('social_media_max', filters.social_media_max);
  return params.toString();
}

export async function fetchDatasets() {
  const res = await fetch(`${API_BASE}/datasets`);
  if (!res.ok) throw new Error(`Failed to load dataset list (${res.status})`);
  return await res.json();
}

export async function uploadDatasetFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/datasets/upload`, {
    method: 'POST',
    body: formData
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || `Upload failed with status ${res.status}`);
  }
  return json.inspection;
}

export async function applyColumnMapping(sessionId, mapping, scaleConfig, customName) {
  const res = await fetch(`${API_BASE}/datasets/map`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      mapping: mapping,
      scale_config: scaleConfig,
      custom_name: customName
    })
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || `Failed to apply column mapping (${res.status})`);
  }
  return json;
}

export async function switchActiveDataset(datasetId) {
  const res = await fetch(`${API_BASE}/datasets/switch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataset_id: datasetId })
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || `Failed to switch dataset (${res.status})`);
  }
  return json;
}

export async function deleteUploadedDataset() {
  const res = await fetch(`${API_BASE}/datasets/uploaded`, {
    method: 'DELETE'
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || `Failed to delete dataset (${res.status})`);
  }
  return json;
}

export async function fetchFilterOptions(datasetId) {
  const qs = datasetId ? `?dataset_id=${encodeURIComponent(datasetId)}` : '';
  const res = await fetch(`${API_BASE}/filter-options${qs}`);
  if (!res.ok) throw new Error(`Failed to load filter options (${res.status})`);
  const json = await res.json();
  return json.data;
}

export async function fetchOverview(filters = {}) {
  const res = await fetch(`${API_BASE}/overview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filters, dataset_id: filters.dataset_id })
  });
  if (!res.ok) throw new Error(`Failed to load overview data (${res.status})`);
  const json = await res.json();
  return json.data;
}

export async function fetchSocialMedia(filters = {}) {
  const res = await fetch(`${API_BASE}/social-media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filters, dataset_id: filters.dataset_id })
  });
  if (!res.ok) throw new Error(`Failed to load social media analytics (${res.status})`);
  const json = await res.json();
  return json.data;
}

export async function fetchAcademic(filters = {}) {
  const res = await fetch(`${API_BASE}/academic`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filters, dataset_id: filters.dataset_id })
  });
  if (!res.ok) throw new Error(`Failed to load academic analytics (${res.status})`);
  const json = await res.json();
  return json.data;
}

export async function fetchWellbeing(filters = {}) {
  const res = await fetch(`${API_BASE}/wellbeing`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filters, dataset_id: filters.dataset_id })
  });
  if (!res.ok) throw new Error(`Failed to load well-being analytics (${res.status})`);
  const json = await res.json();
  return json.data;
}

export async function fetchInsights(filters = {}) {
  const res = await fetch(`${API_BASE}/insights`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filters, dataset_id: filters.dataset_id })
  });
  if (!res.ok) throw new Error(`Failed to load data insights (${res.status})`);
  const json = await res.json();
  return json.data;
}

export async function fetchSummaryReport(filters = {}) {
  const res = await fetch(`${API_BASE}/summary-report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filters, dataset_id: filters.dataset_id })
  });
  if (!res.ok) throw new Error(`Failed to load summary report (${res.status})`);
  const json = await res.json();
  return json;
}

export function downloadAggregateCsv(filters = {}) {
  const qs = buildQueryString(filters);
  const url = `${API_BASE}/export-csv${qs ? `?${qs}` : ''}`;
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'wellbeing_analytics_aggregate.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
