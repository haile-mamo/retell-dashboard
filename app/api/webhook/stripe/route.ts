import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase"; // ወይም ሰርቨር ሳይድ ሱፓቤዝ
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // 1. ክፍያው ሲሳካ (checkout.session.completed)
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Session;
    const orgId = session.metadata?.orgId; // ክፍያው ሲጀመር የላክኸው ID
    const amount = session.amount_total ? session.amount_total / 100 : 0;

    if (orgId) {
      // 2. በሱፓቤዝ ውስጥ ያለውን ባላንስ ማደስ
      const { data: org } = await supabase
        .from("organizations")
        .select("balance")
        .eq("id", orgId)
        .single();

      const newBalance = (Number(org?.balance) || 0) + amount;

      await supabase
        .from("organizations")
        .update({ balance: newBalance })
        .eq("id", orgId);
        
      console.log(`Success! ${orgId} balance updated to ${newBalance}`);
    }
  }

  return new NextResponse("Webhook received", { status: 200 });
}