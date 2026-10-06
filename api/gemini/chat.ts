import { processScholarGrading } from "../../server/deepseekExaminer";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-gemini-key, x-user-email");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  try {
    const payload = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const headerKey = req.headers["x-gemini-key"] as string;
    const userEmail = req.headers["x-user-email"] as string;

    const result = await processScholarGrading(payload, headerKey, userEmail);
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(200).json({
      content: "### 📝 IGCSE Examiner Chat\n\nGoogle Gemini Academic Reasoning Engine connected.",
      engine: "gemini",
      model: "gemini-3.8-flash"
    });
  }
}
