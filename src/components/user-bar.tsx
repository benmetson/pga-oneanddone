'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function UserBar() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setEmail(null);
  };

  if (!email) return <a href="/auth" className="btn">Sign in</a>;

  return (
    <div className="flex items-center gap-3">
      <span className="chip">Signed in as {email}</span>
      <button onClick={signOut} className="btn">Sign out</button>
    </div>
  );
}
