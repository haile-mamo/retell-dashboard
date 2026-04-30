import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch("https://api.retellai.com/list-assistants", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.RETELL_API_KEY}`,
      },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch assistants" }, { status: 500 });
  }
}