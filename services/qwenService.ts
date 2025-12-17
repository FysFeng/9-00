import { NewsType } from "../types";
import { DEFAULT_BRANDS } from "../constants";

export interface ExtractedNewsData {
  title: string;
  summary: string;
  brand: string;
  type: NewsType;
  date: string;
  url: string;
  image_keywords: string;
}

export const analyzeTextWithQwen = async (text: string): Promise<ExtractedNewsData> => {
  const systemPrompt = `
    You are an expert automotive news analyst. Extract structured data into STRICT JSON format.
    No markdown blocks.
    Structure:
    {
      "title": "Chinese headline",
      "summary": "2-3 sentences Chinese summary",
      "brand": "Primary brand from: ${DEFAULT_BRANDS.join(', ')} (or Other)",
      "type": "One of: ${Object.values(NewsType).join(', ')}",
      "date": "YYYY-MM-DD (default: ${new Date().toISOString().split('T')[0]})",
      "url": "URL or empty",
      "image_keywords": "3-6 English keywords"
    }
  `;

  try {
    // ✅ 请求我们自己的 Vercel 后端
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, prompt: systemPrompt })
    });

    if (!response.ok) {
      const errText = await response.text();
      
      // Handle HTML 404/500 responses gracefully (e.g. Vite dev server 404 or Vercel 500 page)
      if (errText.trim().startsWith('<')) {
         if (response.status === 404) {
            throw new Error(`API 路由不存在 (404)。如果您在本地运行，请使用 'vercel dev' 启动以支持后端 API，或配置代理。`);
         }
         throw new Error(`请求失败 (${response.status})。可能是后端 API 配置错误或崩溃。`);
      }
      
      // Try to parse JSON error
      try {
        const errJson = JSON.parse(errText);
        // Normalize error message: handle { error: "msg" } and { error: { message: "msg" } }
        let errorMsg = errJson.error || errJson.message || `API 请求失败: ${response.status}`;
        if (typeof errorMsg === 'object') {
            errorMsg = errorMsg.message || JSON.stringify(errorMsg);
        }
        throw new Error(errorMsg);
      } catch (e: any) {
        // If JSON parse fails, throw the original text or the error from above
        if (e.message && e.message !== 'Unexpected token') throw e; 
        throw new Error(`请求失败 (${response.status}): ${errText.substring(0, 100)}`);
      }
    }

    const data = await response.json();
    
    // Check for DashScope specific error structure in success 200 OK body
    if (data.code && data.code !== '200' && data.message) {
        throw new Error(`Qwen API Error: ${data.message}`);
    }

    const rawContent = data.output?.choices?.[0]?.message?.content || "";

    if (!rawContent) throw new Error("AI 返回了空内容");

    // 🧹 JSON 清洗逻辑
    let cleanJson = rawContent.replace(/```json/gi, "").replace(/```/g, "").trim();
    const firstOpen = cleanJson.indexOf("{");
    const lastClose = cleanJson.lastIndexOf("}");
    if (firstOpen !== -1 && lastClose !== -1) {
      cleanJson = cleanJson.substring(firstOpen, lastClose + 1);
    }

    return JSON.parse(cleanJson) as ExtractedNewsData;

  } catch (error) {
    console.error("Qwen Service Error:", error);
    throw error;
  }
};