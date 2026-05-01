// 1. Next.js ይህንን API በ Build ሰዓት እንዳይነካው የሚከለክሉ ጥብቅ መመሪያዎች
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { name, systemPrompt, firstMessage, voiceId, orgId, role } = await req.json();

    // 1. Vapi ላይ አዲስ ኤጀንት መፍጠር
    const vapiResponse = await fetch('https://api.vapi.ai/assistant', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VAPI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name,
        // ተጠቃሚው የላከው ካለ እሱን ይጠቀማል፣ ከሌለ default ሰላምታ ይሰጣል
        firstMessage: firstMessage || `Hello, I am ${name}. How can I help you today?`,
        model: {
          provider: "openai",
          model: "gpt-3.5-turbo",
          messages: [{ role: "system", content: systemPrompt }]
        },
        voice: { 
          provider: "vapi", 
          // ተጠቃሚው የመረጠው ድምፅ ካለ እሱን ይጠቀማል፣ ካልሆነ "Emma"ን default ያደርጋል
          voiceId: voiceId || "Emma" 
        },
        // --- ሪከርዲንግ (Recording) እንዲሰራ የሚያደርግ ---
        artifactPlan: {
          recordingEnabled: true,
          videoRecordingEnabled: false
        }
      }),
    });

    const vapiData = await vapiResponse.json();

    if (!vapiResponse.ok) {
      throw new Error(vapiData.message || "Vapi API Error");
    }

    // 2. የተፈጠረውን ኤጀንት መረጃ Supabase 'agents' ቴብል ውስጥ ማስቀመጥ
    const { error } = await supabase
      .from('agents')
      .insert([
        {
          org_id: orgId,
          vapi_assistant_id: vapiData.id, // Vapi የሰጠን ትክክለኛው Assistant ID
          name: name,
          role: role,
          system_prompt: systemPrompt,
          first_message: firstMessage,
          voice_id: voiceId || "Emma"
        }
      ]);

    if (error) {
      console.error("Supabase Insert Error:", error.message);
      throw error;
    }

    return NextResponse.json({ 
      success: true, 
      agentId: vapiData.id 
    });

  } catch (err: any) {
    console.error("Agent Creation Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}