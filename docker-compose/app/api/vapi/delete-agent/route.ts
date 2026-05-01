import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function DELETE(req: Request) {
  try {
    const { agentId, vapiId } = await req.json();

    // 1. Delete from Vapi
    await fetch(`https://api.vapi.ai/assistant/${vapiId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${process.env.VAPI_API_KEY}` },
    });

    // 2. Delete from Supabase
    const { error } = await supabase.from("agents").delete().eq("id", agentId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}