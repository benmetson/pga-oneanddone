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

type Golfer = {
  id: string;
  name: string;
  canonical_name: string | null;
  aliases: string[] | null;
};

type Pick = { id: string; golfer_id: string; tournament_id: string };

// ---- client-side canonicalization to mirror the DB ----
function canon(s: string) {
  return s
    .normalize('NFD')
    // strip accents
    .replace(/\p{Diacritic}/gu, '')
    // collapse spaces
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export default function PickPage() {
  const router = useRouter();

  // auth
  const [authChecked, setAuthChecked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // data
  const [loading, setLoading] = useState(true);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [golfers, setGolfers] = useState<Golfer[]>([]);
  const [usedGolferIds, setUsedGolferIds] = useState<string[]>([]);
  const [takenGolferIds, setTakenGolferIds] = useState<string[]>([]);
  const [myPick, setMyPick] = useState<Pick | null>(null);

  // selection / messages
  const [selected, setSelected] = useState<string>('');
  const [freeText, setFreeText] = useState<string>(''); // add-by-name
  const [message, setMessage] = useState<string>('');

  const locked = useMemo(() => {
    if (!tournament) return false;
    return new Date(tournament.lock_at).getTime() <= Date.now();
  }, [tournament]);

  // Require login
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const id = data.user?.id ?? null;
      setUserId(id);
      setAuthChecked(true);
      if (!id) router.replace('/auth');
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const id = session?.user?.id ?? null;
      setUserId(id);
      if (!id) router.replace('/auth');
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  // Load data after auth
  useEffect(() => {
    if (!authChecked || !userId) return;

    (async () => {
      setLoading(true);
      setMessage('');

      // active tournament
      const { data: tRes, error: tErr } = await supabase
        .from('tournaments')
        .select('id,name,lock_at,season_id')
        .eq('is_active', true)
        .single();

      if (tErr || !tRes) {
        setTournament(null);
        setLoading(false);
        return;
      }
      setTournament(tRes as Tournament);

      // golfers (include canonical_name + aliases)
      const { data: gRes } = await supabase
        .from('golfers')
        .select('id,name,canonical_name,aliases')
        .order('canonical_name', { ascending: true });
      setGolfers((gRes as Golfer[]) ?? []);

      // my pick for this tournament
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

      // golfers used this season by me
      const { data: used } = await supabase
        .from('picks')
        .select('golfer_id')
        .eq('user_id', userId)
        .eq('season_id', tRes.season_id);
      setUsedGolferIds((used ?? []).map((r: any) => r.golfer_id));

      // golfers taken this week by anyone
      const { data: taken } = await supabase
        .from('picks')
        .select('golfer_id')
        .eq('tournament_id', tRes.id);

      const takenIds = (taken ?? [])
        .map((r: any) => r.golfer_id)
        .filter((id: string) => id !== (pick?.golfer_id ?? '')); // let me keep my current pick
      setTakenGolferIds(takenIds);

      setLoading(false);
    })();
  }, [authChecked, userId]);

  // Try to find an existing golfer by free-text against canonical/aliases (client-side)
  function findExistingGolferIdByText(input: string): string | null {
    const needle = canon(input);
    for (const g of golfers) {
      const c = canon(g.canonical_name ?? g.name);
      if (needle === c) return g.id;
      const aliases = (g.aliases ?? []).map(canon);
      if (aliases.includes(needle)) return g.id;
    }
    return null;
  }

  // Add by free text (creates a canonical row if needed, then selects it)
  async function addByName() {
    setMessage('');
    const name = freeText.trim();
    if (!name) return;
    // Require first + last (matches DB CHECK)
    if (!/\s/.test(name)) {
      setMessage('Please enter first and last name (e.g., "Jon Rahm").');
      return;
    }

    // Does this already exist by canonical or alias?
    const existingId = findExistingGolferIdByText(name);
    if (existingId) {
      setSelected(existingId);
      setMessage('Found existing golfer, selected ✅');
      setFreeText('');
      return;
    }

    // Create new canonical golfer
    const { data, error } = await supabase
      .from('golfers')
      .insert({ name, canonical_name: name }) // aliases start empty
      .select('id,name,canonical_name,aliases')
      .single();

    if (error) {
      // DB unique/constraint errors show up here if someone typed a near-dup
      setMessage(error.message);
      return;
    }

    // add to list and select
    const newG = data as Golfer;
    setGolfers(prev =>
      [...prev, newG].sort((a, b) =>
        (a.canonical_name ?? a.name).localeCompare(b.canonical_name ?? b.name)
      )
    );
    setSelected(newG.id);
    setFreeText('');
    setMessage('Golfer added ✅');
  }

  // Submit / Update pick
  async function submitPick() {
    setMessage('');
    if (!userId) return;
    if (!tournament) return setMessage('No active tournament.');
    if (!selected) return setMessage('Pick a golfer.');
    if (locked) return setMessage('Picks are locked.');

    try {
      if (myPick) {
        const { error } = await supabase
          .from('picks')
          .update({ golfer_id: selected })
          .eq('id', myPick.id);

        if (error) throw error;
        setMyPick({ ...myPick, golfer_id: selected });
        setMessage('Pick updated ✅');
      } else {
        const { data, error } = await supabase
          .from('picks')
          .insert({
            user_id: userId,
            tournament_id: tournament.id,
            golfer_id: selected,
            // season_id filled by trigger
          })
          .select('*')
          .single();
        if (error) throw error;
        setMyPick(data as Pick);
        setMessage('Pick saved ✅');
      }
    } catch (e: any) {
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
  if (!userId) return null; // redirected
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
          <label className="block font-medium">Choose from list</label>
          <select
            className="w-full px-3 py-2 rounded-xl bg-card border border-gray-700"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            disabled={locked}
          >
            <option value="">— Select a golfer —</option>
            {golfers.map((g) => {
              const id = g.id;
              const isUsed = usedGolferIds.includes(id);
              const isTaken = takenGolferIds.includes(id);
              const isMine = id === myPick?.golfer_id;
              const disableOption =
                locked || isUsed || (isTaken && !isMine);

              const labelBase = g.canonical_name ?? g.name;
              const label =
                labelBase +
                (isUsed ? ' (used)' : isTaken && !isMine ? ' (taken)' : '');

              return (
                <option key={id} value={id} disabled={disableOption}>
                  {label}
                </option>
              );
            })}
          </select>

          <div className="mt-3 space-y-2">
            <label className="block font-medium">…or add by name</label>
            <div className="flex gap-2 items-center">
              <input
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                placeholder={`e.g., "Jon Rahm"`}
                className="flex-1 px-3 py-2 rounded-xl bg-card border border-gray-700"
                disabled={locked}
              />
              <button
                onClick={addByName}
                disabled={locked || !freeText.trim()}
                className="btn"
              >
                Add
              </button>
            </div>
            <p className="muted">We’ll match existing names & aliases automatically.</p>
          </div>

          <button
            onClick={submitPick}
            disabled={locked || !selected}
            className="btn btn-primary mt-3"
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
