'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      // Touch session so Supabase commits it to storage, then bounce home.
      await supabase.auth.getSession();
      router.replace('/');
    })();
  }, [router]);

  return (
    <div className="max-w-sm mx-auto">
      <p className="muted">Signing you in…</p>
    </div>
  );
}
