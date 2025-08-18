function json(obj: any, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const onRequest: PagesFunction = async ({ request, env }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookies = Object.fromEntries(
    (request.headers.get("cookie") || "")
      .split(";")
      .map((p) => p.trim().split("=").map(decodeURIComponent))
      .filter((kv) => kv.length === 2),
  );
  if (!code || !state || cookies["gh_oauth_state"] !== state) {
    return json({ error: "Invalid oauth state" }, 400);
  }

  const clientId = (env as any).GITHUB_CLIENT_ID as string | undefined;
  const clientSecret = (env as any).GITHUB_CLIENT_SECRET as string | undefined;
  const kv = (env as any).SESSIONS_KV as KVNamespace | undefined;
  const redirectBase = (env as any).PUBLIC_URL as string | undefined;

  if (!clientId || !clientSecret) {
    return json({ error: "Missing GitHub OAuth credentials" }, 400);
  }

  // exchange code
  const tokenResp = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });
  const tokenJson: any = await tokenResp.json();
  const accessToken = tokenJson.access_token as string | undefined;
  if (!accessToken) return json({ error: "Failed to get access token" }, 400);

  // fetch user
  const userResp = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });
  const user = await userResp.json();

  // store session
  const sessionId = crypto
    .getRandomValues(new Uint8Array(16))
    .reduce((acc, b) => acc + b.toString(16).padStart(2, "0"), "");
  if (kv)
    await kv.put(`sess:${sessionId}`, JSON.stringify({ user, accessToken }), {
      expirationTtl: 60 * 60 * 24 * 7,
    });

  const base = redirectBase || `${url.protocol}//${url.host}`;
  const headers = new Headers({
    Location: `${base}/`,
    "Set-Cookie": `gh_session=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`,
  });
  return new Response(null, { status: 302, headers });
};
