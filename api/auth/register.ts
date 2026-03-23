import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password, name } = req.body;

  if (email && password) {
    return res.json({
      success: true,
      user: { id: '2', email, name: name || 'New User', role: 'user' },
      token: 'mock-jwt-token',
    });
  }

  return res.status(400).json({ success: false, error: 'Email and password required' });
}
