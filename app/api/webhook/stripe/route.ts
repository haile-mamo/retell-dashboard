import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import Stripe from "stripe";

// 1. የ API Version ወደ "2026-04-22.dahlia" ተቀይሯል
// ይህም በ Vercel ላይ ያለውን የ Build Error ይፈታዋል
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia" as any,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // 1. ክፍያው ሲሳካ (checkout.session.completed)
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orgId = session.metadata?.orgId; 
    const amount = session.amount_total ? session.amount_total / 100 : 0;

    if (orgId) {
      // 2. በሱፓቤዝ ውስጥ ያለውን ባላንስ ማግኘት
      const { data: org, error: fetchError } = await supabase
        .from("organizations")
        .select("balance")
        .eq("id", orgId)
        .single();

      if (fetchError) {
        console.error("Database Fetch Error:", fetchError);
        return new NextResponse("Organization not found", { status: 404 });
      }

      // 3. አዲሱን ባላንስ ማስላት እና ማደስ
      const newBalance = (Number(org?.balance) || 0) + amount;

      const { error: updateError } = await supabase
        .from("organizations")
        .update({ balance: newBalance })
        .eq("id", orgId);

      if (updateError) {
        console.error("Database Update Error:", updateError);
        return new NextResponse("Failed to update balance", { status: 500 });
      }
        
      console.log(`Success! ${orgId} balance updated to ${newBalance}`);
    }
  }

  return new NextResponse("Webhook received", { status: 200 });
}