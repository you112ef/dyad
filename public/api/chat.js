// Simple API endpoint for chat
export default async function handler(request) {
  // Handle CORS
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const {
      prompt: _prompt,
      provider: _provider,
      model: _model,
      clientKey: _clientKey,
    } = await request.json();

    // For demo purposes, return a helpful response
    // In production, this would integrate with actual AI providers
    const responses = [
      "مرحباً! هذا رد تجريبي من Dyad AI. في الإصدار الكامل، سيتم ربط التطبيق بمقدمي خدمات الذكاء الاصطناعي الحقيقيين.",
      "أهلاً بك! يمكنني مساعدتك في تطوير التطبيقات. هذا عرض تجريبي للواجهة.",
      "مرحباً! هذا نموذج أولي لـ Dyad AI. الإصدار الكامل يدعم العديد من مقدمي خدمات الذكاء الاصطناعي.",
      "أهلاً وسهلاً! في الإصدار الكامل، يمكنني مساعدتك في كتابة الكود وتطوير التطبيقات بشكل تفاعلي.",
    ];

    const randomResponse =
      responses[Math.floor(Math.random() * responses.length)];

    // Add some context about the demo
    const demoResponse = `${randomResponse}\n\n**📌 ملاحظة:** هذا عرض تجريبي للواجهة فقط. للحصول على الوظائف الكاملة:\n- تحميل تطبيق سطح المكتب\n- إعداد مفاتيح API الخاصة بك\n- الوصول إلى جميع مميزات التطوير المتقدمة`;

    return new Response(JSON.stringify({ content: demoResponse }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({
        error: "خطأ في معالجة الطلب. هذا عرض تجريبي للواجهة فقط.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
}
