import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import Stripe from "stripe";

// ለ Next.js ይህ Route በፍጹም Static እንዳይሆን ጥብቅ መመሪያ መስጠት
export const dynamic = "force-dynamic";
export const revalidate = 0;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia" as any,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const headerList = headers();
  const signature = headerList.get("stripe-signature");

  if (!signature) {
    return new NextResponse("No signature provided", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orgId = session.metadata?.orgId; 
    const amount = session.amount_total ? session.amount_total / 100 : 0;

    if (orgId) {
      const { data: org, error: fetchError } = await supabase
        .from("organizations")
        .select("balance")
        .eq("id", orgId)
        .single();

      if (!fetchError) {
        const currentBalance = Number(org?.balance) || 0;
        const newBalance = currentBalance + amount;

        await supabase
          .from("organizations")
          .update({ balance: newBalance })
          .eq("id", orgId);
          
        console.log(`Success! Organization ${orgId} balance updated.`);
      }
    }
  }

  return new NextResponse("Webhook received", { status: 200 });
}