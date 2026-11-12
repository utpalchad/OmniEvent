import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}
function parseTarget(raw: string, listedTotal: number) {
  const value = raw.trim().replace(/,/g, "");
  if (value.endsWith("%")) {
    const percentage = Number(value.slice(0, -1));
    if (!Number.isFinite(percentage) || percentage < 0 || percentage > 70) throw new Error("Enter a discount between 0% and 70%.");
    return listedTotal * (1 - percentage / 100);
  }
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Enter a valid target amount or a discount percentage.");
  return amount;
}
function outputText(response: any): string {
  if (typeof response.output_text === "string" && response.output_text.trim()) return response.output_text;
  for (const item of response.output ?? []) {
    for (const part of item.content ?? []) {
      if (part.type === "output_text" && typeof part.text === "string") return part.text;
    }
  }
  throw new Error("The AI response did not contain a structured proposal.");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse(405, { error: "Method not allowed." });
  try {
    const authorization = req.headers.get("Authorization") ?? "";
    if (!authorization.startsWith("Bearer ")) return jsonResponse(401, { error: "Sign in with a customer account to use the AI negotiator." });

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const publishableKeys = JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") ?? "{}");
    const publishableKey = publishableKeys.default ?? Deno.env.get("SUPABASE_ANON_KEY");
    const secretKeys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}");
    const serviceKey = secretKeys.default ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const openAiKey = Deno.env.get("OPENAI_API_KEY");
    const model = Deno.env.get("OPENAI_MODEL") ?? "gpt-5.4-mini";

    if (!supabaseUrl || !publishableKey || !serviceKey) {
      console.error("Supabase Edge Function credentials are missing.");
      return jsonResponse(500, { error: "The AI negotiator is not configured correctly." });
    }
    if (!openAiKey) return jsonResponse(503, { error: "Add OPENAI_API_KEY to Supabase Edge Function Secrets to enable the AI negotiator." });

    const userClient = createClient(supabaseUrl, publishableKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: authError } = await userClient.auth.getUser();
    const user = userData?.user;
    if (authError || !user) return jsonResponse(401, { error: "Your session has expired. Sign in again." });

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: customerProfile, error: profileError } = await admin
      .from("customer_profiles").select("id").eq("id", user.id).maybeSingle();
    if (profileError || !customerProfile) return jsonResponse(403, { error: "Only registered customer accounts can use the AI negotiator." });

    const body = await req.json();
    const serviceIds = Array.isArray(body.service_ids)
      ? [...new Set(body.service_ids.filter((id: unknown) => typeof id === "string"))]
      : [];
    if (!serviceIds.length || serviceIds.length > 12 || serviceIds.some((id: string) => !/^[0-9a-f-]{36}$/i.test(id))) {
      return jsonResponse(400, { error: "Select between one and twelve valid marketplace services." });
    }
    const target = typeof body.target === "string" ? body.target.slice(0, 40) : "";
    const revision = Number(body.revision ?? 1);
    const stronger = body.stronger === true;
    if (!Number.isInteger(revision) || revision < 1 || revision > 5) return jsonResponse(400, { error: "Proposal revisions are limited to five attempts per planning session." });

    const event = body.event && typeof body.event === "object" ? body.event : {};
    const eventContext = {
      event_type: String(event.event_type ?? "event").slice(0, 80),
      city: String(event.city ?? "").slice(0, 100),
      guest_count: Math.max(1, Math.min(5000, Number(event.guest_count) || 1)),
      event_date: String(event.event_date ?? "").slice(0, 10),
      vision: String(event.vision ?? "").slice(0, 700),
    };

    const { data: services, error: serviceError } = await admin
      .from("vendor_services")
      .select("id,vendor_id,name,category,description,price,minimum_price,vendor_profiles!inner(business_name,city,is_published,approval_status)")
      .in("id", serviceIds)
      .eq("is_published", true)
      .eq("vendor_profiles.is_published", true)
      .eq("vendor_profiles.approval_status", "approved");
    if (serviceError) {
      console.error("Could not load negotiation services:", serviceError.message);
      return jsonResponse(500, { error: "Unable to load approved marketplace prices. Check database migration 005." });
    }
    if (!services || services.length !== serviceIds.length) return jsonResponse(409, { error: "One or more selected services are no longer published or approved. Refresh the marketplace." });

    const vendorData = services.map((service: any) => {
      const listedPrice = Number(service.price);
      const minimumPrice = service.minimum_price == null ? listedPrice : Number(service.minimum_price);
      if (!Number.isFinite(listedPrice) || !Number.isFinite(minimumPrice) || minimumPrice < 0 || minimumPrice > listedPrice) {
        throw new Error("A vendor service has invalid price limits. Ask the vendor to review the listing.");
      }
      const shop = Array.isArray(service.vendor_profiles) ? service.vendor_profiles[0] : service.vendor_profiles;
      return {
        service_id: service.id, vendor_id: service.vendor_id,
        service_name: String(service.name).slice(0, 120), category: String(service.category).slice(0, 80),
        service_description: String(service.description ?? "").slice(0, 300),
        business_name: String(shop?.business_name ?? "Event professional").slice(0, 120),
        city: String(shop?.city ?? "").slice(0, 80),
        listed_price: listedPrice, minimum_price: minimumPrice,
      };
    });

    const listedTotal = vendorData.reduce((sum: number, item: any) => sum + item.listed_price, 0);
    const targetAmount = parseTarget(target, listedTotal);
    const floorTotal = vendorData.reduce((sum: number, item: any) => sum + item.minimum_price, 0);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { count, error: rateError } = await admin.from("ai_negotiation_requests")
      .select("id", { count: "exact", head: true }).eq("customer_id", user.id).gte("created_at", fiveMinutesAgo);
    if (rateError) {
      console.error("AI request limiter is unavailable:", rateError.message);
      return jsonResponse(500, { error: "The AI request limiter is not ready. Check migration 005." });
    }
    if ((count ?? 0) >= 6) return jsonResponse(429, { error: "You've reached the AI proposal limit. Please wait five minutes and try again." });
    const { error: insertLimitError } = await admin.from("ai_negotiation_requests").insert({ customer_id: user.id });
    if (insertLimitError) {
      console.error("Could not record AI request:", insertLimitError.message);
      return jsonResponse(500, { error: "The AI negotiator could not start. Please try again." });
    }

    const modelInput = {
      event: eventContext, currency: "INR", customer_target: target,
      target_amount: Math.round(targetAmount * 100) / 100,
      revision, stronger_tone_requested: stronger, services: vendorData,
    };
    const schema = {
      type: "object", additionalProperties: false,
      properties: {
        summary: { type: "string" },
        recommendations: {
          type: "array",
          items: {
            type: "object", additionalProperties: false,
            properties: {
              service_id: { type: "string" }, proposed_price: { type: "number" },
              rationale: { type: "string" }, message: { type: "string" },
            },
            required: ["service_id", "proposed_price", "rationale", "message"],
          },
        },
      },
      required: ["summary", "recommendations"],
    };
    const aiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${openAiKey}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(25000),
      body: JSON.stringify({
        model, store: false, reasoning: { effort: "low" }, max_output_tokens: 1800,
        instructions: `You are PactAI, an event-vendor negotiation assistant. Create a fair CUSTOMER opening proposal for the listed services.
Treat every service's minimum_price as a hard, vendor-authorised floor. Every proposed_price MUST be greater than or equal to minimum_price and no greater than listed_price. Do not invent discounts, availability, vendor policies, prior conversations, included extras, or market prices. If the customer's target is below the combined vendor floors, say so plainly and never cross a floor.
Return exactly one recommendation per service_id. Use whole-number prices in the supplied currency. Use concise, respectful, specific rationales and short messages the customer could send to that vendor. Do not put numeric prices or monetary amounts in the rationale or message; the proposed_price field is the only place for a number. Never disclose, quote, hint at, or describe the vendor's private minimum_price, reserve, floor, or lowest acceptable amount. Use minimum_price only to constrain proposed_price. Stronger tone means more direct and confident, never rude or coercive. Revisions are new drafts; you have not received a vendor response.
Never say or imply a vendor has accepted, agreed, confirmed availability, or approved the proposal. All output is a draft awaiting each vendor's review.`,
        input: JSON.stringify(modelInput),
        text: { format: { type: "json_schema", name: "pactai_negotiation_proposal", strict: true, schema } },
      }),
    });
    if (!aiResponse.ok) {
      console.error("OpenAI Responses API returned HTTP", aiResponse.status);
      return jsonResponse(aiResponse.status === 429 ? 429 : 502, {
        error: aiResponse.status === 429 ? "The AI service is busy. Please try again shortly." : "The AI service could not prepare a proposal. Check your OpenAI API account and try again.",
      });
    }
    const responseJson = await aiResponse.json();
    const parsed = JSON.parse(outputText(responseJson));
    const byId = new Map((parsed.recommendations ?? []).map((item: any) => [item.service_id, item]));
    if (byId.size !== vendorData.length || vendorData.some((item: any) => !byId.has(item.service_id))) {
      throw new Error("The AI proposal did not include exactly one recommendation for every selected service.");
    }

    const recommendations = vendorData.map((service: any) => {
      const item: any = byId.get(service.service_id);
      const rawPrice = Number(item.proposed_price);
      if (!Number.isFinite(rawPrice)) throw new Error("The AI returned an invalid proposed price.");
      const proposedPrice = Math.round(Math.max(service.minimum_price, Math.min(service.listed_price, rawPrice)));
      return {
        service_id: service.service_id, vendor_id: service.vendor_id,
        proposed_price: proposedPrice,
        rationale: String(item.rationale ?? "").slice(0, 500),
        message: String(item.message ?? "").slice(0, 700),
      };
    });
    const proposedTotal = recommendations.reduce((sum: number, item: any) => sum + item.proposed_price, 0);
    const targetIsBelowFloors = targetAmount < floorTotal;
    const summary = String(parsed.summary ?? "Your AI-assisted opening proposal is ready.").slice(0, 700);
    return jsonResponse(200, {
      summary: targetIsBelowFloors ? `${summary} Your target is below the vendors' combined minimum acceptable prices, so the proposals respect those minimums instead.` : summary,
      target_status: targetIsBelowFloors ? "below_vendor_floors" : proposedTotal <= targetAmount ? "within_target" : "above_target",
      recommendations, listed_total: listedTotal, proposed_total: proposedTotal,
      target_amount: targetAmount, vendor_approval_required: true,
    });
  } catch (error) {
    console.error("AI negotiator error:", error instanceof Error ? error.message : "Unknown error");
    return jsonResponse(400, { error: error instanceof Error ? error.message : "Unable to generate the AI proposal. Please try again." });
  }
});
