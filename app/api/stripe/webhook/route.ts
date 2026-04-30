import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabase";

// 1. የ API Version ወደ አዲሱ "2024-04-10" ተቀይሯል
// ይህም በ Vercel ላይ ያጋጠመህን የ Type Error ይፈታዋል
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10", 
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  // Signature ከሌለ ወዲያውኑ ውድቅ ማድረግ
  if (!sig || !endpointSecret) {
    return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // የክፍያ ሂደቱ በተሳካ ሁኔታ ሲጠናቀቅ
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orgId = session.metadata?.orgId;
    
    // Stripe ሳንቲሞችን (cents) ስለሚልክ ወደ ዶላር ለመቀየር ለ 100 እናካፍለዋለን
    const amountPaid = (session.amount_total || 0) / 100;

    if (orgId) {
      // 2. የአሁኑን የድርጅቱን የገንዘብ መጠን (Balance) ማግኘት
      const { data: org, error: fetchError } = await supabase
        .from("organizations")
        .select("balance")
        .eq("id", orgId)
        .single();

      if (fetchError) {
        console.error("Database Fetch Error:", fetchError);
        return NextResponse.json({ error: "Organization not found" }, { status: 404 });
      }

      // 3. አዲሱን መጠን ማስላት
      const currentBalance = org?.balance || 0;
      const newBalance = currentBalance + amountPaid;

      // 4. በ Supabase ላይ የ Balance ለውጡን ማዘመን
      const { error: updateError } = await supabase
        .from("organizations")
        .update({ balance: newBalance })
        .eq("id", orgId);

      if (updateError) {
        console.error("Database Update Error:", updateError);
        return NextResponse.json({ error: "Failed to update balance" }, { status: 500 });
      }
      
      console.log(`Successfully updated balance for org: ${orgId}. New balance: ${newBalance}`);
    }
  }

  return NextResponse.json({ received: true });
}