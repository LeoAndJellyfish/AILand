const express = require("express");
const axios = require("axios");
const cors = require("cors");
const dotenv = require("dotenv");

// 配置环境变量
dotenv.config();

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// 路由：调用 01-AI API
app.post("/api/openai", async (req, res) => {
  const { prompt } = req.body;
  apiKey = process.env.OPENAI_API_KEY; // 从 .env 文件加载 API 密钥
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    // 调用 01-AI API 获取回应
    const data = {
      model: "yi-lightning",
      messages: [
        { role:"user", content: prompt},
      ],
    };
    const response = await axios.post(
      "https://api.lingyiwanwu.com/v1/chat/completions",
      data,
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
      }
    );
    // 返回 01-AI 的回应
    res.json({
      response: response.data.choices[0].message.content
    });
  } catch (error) {
    console.error("01-AI request failed:", error);
    res.status(500).json({ error: "Failed to fetch 01-AI response" });
  }
});


// 路由：处理来自前端的对话请求
app.post("/api/chat", async (req, res) => {
  const { messages, model, url, maxTokens, envKey } = req.body;
  
  // 从环境变量获取密钥
  const apiKey = process.env[envKey];

  try {
    const response = await axios.post(
      url,
      {
        model,
        messages,
        temperature: 0.3,
        max_tokens: maxTokens,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
      }
    );
    res.json({
      response: response.data.choices[0]?.message?.content || 'AI: 请求失败，请重试',
    });
  } catch (error) {
    console.error("API request failed:", error);
    res.status(500).json({ error: `Failed to fetch AI response` });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});