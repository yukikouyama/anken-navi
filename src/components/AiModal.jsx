import React, { useState } from "react";
import { TEAL, TEAL_D, INK, SUB, BORDER, LINE_C, RED, GEMINI_MODELS } from "../constants.js";
import { fmt, uid, todayIso, nowIso } from "../utils.js";
import { callGemini, loadApiKey, saveApiKey, loadModel, saveModel } from "../gemini.js";
import { ISSUE_TYPES } from "./tabs.jsx";
import { Key, Sparkles, X } from "lucide-react";

const inputStyle = {
  border: `1px solid ${BORDER}`, borderRadius: 8, padding: "8px 10px",
  fontSize: 14, background: "#fff", color: INK, outline: "none", width: "100%",
};
const smallStyle = {
  border: `1px solid ${BORDER}`, borderRadius: 8, padding: "6px 8px",
  fontSize: 13, background: "#fff", color: INK, outline: "none",
};

export default function AiModal({ projects, onApply, onClose }) {
  const [key,      setKey]      = useState(loadApiKey);
  const [model,    setModel_]   = useState(loadModel);
  const [keyInput, setKeyInput] = useState("");
  const [editKey,  setEditKey]  = useState(!loadApiKey());
  const [memo,     setMemo]     = useState("");
  const [busy,     setBusy]     = useState(false);
  const [err,      setErr]      = useState("");
  const [result,   setResult]   = useState(null);
  const [target,   setTarget]   = useState("new");

  const handleSaveKey = () => {
    const k = keyInput.trim();
    if (!k) return;
    saveApiKey(k); setKey(k); setKeyInput(""); setEditKey(false);
  };
  const handleModel = (m) => { setModel_(m); saveModel(m); };
  const masked = key ? `••••••••${key.slice(-4)}` : "未設定";

  const run = async () => {
    if (!memo.trim()) return;
    if (!key) { setErr("先にGemini APIキーを設定してください。"); setEditKey(true); return; }
    setBusy(true); setErr(""); setResult(null);
    try { setResult(await callGemini(memo, key, model)); }
    catch (e) { setErr("整理に失敗しました：" + e.message); }
    finally { setBusy(false); }
  };

  const handleApply = () => {
    const issues = (result.issues || []).map((i) => ({
      id: uid(), done: false, updatedAt: nowIso(),
      type: Object.keys(ISSUE_TYPES).includes(i.type) ? i.type : "その他",
      title: i.title || "", status: i.status || "", owner: i.owner || "自分",
      due: /^\d{4}-\d{2}-\d{2}$/.test(i.due || "") ? i.due : "", rel: i.rel || "",
    }));
    const decided    = (result.decided    || []).map((t) => ({ id: uid(), text: t, date: todayIso() }));
    const nextChecks = (result.nextChecks || []).map((t) => ({ id: uid(), text: t }));
    onApply({ name: result.name || "新規案件", issues, decided, nextChecks }, target);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(20,30,40,0.5)", zIndex: 70, overflowY: "auto" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 480, margin: "24px auto", background: "#EEF2F3", borderRadius: 16, padding: 18, border: `1px solid ${BORDER}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 800, fontSize: 16, color: TEAL_D, display: "flex", alignItems: "center", gap: 6 }}>
            <Sparkles size={18} /> 現場メモをAIで整理
          </span>
          <button onClick={onClose} style={{ color: SUB }}><X size={20} /></button>
        </div>

        {/* APIキー設定 */}
        <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 10, padding: 10, marginTop: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: INK, fontWeight: 700 }}>
            <Key size={14} color={SUB} /> Gemini APIキー
          </div>
          {editKey ? (
            <div style={{ marginTop: 8 }}>
              <input type="password" style={{ ...smallStyle, width: "100%" }} value={keyInput}
                placeholder="APIキーを貼り付け" onChange={(e) => setKeyInput(e.target.value)} />
              <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                <button onClick={handleSaveKey} style={{ background: TEAL, color: "#fff", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 700 }}>保存</button>
                {key && <button onClick={() => { setEditKey(false); setKeyInput(""); }} style={{ color: SUB, fontSize: 12, padding: "0 8px" }}>取消</button>}
              </div>
              <div style={{ fontSize: 10.5, color: SUB, marginTop: 8, lineHeight: 1.6 }}>
                無料キーは aistudio.google.com/apikey で取得できます（カード登録不要）。<br />
                キーはこの端末のブラウザにのみ保存され、外部サーバーには送られません。
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
              <span style={{ fontSize: 12, color: SUB, fontFamily: "monospace" }}>{masked}</span>
              <button onClick={() => setEditKey(true)} style={{ fontSize: 12, color: TEAL, fontWeight: 700 }}>変更</button>
              <select value={model} onChange={(e) => handleModel(e.target.value)}
                style={{ ...smallStyle, marginLeft: "auto", fontSize: 11 }}>
                {GEMINI_MODELS.map((m) => <option key={m} value={m}>{m.replace("gemini-", "")}</option>)}
              </select>
            </div>
          )}
        </div>

        <p style={{ fontSize: 12, color: SUB, margin: "10px 0 8px" }}>雑でかまいません。論点・担当・期限・関連節目に分解します。</p>
        <textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={5}
          placeholder="例：盛岡民泊、クロス7/25完了予定。7/27から消防工事入れるか真工務店に確認中。キッチン仕様は飛澤様が未決。"
          style={{ ...inputStyle, resize: "vertical" }} />
        <button onClick={run} disabled={busy}
          style={{ width: "100%", marginTop: 10, background: busy ? SUB : TEAL, color: "#fff", borderRadius: 8, padding: "11px 0", fontSize: 14, fontWeight: 700 }}>
          {busy ? "整理中…" : "AIで整理する"}
        </button>
        {err && <div style={{ color: RED, fontSize: 12, marginTop: 8 }}>{err}</div>}

        {result && (
          <div style={{ marginTop: 14, background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, padding: 12 }}>
            <div style={{ fontWeight: 800, fontSize: 14 }}>{result.name || "（案件名 不明）"}</div>
            {(result.issues || []).map((iss, i) => {
              const T = ISSUE_TYPES[iss.type] || ISSUE_TYPES["その他"];
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: `1px solid ${LINE_C}`, fontSize: 12 }}>
                  <T.icon size={16} color={T.color} style={{ flexShrink: 0 }} />
                  <span style={{ fontWeight: 700 }}>{iss.title}</span>
                  <span style={{ flex: 1, color: "#4A5A66", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{iss.status}</span>
                  <span style={{ color: SUB }}>{iss.owner}</span>
                  <span style={{ fontWeight: 700, color: TEAL_D }}>{fmt(iss.due)}</span>
                </div>
              );
            })}
            {(result.decided    || []).length > 0 && <div style={{ fontSize: 12, marginTop: 8 }}><b style={{ color: TEAL }}>決定：</b>{result.decided.join(" ／ ")}</div>}
            {(result.nextChecks || []).length > 0 && <div style={{ fontSize: 12, marginTop: 4 }}><b style={{ color: TEAL_D }}>次に確認：</b>{result.nextChecks.join(" ／ ")}</div>}
            <select value={target} onChange={(e) => setTarget(e.target.value)}
              style={{ ...inputStyle, marginTop: 10, fontSize: 13 }}>
              <option value="new">新規案件として作成</option>
              {projects.filter((p) => !p.archived).map((p) => (
                <option key={p.id} value={p.id}>「{p.name || "（名称未設定）"}」に追記</option>
              ))}
            </select>
            <button onClick={handleApply}
              style={{ width: "100%", marginTop: 8, background: TEAL, color: "#fff", borderRadius: 8, padding: "11px 0", fontSize: 14, fontWeight: 700 }}>
              反映する
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
