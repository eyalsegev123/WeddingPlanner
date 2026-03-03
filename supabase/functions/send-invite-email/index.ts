const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const weddingTitle = typeof body?.weddingTitle === "string" ? body.weddingTitle.trim() : "your wedding";
    const appUrl = typeof body?.appUrl === "string" ? body.appUrl.trim() : "";

    if (!email || !email.includes("@")) {
      return new Response(JSON.stringify({ ok: false, error: "Invalid or missing email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ ok: false, error: "RESEND_API_KEY not set" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Wedding Planner <onboarding@resend.dev>",
        to: [email],
        subject: `You've been invited to plan ${weddingTitle}!`,
        html: `
          <p>You've been invited to collaborate on wedding planning for <strong>${weddingTitle}</strong>.</p>
          <p>Sign up or sign in at the link below using this exact email address (<strong>${email}</strong>) to accept the invitation:</p>
          <p><a href="${appUrl}">${appUrl}</a></p>
        `,
      }),
    });

    if (!res.ok) {
      const responseBody = await res.text();
      return new Response(JSON.stringify({ ok: false, error: responseBody }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
