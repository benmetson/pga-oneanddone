'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AuthCallback() {
  const router = useRouter();
  useEffect(() => {
    (async () => {
      await supabase.auth.getSession(); // commit session locally
      router.replace('/');
    })();
  }, [router]);
  return <div className="max-w-sm mx-auto"><p className="muted">Signing you in…</p></div>;
}
