function jsonResponse(obj: any, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const onRequest: PagesFunction = async ({ request, env }) => {
  const clientId = (env as any).GITHUB_CLIENT_ID as string | undefined;
  const redirectBase = (env as any).PUBLIC_URL as string | undefined;
  if (!clientId)
    return jsonResponse({ error: "Missing GITHUB_CLIENT_ID" }, 400);
  // Determine redirect URI from env or request URL
  const url = new URL(request.url);
  const base = redirectBase || `${url.protocol}//${url.host}`;
  const redirectUri = `${base}/api/auth/github/callback`;

  // CSRF state
  const state = crypto
    .getRandomValues(new Uint8Array(16))
    .reduce((acc, b) => acc + b.toString(16).padStart(2, "0"), "");

  const authorize = new URL("https://github.com/login/oauth/authorize");
  authorize.searchParams.set("client_id", clientId);
  authorize.searchParams.set("redirect_uri", redirectUri);
  authorize.searchParams.set("scope", "read:user user:email");
  authorize.searchParams.set("state", state);

  const headers = new Headers({
    Location: authorize.toString(),
    "Set-Cookie": `gh_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`,
  });
  return new Response(null, { status: 302, headers });
};
