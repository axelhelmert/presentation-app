import { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  api: {
    responseLimit: '25mb',
  },
};

const MAX_BYTES = 25 * 1024 * 1024;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const raw = req.query.url;
  const target = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : '';

  if (!target) {
    res.status(400).json({ error: 'Missing url parameter' });
    return;
  }

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    res.status(400).json({ error: 'Invalid url' });
    return;
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    res.status(400).json({ error: 'Only http(s) urls are allowed' });
    return;
  }

  try {
    const upstream = await fetch(parsed.toString(), {
      redirect: 'follow',
      headers: {
        // Some CDNs serve different content (or 403) without a UA.
        'User-Agent': 'presentation-app-image-proxy/1.0',
        Accept: 'image/*,*/*;q=0.8',
      },
    });

    if (!upstream.ok) {
      res.status(upstream.status).json({ error: `Upstream returned ${upstream.status}` });
      return;
    }

    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    if (!contentType.startsWith('image/') && contentType !== 'application/octet-stream') {
      res.status(415).json({ error: `Unsupported content-type: ${contentType}` });
      return;
    }

    const buf = Buffer.from(await upstream.arrayBuffer());
    if (buf.byteLength > MAX_BYTES) {
      res.status(413).json({ error: 'Image too large' });
      return;
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).send(buf);
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : 'Fetch failed' });
  }
}
