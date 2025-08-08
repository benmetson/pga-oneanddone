'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Card, H1 } from '@/components/ui';

type Golfer = { id: string; canonical_name: string | null; name: string; aliases: string[] | null };
type AliasRow = { id: string; alias: string };

export default function AliasesAdmin() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [golfers, setGolfers] = useState<Golfer[]>([]);
  const [aliases, setAliases] = useState<AliasRow[]>([]);
  const [sel, setSel] = useState<string>('');      // golfer_id
  const [aliasInput, setAliasInput] = useState('');
  const [msg, setMsg] = useState('');

  // Only allow emails listed in NEXT_PUBLIC_ADMIN_EMAILS (comma-separated)
  const adminList = useMemo(() => {
    const raw = process.env.NEXT_PUBLIC_ADMIN_EMAILS || '';
    return raw.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  }, []);
  const isAdmin = email && adminList.includes(email.toLowerCase());

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const e = data.user?.email ?? null;
      setEmail(e);
      if (!e) router.replace('/auth');
    })();
  }, [router]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('golfers')
        .select('id,name,canonical_name,aliases')
        .order('canonical_name', { ascending: true });
      setGolfers((data as any) ?? []);
    })();
  }, []);

  // load current aliases for selected golfer (from alias table)
  useEffect(() => {
    if (!sel) { setAliases([]); return; }
    (async () => {
      const { data } = await supabase
        .from('golfer_aliases')
        .select('id,alias')
        .eq('golfer_id', sel)
        .order('alias', { ascending: true });
      setAliases((data as any) ?? []);
    })();
  }, [sel]);

  async function addAlias() {
    setMsg('');
    const alias = aliasInput.trim();
    if (!alias) return;
    if (!/\s/.test(alias)) { setMsg('Use first + last, e.g. "Jon Rahm"'); return; }

    // client-side guard against dupes
    if (aliases.some(a => a.alias.toLowerCase() === alias.toLowerCase())) {
      setMsg('Alias already exists.'); return;
    }

    const { error } = await supabase
      .from('golfer_aliases')
      .insert({ golfer_id: sel, alias });

    if (error) { setMsg(error.message); return; }

    setAliasInput('');
    setMsg('Alias added ✅');

    // refresh
    const { data } = await supabase
      .from('golfer_aliases')
      .select('id,alias')
      .eq('golfer_id', sel)
      .order('alias', { ascending: true });
    setAliases((data as any) ?? []);
  }

  async function deleteAlias(id: string) {
    setMsg('');
    const { error } = await supabase.from('golfer_aliases').delete().eq('id', id);
    if (error) { setMsg(error.message); return; }
    setAliases(prev => prev.filter(a => a.id !== id));
  }

  if (!email) return <div className="p-6">Checking sign-in…</div>;
  if (!isAdmin) return <div className="p-6">Not authorized. Ask an admin to add your email to NEXT_PUBLIC_ADMIN_EMAILS.</div>;

  return (
    <div className="space-y-4">
      <Card>
        <H1>Aliases admin</H1>
        <p className="muted">Signed in as {email}</p>
      </Card>

      <Card>
        <label className="block font-medium mb-2">Select golfer</label>
        <select
          className="w-full px-3 py-2 rounded-xl bg-card border border-gray-700"
          value={sel}
          onChange={(e) => setSel(e.target.value)}
        >
          <option value="">— choose —</option>
          {golfers.map(g => (
            <option key={g.id} value={g.id}>
              {(g.canonical_name ?? g.name) + (g.aliases?.length ? ` — ${g.aliases.length} alias(es)` : '')}
            </option>
          ))}
        </select>
      </Card>

      {sel && (
        <Card>
          <div className="space-y-3">
            <label className="block font-medium">Add alias</label>
            <div className="flex gap-2">
              <input
                className="flex-1 px-3 py-2 rounded-xl bg-card border border-gray-700"
                placeholder='e.g. "J Rahm"'
                value={aliasInput}
                onChange={(e) => setAliasInput(e.target.value)}
              />
              <button className="btn" onClick={addAlias} disabled={!aliasInput.trim()}>
                Add
              </button>
            </div>

            <div className="mt-4">
              <p className="font-medium mb-2">Existing aliases</p>
              {!aliases.length && <p className="muted">None yet.</p>}
              <ul className="space-y-2">
                {aliases.map(a => (
                  <li key={a.id} className="flex items-center justify-between">
                    <span>{a.alias}</span>
                    <button className="btn" onClick={() => deleteAlias(a.id)}>Remove</button>
                  </li>
                ))}
              </ul>
            </div>

            {msg && <p className="muted">{msg}</p>}
          </div>
        </Card>
      )}
    </div>
  );
}
