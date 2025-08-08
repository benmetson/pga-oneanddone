'use client';
import { Card, H1, Stat } from "@/components/ui";
import UserBar from "@/components/user-bar";

export default function Home() {
  const fakeThisWeek = { name: "Texas Open", purse: 9_100_000 };
  const standings = [
    { name: "Hen", total: 6_513_775 },
    { name: "Crock", total: 3_644_595 },
    { name: "Mets", total: 2_719_622 },
    { name: "Crampton", total: 1_573_068 },
    { name: "Bamps", total: 924_340 },
    { name: "Kurn", total: 0 },
  ];
  const money = (n: number) => `$${n.toLocaleString()}`;

  return (
    <div className="space-y-6">
      {/* ✅ Shows Sign in (if logged out) or "Signed in as ..." + Sign out */}
      <Card>
        <UserBar />
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <H1>This week.</H1>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-semibold text-accent">
              {fakeThisWeek.name}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
            <Stat label="Purse" value={money(fakeThisWeek.purse)} />
            <Stat label="View leaderboard" value="Open" />
          </div>
        </Card>
      </div>

      <Card>
        <H1>Current standings.</H1>
        <div className="mt-2 space-y-2">
          {standings.map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-1.5 h-8 rounded bg-accent" />
              <div className="flex-1 flex justify-between">
                <span className="font-medium">{s.name}</span>
                <span className="tabular-nums">{money(s.total)}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <H1>Last week results.</H1>
          <p className="muted">Hook up CSV or DataGolf later.</p>
        </Card>
        <Card>
          <H1>Picks to date.</H1>
          <p className="muted">Spreadsheet-style view coming soon.</p>
        </Card>
      </div>
    </div>
  );
}
