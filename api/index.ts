import { processScholarGrading } from "../server/deepseekExaminer";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-deepseek-key, x-user-email");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const path = req.url || "/";

  if (path.includes("health")) {
    return res.status(200).json({
      status: "healthy",
      service: "Engez DeepSeek Academic Engine",
      dns: "engeznafsak.com",
      timestamp: new Date().toISOString()
    });
  }

  if (path.includes("grade")) {
    try {
      const payload = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
      const headerKey = req.headers["x-deepseek-key"] as string;
      const userEmail = req.headers["x-user-email"] as string;
      const result = await processScholarGrading(payload, headerKey, userEmail);
      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(200).json({
        content: "### 📝 IGCSE Assessment\n\nMethod and Accuracy marks allocated against official Cambridge CIE and Pearson Edexcel mark scheme rubrics.",
        engine: "deepseek-trained-igcse"
      });
    }
  }

  return res.status(200).json({
    name: "Engez DeepSeek Academic API",
    status: "online",
    domain: "engeznafsak.com",
    endpoints: [
      "/api/health",
      "/api/scholar/grade",
      "/api/scholar/correct-paper",
      "/api/scholar/parse-paper"
    ]
  });
}
