import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeRequest {
  email?: string;
  displayName?: string;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const authorization = request.headers.get("Authorization");
  if (!authorization) {
    return json({ error: "Authentication required" }, 401);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authorization } } },
  );
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return json({ error: "Invalid session" }, 401);
  }

  const body = (await request.json().catch(() => ({}))) as WelcomeRequest;
  const email = userData.user.email ?? body.email;
  if (!email) {
    return json({ error: "The signed-in user has no email address" }, 422);
  }

  const resendKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("WELCOME_FROM_EMAIL");
  if (!resendKey || !from) {
    return json({ error: "Welcome email service is not configured" }, 503);
  }

  const displayName =
    body.displayName?.trim() ||
    userData.user.user_metadata?.display_name ||
    "there";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Welcome back to Contingency Genius",
      html: welcomeHtml(displayName),
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    console.error("Resend rejected welcome email", details);
    return json({ error: "Email provider rejected the welcome email" }, 502);
  }

  return json({ sent: true });
});

function welcomeHtml(displayName: string) {
  return `
    <div style="font-family:Trebuchet MS,Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px;color:#171717">
      <div style="background:#ff641f;color:#fff;padding:18px 20px;border-radius:18px 18px 0 0;font-weight:700">
        Contingency Genius
      </div>
      <div style="border:1px solid #eee;border-top:0;padding:28px 24px;border-radius:0 0 18px 18px">
        <p style="font-size:14px;color:#777;margin-top:0">YOUR DAY, COVERED.</p>
        <h1 style="font-size:30px;line-height:1.1;margin:0 0 16px">Welcome back, ${escapeHtml(displayName)}.</h1>
        <p style="font-size:16px;line-height:1.6;color:#444">
          Your readiness workspace is waiting. Check today's risk signals, review your backup plans,
          and move through the day with a little more breathing room.
        </p>
        <p style="font-size:14px;line-height:1.6;color:#777;margin-bottom:0">
          You received this message because you signed in to Contingency Genius.
        </p>
      </div>
    </div>
  `;
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] ??
      character,
  );
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
