import { NextResponse } from "next/server";
import { contactSchema } from "@/lib/contact-schema";

/** Stub: validates and logs. Swap the console.log for your CRM or queue. */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const id = Math.random().toString(16).slice(2, 6) + "·" + Math.random().toString(16).slice(2, 6);
  console.log("[contact]", id, parsed.data);
  return NextResponse.json({ ok: true, id });
}
