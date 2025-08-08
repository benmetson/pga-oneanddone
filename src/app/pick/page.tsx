'use client';

import { useEffect, useMemo, useState } from 'react';
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
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
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

  // initial load
  useEffect(() => {
    (async () => {
      const [{ data: user }, { data: tRes }, { data: gRes }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from('tournaments').select('id,name,lock_at,season_id').eq('is_active', true).single(),
        supabase.from('golfers').select('id,name').order('name', { ascending: true })
      ]);

      setUserId(user.user?.id ?? null);
      if (tRes) setTournament(tRes as any);
      if (gRes) setGolfers(gRes as any);

      if (user.user && tRes?.id) {
        // my current pick (if any)
        const { data: pick } = await supabase
          .from('picks')
          .select('id,golfer_id,tournament_id')
          .eq('user_id', user.user.id)
          .eq('tournament_id', tRes.id)
          .maybeSingle();

        if (pick) {
          setMyPick(pick as any);
          setSelected(pick.golfer_id);
        }

        // golfers I've already used in this season
        const { data: used } = await supabase
          .from('picks')
          .select('golfer_id')
          .eq('user_id', user.user.id)
          .eq('season_id', tRes.season_id);

        setUsedGolferIds((used ?? []).map((r: any) => r.golfer_id));
      }

      setLoading(false);
    })();
  }, []);

  async function submitPick() {
    setMessage('');
    if (!userId) return setMessage('Please sign in first.');
    if (!tournament) return setMessage('No active tournament.');
    if (!selected) return setMessage('Pick a golfer.');
    if (locked) return setMessage('Picks are locked.');

    try {
      if (myPick) {
        // allow change before lock
        const { error } = await supabase
          .from('picks')
          .update({ golfer_id: selected })
          .eq('id', myPick.id);
        if (error) throw error;
        setMessage('Pick updated ✅');
      } else {
        const { error, data } = await supabase.from('picks').insert({
          user_id: userId,
          tournament_id: tournament.id,
          golfer_id: selected
          // season_id is set by trigger
        }).select('*').single();
        if (error) throw error;
        setMyPick(data as any);
        setMessage('Pick saved ✅');
      }
    } catch (e: any) {
      setMessage(e.message ?? 'Failed to save pick.');
    }
  }

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

          <button onClick={submitPick} disabled={locked || !selected}
                  className="btn btn-primary mt-2">
            {myPick ? 'Update my pick' : 'Submit pick'}
          </button>

          {locked && <p className="muted">Picks are locked for this event.</p>}
          {message && <p className="muted">{message}</p>}
        </div>
      </Card>
    </div>
  );
}
