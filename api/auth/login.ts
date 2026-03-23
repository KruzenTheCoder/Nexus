import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password } = req.body;

  if (email && password) {
    return res.json({
      success: true,
      user: { id: '1', email, name: 'Test User', role: 'admin' },
      token: 'mock-jwt-token',
    });
  }

  return res.status(401).json({ success: false, error: 'Invalid credentials' });
}
