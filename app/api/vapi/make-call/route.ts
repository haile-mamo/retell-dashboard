import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { phoneNumber, assistantId, orgId } = await req.json();

    if (!phoneNumber || !assistantId || !orgId) {
      return NextResponse.json(
        { error: "Phone number, Assistant ID, and Org ID are required" }, 
        { status: 400 }
      );
    }

    const { data: orgData, error: dbError } = await supabase
      .from("organizations")
      .select("vapi_phone_number_id")
      .eq("id", orgId)
      .single();

    if (dbError || !orgData?.vapi_phone_number_id) {
      return NextResponse.json(
        { error: "Active Vapi phone number not found for this organization" }, 
        { status: 404 }
      );
    }

    const phoneNumberId = orgData.vapi_phone_number_id;

    const vapiResponse = await fetch("https://api.vapi.ai/call/phone", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.VAPI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customer: { 
          number: phoneNumber,
          extension: orgId 
        },
        assistantId: assistantId,
        phoneNumberId: phoneNumberId,
      }),
    });

    const data = await vapiResponse.json();

    if (!vapiResponse.ok) {
      console.error("Vapi Error Response:", data);
      return NextResponse.json(
        { error: data.message || "Vapi call initiation failed" }, 
        { status: vapiResponse.status }
      );
    }

    return NextResponse.json({ 
      success: true, 
      callId: data.id 
    });

  } catch (error: any) {
    console.error("Make Call Server Error:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" }, 
      { status: 500 }
    );
  }
}