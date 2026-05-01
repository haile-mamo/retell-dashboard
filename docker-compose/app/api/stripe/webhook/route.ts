// 1. Next.js ይህንን API በ Build ሰዓት እንዳይነካውና ስህተት እንዳይፈጥር የሚያደርጉ መመሪያዎች
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabase";

// የ Stripe SDK የሚጠብቀውን ትክክለኛ ስሪት በመጠቀም አዲሱን Stripe Instance መፍጠር
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia" as any, 
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  // Signature ወይም Secret ከሌለ ስህተት መመለስ
  if (!sig || !endpointSecret) {
    return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    // ከ Stripe የመጣው መረጃ ትክክለኛ መሆኑን ማረጋገጥ
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // የክፍያ ሂደቱ በተሳካ ሁኔታ መጠናቀቁን ቼክ ማድረግ
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orgId = session.metadata?.orgId;
    
    // Stripe በ cents ስለሚልክ ወደ ትክክለኛው የገንዘብ መጠን መለወጥ
    const amountPaid = (session.amount_total || 0) / 100;

    if (orgId) {
      // ድርጅቱ ያለውን የቆየ Balance መፈለግ
      const { data: org, error: fetchError } = await supabase
        .from("organizations")
        .select("balance")
        .eq("id", orgId)
        .single();

      if (fetchError) {
        console.error("Database Fetch Error:", fetchError);
        return NextResponse.json({ error: "Organization not found" }, { status: 404 });
      }

      // አዲሱን Balance ማስላት
      const currentBalance = org?.balance || 0;
      const newBalance = currentBalance + amountPaid;

      // በ Supabase ላይ አዲሱን Balance ማዘመን
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