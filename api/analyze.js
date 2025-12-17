export default async function handler(req, res) {
  // 1. 允许跨域
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // ==========================================
  // 🔴 配置 API Key
  // ==========================================
  const apiKey = process.env.DASHSCOPE_API_KEY;

  if (!apiKey || apiKey.startsWith('sk-xxxx')) {
    console.error("API Key is missing or invalid placeholder.");
    return res.status(503).json({ 
      error: "服务器配置错误: 未设置 DASHSCOPE_API_KEY 环境变量。请在 Vercel 后台或 .env 文件中配置阿里云 API Key。" 
    });
  }

  const { text, prompt } = req.body;

  try {
    // Check if fetch is available (Node 18+)
    if (typeof fetch === 'undefined') {
        throw new Error("Node.js version too low. fetch is not defined. Please use Node 18+.");
    }

    // 2. 服务器端请求阿里云 (Qwen-Plus)
    const response = await fetch("https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "qwen-plus",
        input: {
          messages: [
            { role: "system", content: prompt },
            { role: "user", content: `News Text: ${text}` }
          ]
        },
        parameters: {
          result_format: "message",
          temperature: 0.1,
          top_p: 0.8
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Alibaba Cloud API Error:", data);
      // Ensure we extract a string message from the error object
      const errorMsg = data.message || data.code || "Unknown Upstream API Error";
      throw new Error(errorMsg);
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: error.message });
  }
}