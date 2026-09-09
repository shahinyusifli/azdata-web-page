const KINDS = { demo: 'Demo request', application: 'Job application', cv: 'Open application', referral: 'Referral' };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_FILE_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
    const cors = corsHeaders(allowed.includes(origin) ? origin : allowed[0] || '*');

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405, cors);
    if (!allowed.includes(origin)) return json({ error: 'Origin not allowed' }, 403, cors);
    if (!env.RESEND_API_KEY || !env.TO_EMAIL) return json({ error: 'Server not configured' }, 500, cors);

    let fields = {};
    const attachments = [];
    const maxFile = Number(env.MAX_FILE_BYTES || 5242880);
    const contentType = request.headers.get('Content-Type') || '';

    try {
      if (contentType.includes('multipart/form-data')) {
        const fd = await request.formData();
        for (const [key, value] of fd.entries()) {
          if (typeof value === 'string') { fields[key] = value.trim(); continue; }
          if (!value.size) continue;
          if (value.size > maxFile) return json({ error: 'File is too large (max 5 MB)' }, 413, cors);
          if (!ALLOWED_FILE_TYPES.includes(value.type)) return json({ error: 'Only PDF or Word files are accepted' }, 415, cors);
          attachments.push({ filename: sanitizeFilename(value.name), content: await toBase64(value) });
        }
      } else if (contentType.includes('application/json')) {
        fields = await request.json();
      } else {
        return json({ error: 'Unsupported content type' }, 415, cors);
      }
    } catch (e) {
      return json({ error: 'Could not read submission' }, 400, cors);
    }

    if (fields.website) return json({ ok: true }, 200, cors); // honeypot: bots fill the hidden field
    if (!fields.name) return json({ error: 'Name is required' }, 400, cors);
    if (!fields.email || !EMAIL_RE.test(fields.email)) return json({ error: 'A valid email is required' }, 400, cors);

    const kind = KINDS[fields.form] ? fields.form : 'demo';
    const subject = buildSubject(kind, fields);
    const text = buildBody(kind, fields, attachments, request);

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.FROM_EMAIL || 'AZ Data Forms <onboarding@resend.dev>',
        to: [env.TO_EMAIL],
        reply_to: fields.email,
        subject,
        text,
        attachments: attachments.length ? attachments : undefined,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error('Resend error', res.status, detail);
      return json({ error: 'Could not send right now. Please try again in a minute.' }, 502, cors);
    }
    return json({ ok: true }, 200, cors);
  },
};

function buildSubject(kind, f) {
  switch (kind) {
    case 'application': return `Application: ${f.role || 'unspecified role'} — ${f.name}`;
    case 'cv': return `Open application — ${f.name}`;
    case 'referral': return `Referral: ${f.candidate_name || 'candidate'} (from ${f.name})`;
    default: return `Demo request — ${f.name}${f.company ? ` (${f.company})` : ''}`;
  }
}

function buildBody(kind, f, attachments, request) {
  const skip = new Set(['form', 'website', 'page']);
  const lines = [`${KINDS[kind]} via azdata.app`, ''];
  for (const [k, v] of Object.entries(f)) {
    if (skip.has(k) || v === '') continue;
    lines.push(`${label(k)}: ${v}`);
  }
  if (attachments.length) lines.push('', `Attachments: ${attachments.map(a => a.filename).join(', ')}`);
  lines.push('', `Page: ${f.page || '-'}`, `Country: ${request.headers.get('CF-IPCountry') || '-'}`, `Sent: ${new Date().toISOString()}`);
  return lines.join('\n');
}

function label(key) { return key.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()); }
function sanitizeFilename(name) { return (name || 'attachment').replace(/[^\w.\- ]+/g, '_').slice(0, 120); }

async function toBase64(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function json(data, status, headers) {
  return new Response(JSON.stringify(data), { status, headers: { ...headers, 'Content-Type': 'application/json' } });
}
