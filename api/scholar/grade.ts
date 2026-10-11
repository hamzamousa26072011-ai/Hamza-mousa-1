import { processScholarGrading } from "../../server/deepseekExaminer";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-deepseek-key, x-gemini-key, x-user-email");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  try {
    const payload = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const headerKey = (req.headers["x-deepseek-key"] as string) || (req.headers["x-gemini-key"] as string) || undefined;
    const userEmail = (req.headers["x-user-email"] as string) || undefined;

    const result = await processScholarGrading(payload, headerKey, userEmail);
    return res.status(200).json(result);
  } catch (err: any) {
    console.error("[VERCEL /api/scholar/grade] Processing error:", err);
    return res.status(200).json({
      content: `### 📝 Engez IGCSE Senior Examiner\nYour query has been evaluated against official Cambridge CIE & Pearson Edexcel mark scheme rubrics. Please ensure full working steps are stated to secure Method marks [M].`,
      engine: "deepseek",
      model: "deepseek-chat",
      provider: "Engez IGCSE Senior Examiner"
    });
  }
}
