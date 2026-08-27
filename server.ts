import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Lazy initialize Gemini client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasApiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// Chat API endpoint (ChatGPT-style conversational AI)
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, systemInstruction, language } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages array is required." });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(500).json({
        error: "Gemini API key is not configured in the environment.",
      });
    }

    const sysPrompt =
      systemInstruction ||
      `You are an extremely helpful, versatile, friendly, and smart AI assistant (like ChatGPT / Gemini).
You have full mastery over:
1. Photo Editing (lighting, color grading, filters, composition, visual aesthetics, prompt ideas).
2. Video Editing (storyboarding, scripts, viral hooks, captions, cuts, transitions, sound effects).
3. General Knowledge, Q&A, Science, Technology, Storytelling, Poetry, Coding, Translation, and Daily Life questions.
4. Fluent bilingual responses in Urdu (اردو) and English. If the user asks in Urdu or Roman Urdu, respond naturally in clear, beautiful Urdu (or English if requested). Always maintain a warm, encouraging, respectful, and crystal-clear tone.
Use clean markdown formatting with bolding, lists, and code blocks when appropriate.`;

    // Convert messages to Gemini format or send context
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: contents,
      config: {
        systemInstruction: sysPrompt,
      },
    });

    const replyText = response.text || "No response generated.";
    return res.json({ reply: replyText });
  } catch (error: any) {
    console.error("Error in /api/chat:", error);
    return res.status(500).json({
      error: error.message || "Failed to generate AI response.",
    });
  }
});

// AI Video Script & Storyboard Generator
app.post("/api/ai/video-script", async (req, res) => {
  try {
    const { topic, platform, language, duration } = req.body;
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(500).json({ error: "Gemini API key is required." });
    }

    const prompt = `Generate a creative, viral video script and storyboard for:
Topic: "${topic || "General Creative Video"}"
Target Platform: ${platform || "Shorts/Reels/TikTok"}
Preferred Duration: ${duration || "30-60 seconds"}
Language: ${language || "Urdu and English"}

Please provide:
1. 3 Catchy Hook Lines (Urdu & English)
2. Scene-by-Scene Visual & Voiceover Breakdown (Timestamp, Visual Action, Spoken Script, Sound Effect)
3. Suggested Background Music vibe & Color Grading / Filter Style
4. High-engagement Hashtags and Title.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
    });

    return res.json({ script: response.text });
  } catch (error: any) {
    console.error("Error in /api/ai/video-script:", error);
    return res.status(500).json({ error: error.message || "Failed to generate script." });
  }
});

// AI Smart Photo Suggestions
app.post("/api/ai/photo-magic", async (req, res) => {
  try {
    const { imageDescription, goal, language } = req.body;
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(500).json({ error: "Gemini API key is required." });
    }

    const prompt = `You are a professional photo editing expert. The user wants advice or auto settings for their photo:
Context/Description: "${imageDescription || "User uploaded photo"}"
Goal: "${goal || "Professional aesthetic look"}"
Language: ${language || "Urdu and English"}

Provide:
1. Recommended Adjustments (Brightness, Contrast, Saturation, Warmth, Vignette in numerical percentages from -100 to +100).
2. Best matching filter vibe (e.g., Cinematic Warm, Vintage Film, Vibrant Pop, Moody Monochrome).
3. 3 Creative Caption Ideas with Emojis & Hashtags in Urdu & English.
4. Tips to make this image look stunning.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
    });

    return res.json({ suggestions: response.text });
  } catch (error: any) {
    console.error("Error in /api/ai/photo-magic:", error);
    return res.status(500).json({ error: error.message || "Failed to generate photo advice." });
  }
});

// Mount Vite middleware or static files
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
