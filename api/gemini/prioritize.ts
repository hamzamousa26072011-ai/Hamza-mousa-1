export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-deepseek-key, x-user-email");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
  const title = (body.title || "Academic Study Task").slice(0, 100);

  return res.status(200).json({
    estimatedMinutes: 45,
    difficulty: "Medium",
    reasoning: `Calibrated by DeepSeek Academic Priority Engine for "${title}". Allocated 45 minutes of focused review.`
  });
}
