import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16" as any,
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret!);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orgId = session.metadata?.orgId;
    const amountPaid = (session.amount_total || 0) / 100;

    if (orgId) {
      const { data: org, error: fetchError } = await supabase
        .from("organizations")
        .select("balance")
        .eq("id", orgId)
        .single();

      if (fetchError) {
        console.error("Database Fetch Error:", fetchError);
        return NextResponse.json({ error: "Organization not found" }, { status: 404 });
      }

      const newBalance = (org?.balance || 0) + amountPaid;

      const { error: updateError } = await supabase
        .from("organizations")
        .update({ balance: newBalance })
        .eq("id", orgId);

      if (updateError) {
        console.error("Database Update Error:", updateError);
        return NextResponse.json({ error: "Failed to update balance" }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}