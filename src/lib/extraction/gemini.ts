import { GoogleGenerativeAI } from "@google/generative-ai";

const EXTRACTION_PROMPT = `Eres un lector de capturas de pantalla de apps de préstamos en México.
Devuelve SOLO JSON válido, sin texto adicional antes o después, con este esquema exacto:
{"loans": [{"lender": string, "balance_mxn": number, "next_payment_mxn": number | null, "next_payment_date": string | null (formato YYYY-MM-DD), "cat_percent": number | null}], "notes": string}
Nunca inventes valores. Si un dato no es visible en la imagen, usa null.`;

export async function callGeminiVision(files: File[]): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const imageParts = await Promise.all(
    files.map(async (file) => {
      const buffer = Buffer.from(await file.arrayBuffer());
      return {
        inlineData: {
          mimeType: file.type,
          data: buffer.toString("base64"),
        },
      };
    }),
  );

  const result = await model.generateContent([
    { text: EXTRACTION_PROMPT },
    ...imageParts,
  ]);

  return result.response.text();
}
