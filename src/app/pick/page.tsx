'use client';
import { Button } from "@/components/ui";
import { Card, H1, Stat } from "@/components/ui";

export default function PickPage(){
  const used = ["Scheffler", "McIlroy"];
  const field = ["Theegala", "Fitzpatrick", "Day", "Noren", "J. Knapp", "Zalatoris"];

  return (
    <div className="space-y-6">
      <Card>
        <H1>Make your pick</H1>
        <div className="mb-3">
          <p className="muted mb-1">Used this season</p>
          <div className="flex flex-wrap gap-2">{used.map(u=><span key={u} className="chip">{u}</span>)}</div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {field.map(g=>(
            <button key={g} className="px-3 py-2 rounded-xl bg-gray-800 text-left">{g}</button>
          ))}
        </div>
        <div className="mt-4"><Button variant="primary">Submit pick</Button></div>
      </Card>
    </div>
  );
}
