'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [invite, setInvite] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function signIn() {
    setMsg('');
    if (!email) return setMsg('Enter your email.');
    if (!invite) return setMsg('Enter the invite code.');
    const required = process.env.NEXT_PUBLIC_INVITE_CODE || 'toxic-od-2025';
    if (invite.trim() !== required) return setMsg('Invalid invite code.');

    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + '/auth/callback' }
    });
    setBusy(false);

    setMsg(error ? error.message : 'Check your email for the magic link!');
  }

  return (
    <div className="max-w-sm mx-auto space-y-4">
      <h1 className="h1">Join the league</h1>
      <input
        className="w-full px-3 py-2 rounded-xl bg-card border border-gray-700"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="w-full px-3 py-2 rounded-xl bg-card border border-gray-700"
        placeholder="Invite code"
        value={invite}
        onChange={(e) => setInvite(e.target.value)}
      />
      <button onClick={signIn} disabled={busy} className="btn btn-primary w-full">
        {busy ? 'Sending…' : 'Email me a magic link'}
      </button>
      <p className="muted">{msg}</p>
    </div>
  );
}
