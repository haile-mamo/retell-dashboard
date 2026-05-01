// 1. Next.js ይህንን API በ Build ሰዓት እንዳይነካው የሚከለክሉ ጥብቅ መመሪያዎች
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin"; 

export async function POST(req: Request) {
  try {
    const { orgId, areaCode } = await req.json();

    if (!orgId) {
      return NextResponse.json({ error: "Organization ID is required" }, { status: 400 });
    }

    // 1. ከ Supabase የ Assistant ID መውሰድ
    const { data: org, error: fetchError } = await supabaseAdmin
      .from("organizations")
      .select("vapi_assistant_id, name")
      .eq("id", orgId)
      .single();

    if (fetchError || !org?.vapi_assistant_id) {
      return NextResponse.json({ 
        error: "Assistant ID not found. እባክህ Supabase ላይ vapi_assistant_id መኖሩን አረጋግጥ።" 
      }, { status: 404 });
    }

    // 2. ቁጥር መፈለግ (Search)
    const targetAreaCode = areaCode || '202'; 
    const searchRes = await fetch(`https://api.vapi.ai/phone-number/search?areaCode=${targetAreaCode}`, {
      headers: { "Authorization": `Bearer ${process.env.VAPI_API_KEY}` }
    });
    
    const availableNumbers = await searchRes.json();

    if (!availableNumbers || !Array.isArray(availableNumbers) || availableNumbers.length === 0) {
      return NextResponse.json({ 
        error: `ለአካባቢ ኮድ ${targetAreaCode} የሚሸጥ ቁጥር አሁን ላይ የለም። እባክህ ሌላ ኮድ (ለምሳሌ 302 ወይም 202) ሞክር።` 
      }, { status: 404 });
    }

    const selectedNumber = availableNumbers[0].number;

    // 3. ቁጥሩን መግዛት (Purchase)
    const buyRes = await fetch("https://api.vapi.ai/phone-number", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.VAPI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        number: selectedNumber,
        provider: "twilio", 
        assistantId: org.vapi_assistant_id, 
        name: `${org.name} Phone Line`
      })
    });

    const boughtData = await buyRes.json();

    if (!buyRes.ok) {
      return NextResponse.json({ 
        error: boughtData.message || "Vapi ላይ ቁጥሩን መግዛት አልተቻለም (Balance ይኑርህ)።" 
      }, { status: buyRes.status });
    }

    // 4. አዲሱን ቁጥር ዳታቤዝ ውስጥ ሴቭ ማድረግ
    const { error: dbError } = await supabaseAdmin
      .from("organizations")
      .update({
        vapi_phone_number_id: boughtData.id,
        phone_number: selectedNumber
      })
      .eq("id", orgId);

    if (dbError) throw dbError;

    return NextResponse.json({ 
      success: true, 
      phoneNumber: selectedNumber,
      message: "ቁጥሩ በስኬት ተገዝቶ ከኤጀንቱ ጋር ተገናኝቷል!"
    });

  } catch (error: any) {
    console.error("Vapi Purchase Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}