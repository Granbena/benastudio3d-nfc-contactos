import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function text(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método no permitido." }, 405);

  try {
    const body = await req.json();
    const accessCode = text(body?.access_code, 40).toUpperCase();
    const firstName = text(body?.first_name, 80);
    const lastName = text(body?.last_name, 100);
    const role = text(body?.role, 140);
    const phone = text(body?.phone, 30) || null;
    const email = text(body?.email, 200).toLowerCase() || null;
    const linkedin = text(body?.linkedin, 500) || null;
    const consent = body?.consent === true;
    const websiteTrap = text(body?.website_confirm, 200);

    if (websiteTrap) return json({ ok: true });
    if (!accessCode || !firstName || !lastName || !role || !consent) {
      return json({ error: "Faltan datos obligatorios." }, 400);
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: "El correo no tiene un formato válido." }, 400);
    }

    const secretKeys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
    const secretKey = secretKeys.default || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    if (!supabaseUrl || !secretKey) return json({ error: "Configuración del servicio incompleta." }, 500);

    const admin = createClient(supabaseUrl, secretKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: company, error: companyError } = await admin
      .from("nfc_companies")
      .select("id,name")
      .eq("access_code", accessCode)
      .eq("enabled", true)
      .maybeSingle();

    if (companyError || !company) return json({ error: "Código de empresa no válido." }, 404);

    const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const ip = forwarded || req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || "unknown";
    const agent = req.headers.get("user-agent") || "unknown";
    const ipHash = await sha256(`${ip}|${agent.slice(0, 160)}|${Deno.env.get("DENO_DEPLOYMENT_ID") || "nfc"}`);

    const { data: allowed, error: limitError } = await admin.rpc("nfc_allow_submission", {
      p_company_id: company.id,
      p_ip_hash: ipHash,
      p_limit: 5,
      p_window_minutes: 10,
    });

    if (limitError) return json({ error: "No pudimos validar el envío. Intenta nuevamente." }, 500);
    if (!allowed) return json({ error: "Se alcanzó el límite temporal de solicitudes. Intenta nuevamente más tarde." }, 429);

    const { error: insertError } = await admin.from("nfc_contacts").insert({
      company_id: company.id,
      first_name: firstName,
      last_name: lastName,
      role,
      phone,
      email,
      linkedin,
      show_call: Boolean(phone && body?.show_call !== false),
      show_whatsapp: Boolean(phone && body?.show_whatsapp === true),
      consent: true,
      status: "pending",
    });

    if (insertError?.message.includes("NFC_PROFILE_LIMIT_REACHED")) {
      return json({
        error: "La empresa ya utilizó todos los perfiles NFC contratados.",
        code: "PROFILE_LIMIT_REACHED",
      }, 409);
    }
    if (insertError?.message.includes("NFC_COMPANY_NOT_AVAILABLE")) {
      return json({ error: "La empresa no está disponible para nuevas solicitudes." }, 409);
    }
    if (insertError) return json({ error: "No pudimos registrar la solicitud. Revisa los datos e inténtalo nuevamente." }, 400);

    return json({ ok: true });
  } catch {
    return json({ error: "Solicitud no válida." }, 400);
  }
});
