export const onRequest: PagesFunction = async ({ request, env }) => {
  const url = new URL(request.url);
  const action = url.searchParams.get("action");

  if (action === "status") {
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "content-type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "Not implemented" }), {
    status: 400,
    headers: { "content-type": "application/json" },
  });
};