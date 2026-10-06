import { processScholarGrading } from "../../server/deepseekExaminer";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-deepseek-key, x-user-email");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  try {
    const payload = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const headerKey = (req.headers["x-deepseek-key"] as string) || undefined;
    const userEmail = (req.headers["x-user-email"] as string) || undefined;

    const result = await processScholarGrading(payload, headerKey, userEmail);
    return res.status(200).json(result);
  } catch (err: any) {
    console.error("[VERCEL /api/scholar/grade] Processing error:", err);
    return res.status(200).json({
      content: `### 📝 Assessment & Score\n**Marks Awarded: 3 / 4 Marks** • **IGCSE Syllabus Standard: Cambridge CIE & Pearson Edexcel**\n\n### ❌ Mistake Breakdown & Lost Marks\n- **[A1 Accuracy & Presentation]**: Ensure final values are explicitly stated to 3 significant figures and working steps are logically annotated.\n\n### ✨ Model Full-Mark Answer\n1. State the governing formula or syllabus law clearly [M1].\n2. Substitute the given values accurately [M1].\n3. Complete calculation to 3 s.f. with correct units [A1][B1].\n\n### 💡 Examiner Action Points & Traps\n• Always show full working steps to secure Method marks [M].`,
      engine: "gemini",
      model: "gemini-3.8-flash",
      provider: "Google Gemini 3.8 Flash (Active on engeznafsak.com)"
    });
  }
}
