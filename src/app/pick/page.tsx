'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Card, H1 } from '@/components/ui';

type Tournament = {
  id: string;
  name: string;
  lock_at: string;
  season_id: string;
};
type Golfer = { id: string; name: string };
type Pick = { id: string; golfer_id: string; tournament_id: string };

export default function PickPage() {
  const router = useRouter();

  // 👇 auth state
  const [authChecked, setAuthChecked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // data state
  const [loading, setLoading] = useState(true);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [golfers, setGolfers] = useState<Golfer[]>([]);
  const [usedGolferIds, setUsedGolferIds] = useState<string[]>([]);
  const [myPick, setMyPick] = useState<Pick | null>(null);
  const [message, setMessage] = useState<string>('');
  const [selected, setSelected] = useState<string>('');

  const locked = useMemo(() => {
    if (!tournament) return false;
    return new Date(tournament.lock_at).getTime() <= Date.now();
  }, [tournament]);

  // ✅ Require login: if no user → redirect to /auth
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const id = data.user?.id ?? null;
      setUserId(id);
      setAuthChecked(true);
      if (!id) router.replace('/auth');
    })();
    // listen to auth changes (optional)
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const id = session?.user?.id ?? null;
      setUserId(id);
      if (!id) router.replace('/auth');
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  // load data once we know we have a user
  useEffect(() => {
    if (!authChecked || !userId) return;
    (async () => {
      const [{ data: tRes }, { data: gRes }] = await Promise.all([
        supabase.from('tournaments').select('id,name,lock_at,season_id').eq('is_active', true).single(),
        supabase.from('golfers').select('id,name').order('name', { ascending: true })
      ]);

      if (tRes) setTournament(tRes as any);
      if (gRes) setGolfers(gRes as any);

      if (tRes?.id) {
        const { data: pick } = await supabase
          .from('picks')
          .select('id,golfer_id,tournament_id')
          .eq('user_id', userId)
          .eq('tournament_id', tRes.id)
          .maybeSingle();
        if (pick) {
          setMyPick(pick as any);
          setSelected(pick.golfer_id);
        }

        const { data: used } = await supabase
          .from('picks')
          .select('golfer_id')
          .eq('user_id', userId)
          .eq('season_id', tRes.season_id);
        setUsedGolferIds((used ?? []).map((r: any) => r.golfer_id));
      }

      setLoading(false);
    })();
  }, [authChecked, userId]);

  async function submitPick() {
    setMessage('');
    if (!userId) return; // guard
    if (!tournament) return setMessage('No active tournament.');
    if (!selected) return setMessage('Pick a golfer.');
    if (locked) return setMessage('Picks are locked.');

    try {
      if (myPick) {
        const { error } = await supabase.from('picks').update({ golfer_id: selected }).eq('id', myPick.id);
        if (error) throw error;
        setMessage('Pick updated ✅');
      } else {
        const { error, data } = await supabase
          .from('picks')
          .insert({ user_id: userId, tournament_id: tournament.id, golfer_id: selected })
          .select('*')
          .single();
        if (error) throw error;
        setMyPick(data as any);
        setMessage('Pick saved ✅');
      }
    } catch (e: any) {
      setMessage(e.message ?? 'Failed to save pick.');
    }
  }

  if (!authChecked) return <div className="p-6">Checking sign-in…</div>;
  if (!userId) return null; // we redirect to /auth above
  if (loading) return <div className="p-6">Loading…</div>;
  if (!tournament) return <div className="p-6">No active tournament configured yet.</div>;

  return (
    <div className="space-y-4">
      <Card>
        <H1>Pick for {tournament.name}</H1>
        <p className="muted">
          Locks at <span className="tabular-nums">{new Date(tournament.lock_at).toLocaleString()}</span>
        </p>
      </Card>

      <Card>
        <div className="space-y-3">
          <label className="block font-medium">Golfer</label>
          <select
            className="w-full px-3 py-2 rounded-xl bg-card border border-gray-700"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            disabled={locked}
          >
            <option value="">— Select a golfer —</option>
            {golfers.map((g) => {
              const alreadyUsed = usedGolferIds.includes(g.id);
              return (
                <option key={g.id} value={g.id} disabled={alreadyUsed}>
                  {g.name}{alreadyUsed ? ' (used)' : ''}
                </option>
              );
            })}
          </select>

          <button onClick={submitPick} disabled={locked || !selected} className="btn btn-primary mt-2">
            {myPick ? 'Update my pick' : 'Submit pick'}
          </button>

          {locked && <p className="muted">Picks are locked for this event.</p>}
          {message && <p className="muted">{message}</p>}
        </div>
      </Card>
    </div>
  );
}
