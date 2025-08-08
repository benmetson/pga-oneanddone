'use client';
import { Card, H1, Stat } from "@/components/ui";
import UserBar from "@/components/user-bar";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

type Tournament = {
  id: string;
  name: string;
  purse: number | null;
  lock_at: string;
  season_id: string;
};

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [tour, setTour] = useState<Tournament | null>(null);
  const [myPickName, setMyPickName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
  }, []);

  useEffect(() => {
    (async () => {
      // active tournament
      const { data: t } = await supabase
        .from("tournaments")
        .select("id,name,purse,lock_at,season_id")
        .eq("is_active", true)
        .single();
      setTour((t as any) ?? null);

      // user's pick for the active tournament (if logged in)
      if (t?.id && user?.id) {
        const { data: pick } = await supabase
          .from("picks")
          .select("golfer_id")
          .eq("user_id", user.id)
          .eq("tournament_id", t.id)
          .maybeSingle();

        if (pick?.golfer_id) {
          const { data: g } = await supabase
            .from("golfers")
            .select("name")
            .eq("id", pick.golfer_id)
            .single();
          setMyPickName(g?.name ?? null);
        } else {
          setMyPickName(null);
        }
      } else {
        setMyPickName(null);
      }

      setLoading(false);
    })();
  }, [user?.id]);

  const money = (n?: number | null) =>
    n == null ? "—" : `$${n.toLocaleString()}`;

  return (
    <div className="space-y-6">
      <Card>
        <UserBar />
      </Card>

      <Card>
        <H1>This week.</H1>
        {loading && <p className="muted">Loading…</p>}
        {!loading && !tour && (
          <p className="muted">No active tournament configured yet.</p>
        )}
        {tour && (
          <>
            <div className="flex items-baseline gap-3 mt-2">
              <span className="text-3xl font-semibold text-accent">
                {tour.name}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
              <Stat label="Purse" value={money(tour.purse)} />
              <Stat
                label="Locks"
                value={new Date(tour.lock_at).toLocaleString()}
              />
            </div>
          </>
        )}
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <H1>Your pick</H1>
          {!user && <p className="muted">Sign in to make a pick.</p>}
          {user && !tour && <p className="muted">No event this week.</p>}
          {user && tour && myPickName && (
            <p className="muted">
              You’ve picked <span className="font-medium">{myPickName}</span>.
            </p>
          )}
          {user && tour && !myPickName && (
            <p className="muted">No pick yet.</p>
          )}

          {user && tour && (
            <div className="mt-3">
              <Link href="/pick" className="btn btn-primary">
                {myPickName ? "Change my pick" : "Make my pick"}
              </Link>
            </div>
          )}
        </Card>

        <Card>
          <H1>Picks to date.</H1>
          <p className="muted">Spreadsheet-style view coming soon.</p>
        </Card>
      </div>
    </div>
  );
}
