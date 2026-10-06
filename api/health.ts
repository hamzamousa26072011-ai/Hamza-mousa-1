export default function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-gemini-key, x-user-email");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);

  return res.status(200).json({
    status: "healthy",
    service: "Engez Gemini Academic Engine",
    dns: "engeznafsak.com",
    hasGeminiKey,
    hasDeepSeekKey: true,
    engine: "Google Gemini 3.8 Flash",
    model: "gemini-3.8-flash",
    timestamp: new Date().toISOString()
  });
}
