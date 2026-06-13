import { TYPE_KEYS, GEMINI_KEY_STORE, GEMINI_MODEL_STORE, GEMINI_MODELS } from "./constants.js";
import { todayIso } from "./utils.js";

const AI_SCHEMA = {
  type: "object",
  properties: {
    name: { type: "string" },
    issues: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type:   { type: "string", enum: TYPE_KEYS },
          title:  { type: "string" },
          status: { type: "string" },
          owner:  { type: "string" },
          due:    { type: "string" },
          rel:    { type: "string" },
        },
        required: ["type", "title", "status", "owner", "due", "rel"],
        propertyOrdering: ["type", "title", "status", "owner", "due", "rel"],
      },
    },
    decided:    { type: "array", items: { type: "string" } },
    nextChecks: { type: "array", items: { type: "string" } },
  },
  required: ["name", "issues", "decided", "nextChecks"],
  propertyOrdering: ["name", "issues", "decided", "nextChecks"],
};

export function loadApiKey()  { return localStorage.getItem(GEMINI_KEY_STORE) || ""; }
export function saveApiKey(k) { localStorage.setItem(GEMINI_KEY_STORE, k); }
export function loadModel()   { return localStorage.getItem(GEMINI_MODEL_STORE) || GEMINI_MODELS[0]; }
export function saveModel(m)  { localStorage.setItem(GEMINI_MODEL_STORE, m); }

export async function callGemini(memo, key, model) {
  const prompt = `あなたは建築設計・リフォーム業務の案件整理アシスタントです。今日は${todayIso()}。
以下の雑なメモ（音声・メール・LINE貼付け含む）を読み取り、案件状況を整理してください。
- type は予算/工期/仕様/業者/その他から最も近いもの。
- owner は誰待ちか（自分・お客様・工務店名・業者名など）。読み取れなければ「自分」。
- due は期限が読み取れれば YYYY-MM-DD、なければ空文字。
- rel は関連する節目（着工前・発注前・契約前など）、なければ空文字。
- 該当しない配列は空配列で返す。

メモ:
"""${memo}"""`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: AI_SCHEMA,
          temperature: 0.2,
        },
      }),
    }
  );

  const data = await res.json();
  if (data.error) throw new Error(data.error.message || "APIエラー");

  const cand = data.candidates?.[0];
  const text = cand?.content?.parts?.map((x) => x.text || "").join("") ?? "";

  if (!text) {
    const fr = cand?.finishReason;
    throw new Error(
      fr === "SAFETY"
        ? "安全フィルタで応答がブロックされました。"
        : "応答が空でした。もう一度お試しください。"
    );
  }
  return JSON.parse(text);
}
