// fetch wrapper for the Node API. Errors carry .status and .errors (field -> message) from validation.
export async function api(path, opts = {}) {
  const isForm = typeof FormData !== 'undefined' && opts.body instanceof FormData;
  const res = await fetch(`/api${path}`, {
    method: opts.method || 'GET',
    headers: opts.body !== undefined && !isForm ? { 'Content-Type': 'application/json' } : undefined,
    body: opts.body === undefined ? undefined : isForm ? opts.body : JSON.stringify(opts.body),
    credentials: 'same-origin',
  });
  let data = null;
  try { data = await res.json(); } catch { /* empty */ }
  if (!res.ok) {
    const err = new Error((data && data.error) || `Request failed (${res.status})`);
    err.status = res.status;
    err.errors = data && data.errors;
    throw err;
  }
  return data;
}

// Form option lists from GET /api/meta, fetched once.
let metaPromise;
export const meta = () => (metaPromise = metaPromise || api('/meta'));
