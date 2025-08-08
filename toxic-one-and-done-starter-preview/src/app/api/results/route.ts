import { NextResponse } from "next/server";
export async function POST(req: Request){
  try{
    const form = await req.formData();
    const csv = form.get("file") as File | null;
    if (!csv) return NextResponse.json({ ok:false, error: "Upload a CSV named 'file'." }, { status: 400 });
    return NextResponse.json({ ok:true });
  }catch(e:any){
    return NextResponse.json({ ok:false, error:e.message }, { status: 500 });
  }
}
