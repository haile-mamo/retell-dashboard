// 1. ለ Build ሰዓት ወሳኝ የሆኑ መመሪያዎች
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ቀጥታ የ Admin Client በመጠቀም ከኩኪስ ጋር የሚመጣውን ችግር እንቀንሳለን
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { agent_name, voice_id, prompt, first_message, orgId } = body;

    // 1. Create Assistant in Retell AI
    const retellRes = await fetch("https://api.retellai.com/create-assistant", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RETELL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        assistant_name: agent_name,
        voice_id: voice_id || "s3://voice-models/soft_female_voice", 
        agent_model_config: {
          instructions: prompt,
          welcome_message: first_message,
        },
      }),
    });

    const retellData = await retellRes.json();

    if (!retellRes.ok) {
      throw new Error(retellData.error || "Retell Creation Failed");
    }

    // 2. Save to Supabase (Admin client ስለሆነ cookies አያስፈልገውም)
    const { error: dbError } = await supabase.from("agents").insert({
      org_id: orgId,
      name: agent_name,
      vapi_assistant_id: retellData.assistant_id, 
      role: "assistant",
      provider: "retell"
    });

    if (dbError) throw dbError;

    return NextResponse.json({ success: true, agent: retellData });
  } catch (error: any) {
    console.error("Error creating agent:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}