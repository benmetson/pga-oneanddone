'use client';
import { Card, H1, Stat } from "@/components/ui";
export default async function Home() {
  const fakeThisWeek = { name: "Texas Open", purse: 9100000, link: "#" };
  const standings = [
    { name: "Hen", total: 6513775 },
    { name: "Crock", total: 3645955 },
    { name: "Mets", total: 2719622 },
    { name: "Crampton", total: 1573068 },
    { name: "Bamps", total: 924340 },
    { name: "Kurn", total: 0 }
  ];
  const money = (n:number)=> `$${n.toLocaleString()}`;
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <H1>This week.</H1>
          <div className="flex items-baseline gap-3"><span className="text-3xl font-semibold text-accent">{fakeThisWeek.name}</span></div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
            <Stat label="Purse" value={money(fakeThisWeek.purse)} />
            <Stat label="View leaderboard" value="Open" />
          </div>
        </Card>
        <Card>
          <H1>Current standings.</H1>
          <div className="mt-2 space-y-2">
            {standings.map((s, i)=> (
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
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <H1>Last week results.</H1>
          <p className="muted">Hook up to results CSV or DataGolf to populate.</p>
        </Card>
        <Card>
          <H1>Picks to date.</H1>
          <p className="muted">Link to full spreadsheet-style view.</p>
        </Card>
      </div>
    </div>
  )
}
