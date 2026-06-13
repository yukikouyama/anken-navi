/**
 * functions/notify.js
 * GitHub Actions の cron で毎朝8時(JST)に実行される。
 *
 * 処理フロー:
 *   1. functions/data.json からプロジェクトデータを読む
 *   2. アラート集計（自分待ち・期限超過・期限間近・停滞）
 *   3. Gemini API で 3 行の朝サマリーを生成
 *   4. LINE Messaging API の pushMessage で自分に送信
 *
 * 必要な GitHub Secrets:
 *   GEMINI_API_KEY           - Google AI Studio で取得
 *   LINE_CHANNEL_ACCESS_TOKEN - LINE Developers のチャネルアクセストークン（長期）
 *   LINE_USER_ID             - LINE Developers > チャネル基本設定 > あなたのユーザーID
 *
 * データの同期方法:
 *   ブラウザアプリの「設定」タブ → 「通知用データをエクスポート」ボタンで
 *   data.json をダウンロードし、このリポジトリの functions/ に配置してコミット。
 *   → main へ push → deploy ワークフローがビルドしつつ、翌朝の通知に反映される。
 */

import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── 定数 ──────────────────────────────────────────────
const STALL_DAYS    = 5;
const DUE_SOON_DAYS = 7;
const GEMINI_MODEL  = "gemini-2.5-flash-lite"; // cronは速度優先でlite

// ── ヘルパ ────────────────────────────────────────────
const daysTo   = (iso) => iso ? Math.ceil((new Date(iso + "T00:00:00") - new Date()) / 86400000) : null;
const daysSince = (iso) => iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 86400000) : null;
const fmt       = (iso) => { if (!iso) return "—"; const d = new Date(iso + "T00:00:00"); return `${d.getMonth() + 1}/${d.getDate()}`; };

function openIssues(p)  { return p.issues.filter((i) => !i.done); }

function computeAlerts(projects) {
  const out = [];
  projects.filter((p) => !p.archived).forEach((p) => {
    openIssues(p).forEach((iss) => {
      const d     = daysTo(iss.due);
      const stale = daysSince(iss.updatedAt);
      let kind = null, note = "";
      if (iss.owner === "自分") {
        kind = "self"; note = d !== null && d < 0 ? `期限${-d}日超過` : d !== null ? `あと${d}日` : "対応待ち";
      } else if (d !== null && d < 0) {
        kind = "overdue"; note = `${-d}日超過`;
      } else if (d !== null && d <= DUE_SOON_DAYS) {
        kind = "due"; note = `あと${d}日`;
      } else if (stale !== null && stale >= STALL_DAYS) {
        kind = "stall"; note = `${stale}日動きなし`;
      }
      if (kind) out.push({ kind, note, projectName: p.name, iss });
    });
  });
  return out;
}

// ── Gemini で朝サマリーを生成 ─────────────────────────
async function buildSummary(alerts, projects) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY が設定されていません");

  const activeProjects = projects.filter((p) => !p.archived);
  const selfAlerts    = alerts.filter((a) => a.kind === "self");
  const overdueAlerts = alerts.filter((a) => a.kind === "overdue");
  const dueAlerts     = alerts.filter((a) => a.kind === "due");
  const stallAlerts   = alerts.filter((a) => a.kind === "stall");

  const context = `
案件数: ${activeProjects.length}件
自分待ち論点: ${selfAlerts.length}件 ${selfAlerts.map((a) => `[${a.projectName}] ${a.iss.title}(${a.note})`).join(", ")}
期限超過: ${overdueAlerts.length}件 ${overdueAlerts.map((a) => `[${a.projectName}] ${a.iss.title}(${a.note})`).join(", ")}
期限間近(7日): ${dueAlerts.length}件 ${dueAlerts.map((a) => `[${a.projectName}] ${a.iss.title}(${a.note})`).join(", ")}
停滞中: ${stallAlerts.length}件 ${stallAlerts.map((a) => `[${a.projectName}] ${a.iss.title}(${a.note})`).join(", ")}
`.trim();

  const prompt = `あなたは建築設計事務所の業務管理アシスタントです。
以下の案件状況サマリーを読んで、今日の朝の一言メッセージを作成してください。
・最大3文、絵文字なし、建築実務の当事者として自然な日本語で。
・「今日やるべき最優先の1件」を必ず明示してください。
・全員対応待ちで問題なければ「今日は確認日和です」のように一言でOK。

${context}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 200 },
      }),
    }
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.candidates?.[0]?.content?.parts?.map((x) => x.text).join("") ?? "（要約取得失敗）";
}

// ── LINE Messaging API でプッシュ送信 ─────────────────
async function sendLine(message) {
  const token  = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const userId = process.env.LINE_USER_ID;
  if (!token || !userId) throw new Error("LINE_CHANNEL_ACCESS_TOKEN または LINE_USER_ID が設定されていません");

  const res = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      to: userId,
      messages: [{ type: "text", text: message }],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`LINE API エラー: ${res.status} ${body}`);
  }
}

// ── メイン ────────────────────────────────────────────
async function main() {
  const dataPath = resolve(__dirname, "data.json");

  // データファイルが無い場合は通知しない（初回セットアップ前）
  if (!existsSync(dataPath)) {
    console.log("functions/data.json が見つかりません。ブラウザアプリからエクスポートしてコミットしてください。");
    process.exit(0);
  }

  const projects = JSON.parse(readFileSync(dataPath, "utf-8"));
  const alerts   = computeAlerts(projects);

  const today  = new Date().toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo", month: "long", day: "numeric", weekday: "short" });
  const urgent = alerts.filter((a) => a.kind === "self" || a.kind === "overdue");

  let body = "";
  if (alerts.length === 0) {
    body = `【案件ナビ】${today}\n\n今日は止まっている論点はありません。良い一日を。`;
  } else {
    const summary = await buildSummary(alerts, projects);
    body = `【案件ナビ】${today}\n\n${summary}\n\n────\n自分待ち ${alerts.filter((a) => a.kind === "self").length}件 / 期限超過 ${alerts.filter((a) => a.kind === "overdue").length}件 / 期限間近 ${alerts.filter((a) => a.kind === "due").length}件 / 停滞 ${alerts.filter((a) => a.kind === "stall").length}件`;
  }

  await sendLine(body);
  console.log("LINE 送信完了:\n" + body);
}

main().catch((e) => { console.error(e); process.exit(1); });
