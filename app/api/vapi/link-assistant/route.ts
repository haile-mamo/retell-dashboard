import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { phoneId, assistantId, orgId } = await req.json();

    if (!phoneId || !assistantId || !orgId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const vapiResponse = await fetch(`https://api.vapi.ai/phone-number/${phoneId}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${process.env.VAPI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        assistantId: String(assistantId).trim(),
      }),
    });

    const vapiData = await vapiResponse.json();

    if (!vapiResponse.ok) {
      console.error("Vapi API Error Details:", vapiData);
      return NextResponse.json({ 
        error: vapiData.message || "Vapi validation failed",
        details: vapiData 
      }, { status: vapiResponse.status });
    }

    const { error: dbError } = await supabase
      .from("organizations")
      .update({ vapi_assistant_id: assistantId })
      .eq("id", orgId);

    if (dbError) {
      console.error("Supabase Update Error:", dbError);
      return NextResponse.json({ error: "Database update failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: vapiData });

  } catch (error: any) {
    console.error("Unexpected Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}