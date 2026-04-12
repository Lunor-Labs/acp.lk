import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PayHereNotification {
  merchant_id: string;
  order_id: string;
  payhere_amount: string;
  payhere_currency: string;
  status_code: string;
  md5sig: string;
  method: string;
  status_message: string;
  card_holder_name?: string;
  card_no?: string;
  custom_1?: string;
  custom_2?: string;
}

function generateMD5Hash(merchantSecret: string, orderId: string, amount: string, currency: string, statusCode: string): string {
  const hash = merchantSecret + orderId + amount + currency + statusCode;
  const encoder = new TextEncoder();
  const data = encoder.encode(hash);
  
  return Array.from(new Uint8Array(crypto.subtle.digestSync("MD5", data)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const merchantSecret = Deno.env.get("PAYHERE_MERCHANT_SECRET");

    if (!merchantSecret) {
      console.error("PAYHERE_MERCHANT_SECRET environment variable is not set");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const formData = await req.formData();
    const notification: PayHereNotification = {
      merchant_id: formData.get("merchant_id") as string,
      order_id: formData.get("order_id") as string,
      payhere_amount: formData.get("payhere_amount") as string,
      payhere_currency: formData.get("payhere_currency") as string,
      status_code: formData.get("status_code") as string,
      md5sig: formData.get("md5sig") as string,
      method: formData.get("method") as string,
      status_message: formData.get("status_message") as string,
      card_holder_name: formData.get("card_holder_name") as string || undefined,
      card_no: formData.get("card_no") as string || undefined,
      custom_1: formData.get("custom_1") as string || undefined,
      custom_2: formData.get("custom_2") as string || undefined,
    };

    console.log("PayHere webhook received:", {
      order_id: notification.order_id,
      status_code: notification.status_code,
      amount: notification.payhere_amount,
    });

    const localMd5sig = generateMD5Hash(
      merchantSecret,
      notification.order_id,
      notification.payhere_amount,
      notification.payhere_currency,
      notification.status_code
    );

    if (localMd5sig !== notification.md5sig) {
      console.error("MD5 signature verification failed", {
        received: notification.md5sig,
        calculated: localMd5sig,
      });
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let paymentStatus = "pending";
    if (notification.status_code === "2") {
      paymentStatus = "completed";
    } else if (notification.status_code === "-1" || notification.status_code === "-2" || notification.status_code === "-3") {
      paymentStatus = "failed";
    }

    const paymentUpdate = {
      payment_status: paymentStatus,
      payment_reference: notification.order_id,
      paid_at: paymentStatus === "completed" ? new Date().toISOString() : null,
    };

    const { error: classPaymentError } = await supabase
      .from("class_payments")
      .update(paymentUpdate)
      .eq("id", notification.order_id);

    if (classPaymentError) {
      const { error: studyPackPaymentError } = await supabase
        .from("study_pack_payments")
        .update(paymentUpdate)
        .eq("id", notification.order_id);

      if (studyPackPaymentError) {
        console.error("Error updating payment:", {
          classPaymentError,
          studyPackPaymentError,
        });
        return new Response(
          JSON.stringify({ error: "Database update failed" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      console.log("Study pack payment updated successfully:", {
        order_id: notification.order_id,
        status: paymentStatus,
      });
    } else {
      console.log("Class payment updated successfully:", {
        order_id: notification.order_id,
        status: paymentStatus,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        order_id: notification.order_id,
        status: paymentStatus,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});