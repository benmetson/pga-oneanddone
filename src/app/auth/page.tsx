'use client';
export const prerender = false; // don't pre-render this route in build

import { useState } from 'react';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState('');

  async function signIn() {
    // In preview mode, just show a note and do nothing
    if (process.env.NEXT_PUBLIC_PREVIEW_MODE === '1' || process.env.PREVIEW_MODE === '1') {
      setMessage('Preview mode: auth is disabled. Browse the app freely.');
      return;
    }
    if (!code) { setMessage('Enter invite code'); return; }
    if (code !== (process.env.NEXT_PUBLIC_INVITE_CODE ?? process.env.INVITE_CODE)) {
      setMessage('Invalid invite code'); return;
    }
    // Lazy import so Supabase isn’t touched during build
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: (process.env.NEXT_PUBLIC_SITE_URL ?? '') + '/auth/callback' }
    });
    if (error) setMessage(error.message); else { setMessage('Check your email for the magic link!'); setSent(true); }
  }

  return (
    <div className="max-w-sm mx-auto space-y-4">
      <h1 className="h1">Join the league</h1>
      <input placeholder="Email" className="w-full px-3 py-2 rounded-xl bg-card border border-gray-700"
             value={email} onChange={e=>setEmail(e.target.value)} />
      <input placeholder="Invite code" className="w-full px-3 py-2 rounded-xl bg-card border border-gray-700"
             value={code} onChange={e=>setCode(e.target.value)} />
      <button onClick={signIn} className="btn btn-primary w-full">{sent ? 'Resend link' : 'Email me a magic link'}</button>
      <p className="muted">{message}</p>
    </div>
  );
}
