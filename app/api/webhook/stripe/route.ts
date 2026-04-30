import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabase";

// 1. Next.js ይህንን ፋይል በ Build ሰዓት እንዳይነካው የሚከለክሉ መመሪያዎች
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia" as any,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  try {
    const body = await req.text();
    // 2. headers() ን በቀጥታ ከመጥራት ይልቅ ከ req.headers ማግኘት የተሻለ ነው
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "No signature" }, { status: 400 });
    }

    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orgId = session.metadata?.orgId;
      const amount = (session.amount_total || 0) / 100;

      if (orgId) {
        // ባላንስ ማደስ
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
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Webhook Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}