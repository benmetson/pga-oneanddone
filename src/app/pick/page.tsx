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

  // --- Auth state ---
  const [authChecked, setAuthChecked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // --- Data state ---
  const [loading, setLoading] = useState(true);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [golfers, setGolfers] = useState<Golfer[]>([]);
  const [usedGolferIds, setUsedGolferIds] = useState<string[]>([]);
  const [takenGolferIds, setTakenGolferIds] = useState<string[]>([]);
  const [myPick, setMyPick] = useState<Pick | null>(null);
  const [selected, setSelected] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  const locked = useMemo(() => {
    if (!tournament) return false;
    return new Date(tournament.lock_at).getTime() <= Date.now();
  }, [tournament]);

  // --- Require login: redirect to /auth if not signed in ---
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const id = data.user?.id ?? null;
      setUserId(id);
      setAuthChecked(true);
      if (!id) router.replace('/auth');
    })();

    // keep in sync with auth changes
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const id = session?.user?.id ?? null;
      setUserId(id);
      if (!id) router.replace('/auth');
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  // --- Load all data once we know we have a user ---
  useEffect(() => {
    if (!authChecked || !userId) return;

    (async () => {
      setLoading(true);

      // active tournament
      const { data: tRes, error: tErr } = await supabase
        .from('tournaments')
        .select('id,name,lock_at,season_id')
        .eq('is_active', true)
        .single();

      if (tErr) {
        setTournament(null);
        setLoading(false);
        return;
      }
      setTournament(tRes as Tournament);

      // master golfers list
      const { data: gRes } = await supabase
        .from('golfers')
        .select('id,name')
        .order('name', { ascending: true });
      setGolfers((gRes as Golfer[]) ?? []);

      // my pick (if any) for this tournament
      const { data: pick } = await supabase
        .from('picks')
        .select('id,golfer_id,tournament_id')
        .eq('user_id', userId)
        .eq('tournament_id', tRes.id)
        .maybeSingle();

      if (pick) {
        setMyPick(pick as Pick);
        setSelected(pick.golfer_id);
      } else {
        setMyPick(null);
        setSelected('');
      }

      // golfers I've already used in this season
      const { data: used } = await supabase
        .from('picks')
        .select('golfer_id')
        .eq('user_id', userId)
        .eq('season_id', tRes.season_id);

      setUsedGolferIds((used ?? []).map((r: any) => r.golfer_id));

      // golfers already taken this week (by anyone)
      const { data: taken } = await supabase
        .from('picks')
        .select('golfer_id')
        .eq('tournament_id', tRes.id);

      // exclude my own current pick from "taken" so I can still select it
      const takenIds = (taken ?? [])
        .map((r: any) => r.golfer_id)
        .filter((id: string) => id !== (pick?.golfer_id ?? ''));
      setTakenGolferIds(takenIds);

      setLoading(false);
    })();
  }, [authChecked, userId]);

  // --- Submit pick (insert or update) ---
  async function submitPick() {
    setMessage('');
    if (!userId) return; // guarded by redirect already
    if (!tournament) return setMessage('No active tournament.');
    if (!selected) return setMessage('Pick a golfer.');
    if (locked) return setMessage('Picks are locked.');

    try {
      if (myPick) {
        // update before lock
        const { error } = await supabase
          .from('picks')
          .update({ golfer_id: selected })
          .eq('id', myPick.id);

        if (error) throw error;
        setMessage('Pick updated ✅');
        setMyPick({ ...myPick, golfer_id: selected });
      } else {
        const { data, error } = await supabase
          .from('picks')
          .insert({
            user_id: userId,
            tournament_id: tournament.id,
            golfer_id: selected,
            // season_id set by trigger
          })
          .select('*')
          .single();

        if (error) throw error;
        setMessage('Pick saved ✅');
        setMyPick(data as Pick);
      }
    } catch (e: any) {
      // Common DB constraint messages -> friendlier copy
      const msg = String(e?.message ?? e);
      if (msg.includes('uniq_golfer_taken_per_tournament')) {
        setMessage('That golfer has already been taken this week.');
      } else if (msg.includes('uniq_golfer_per_season')) {
        setMessage('You already used that golfer earlier this season.');
      } else if (msg.includes('uniq_pick_per_event')) {
        setMessage('You already have a pick for this event.');
      } else if (msg.includes('row-level security')) {
        setMessage('Picks are locked or you are not signed in.');
      } else {
        setMessage(msg);
      }
    }
  }

  if (!authChecked) return <div className="p-6">Checking sign-in…</div>;
  if (!userId) return null; // redirected to /auth
  if (loading) return <div className="p-6">Loading…</div>;
  if (!tournament) return <div className="p-6">No active tournament configured yet.</div>;

  return (
    <div className="space-y-4">
      <Card>
        <H1>Pick for {tournament.name}</H1>
        <p className="muted">
          Locks at{' '}
          <span className="tabular-nums">
            {new Date(tournament.lock_at).toLocaleString()}
          </span>
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
              const isUsed = usedGolferIds.includes(g.id); // you used earlier this season
              const isTaken = takenGolferIds.includes(g.id); // someone else took this week
              const label =
                g.name +
                (isUsed ? ' (used)' : isTaken ? ' (taken)' : '');

              // allow your current pick to remain selectable even if "taken" by you
              const disableOption =
                locked ||
                isUsed ||
                (isTaken && g.id !== myPick?.golfer_id);

              return (
                <option key={g.id} value={g.id} disabled={disableOption}>
                  {label}
                </option>
              );
            })}
          </select>

          <button
            onClick={submitPick}
            disabled={locked || !selected}
            className="btn btn-primary mt-2"
          >
            {myPick ? 'Update my pick' : 'Submit pick'}
          </button>

          {locked && <p className="muted">Picks are locked for this event.</p>}
          {message && <p className="muted">{message}</p>}
        </div>
      </Card>
    </div>
  );
}
