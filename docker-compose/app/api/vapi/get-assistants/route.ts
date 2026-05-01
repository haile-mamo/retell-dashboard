import { NextResponse } from "next/server";

export async function GET() {
  try {
    const vapiApiKey = process.env.VAPI_API_KEY;

    if (!vapiApiKey) {
      return NextResponse.json(
        { error: "Vapi API key not found in env variables" },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.vapi.ai/assistant", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${vapiApiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || "Failed to fetch assistants" },
        { status: response.status }
      );
    }

    const assistants = await response.json();
    return NextResponse.json(assistants);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}