import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { phoneNumber, assistantId } = await req.json();

    const response = await fetch("https://api.retellai.com/create-phone-call", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RETELL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from_number: process.env.RETELL_PHONE_NUMBER, // Retell ላይ የገዛኸው ቁጥር
        to_number: phoneNumber,
        assistant_id: assistantId,
      }),
    });

    const data = await response.json();
    if (response.ok) return NextResponse.json({ success: true, data });
    
    return NextResponse.json({ success: false, error: data.error }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Connection to Retell failed" }, { status: 500 });
  }
}