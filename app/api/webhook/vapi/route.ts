export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const payload = body.message || body;

    if (payload.type === 'end-of-call-report') {
      const callData = payload.call || {};
      const analysis = payload.analysis || {};
      
      const currentOrgId = payload.assistant?.metadata?.orgId || "71f75825-e936-45a0-9510-98d21463a6d0"; 
      
      const rawDuration = payload.durationSeconds || callData.durationSeconds || callData.duration || 0;
      const finalDurationSeconds = Math.round(Number(rawDuration));

      const { error } = await supabase
        .from('calls')
        .upsert({
          provider_call_id: callData.id,
          org_id: currentOrgId, 
          status: callData.status || 'completed',
          duration: finalDurationSeconds,
          duration_seconds: finalDurationSeconds, 
          recording_url: callData.recordingUrl || payload.recordingUrl || null, 
          transcript: analysis.summary || payload.transcript || "No transcript available",
          cost: payload.cost || callData.cost || 0,
          provider_type: "vapi",
          created_at: new Date().toISOString(),
        }, { 
          onConflict: 'provider_call_id' 
        });

      if (error) {
        console.error("Database Error:", error.message);
      } else {
        console.log("Success: Call record updated!");
      }
    }

    return NextResponse.json({ message: "Webhook processed" }, { status: 200 });

  } catch (error: any) {
    console.error("Webhook Error:", error.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}