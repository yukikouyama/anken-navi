import React from "react";
import { TEAL, INK, SUB, BORDER, LINE_C, RED, ORANGE, ALERT_KINDS } from "../constants.js";
import { fmt, daysTo } from "../utils.js";
import { ISSUE_TYPES } from "./tabs.jsx";
import { Bell, Check, ChevronRight, X } from "lucide-react";

export default function AlertPanel({ alerts, onJump, onClose }) {
  const groups = Object.keys(ALERT_KINDS)
    .map((k) => ({ k, ...ALERT_KINDS[k], items: alerts.filter((a) => a.kind === k) }))
    .filter((g) => g.items.length > 0);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(20,30,40,0.5)", zIndex: 70, overflowY: "auto" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 480, margin: "24px auto", background: "#EEF2F3", borderRadius: 16, padding: 18, border: `1px solid ${BORDER}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 800, fontSize: 16, color: INK, display: "flex", alignItems: "center", gap: 6 }}>
            <Bell size={18} color={TEAL} /> 通知（{alerts.length}）
          </span>
          <button onClick={onClose} style={{ color: SUB }}><X size={20} /></button>
        </div>

        {alerts.length === 0 && (
          <div style={{ textAlign: "center", padding: "30px 0", color: SUB }}>
            <Check size={28} color={TEAL} style={{ margin: "0 auto 8px" }} />
            <div style={{ fontSize: 13 }}>止まっている案件はありません。</div>
          </div>
        )}

        {groups.map((g) => (
          <div key={g.k} style={{ marginTop: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: g.color }} />
              <span style={{ fontSize: 12, fontWeight: 800, color: g.color }}>{g.label}</span>
              <span style={{ fontSize: 11, color: SUB }}>{g.items.length}件</span>
            </div>
            {g.items.map((a) => {
              const T = ISSUE_TYPES[a.iss.type] || ISSUE_TYPES["その他"];
              return (
                <button key={a.project.id + a.id} onClick={() => onJump(a.project.id)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 10,
                    background: "#fff", border: `1px solid ${BORDER}`, borderLeft: `3px solid ${g.color}`,
                    borderRadius: 10, padding: "10px 12px", marginBottom: 6, textAlign: "left",
                  }}>
                  <T.icon size={18} color={T.color} strokeWidth={2.2} style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: SUB, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.project.name || "（名称未設定）"}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: INK }}>
                      {a.iss.title}<span style={{ fontWeight: 400, color: "#4A5A66", marginLeft: 6 }}>{a.iss.status}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: g.color }}>{a.note}</div>
                    <div style={{ fontSize: 10, color: SUB }}>{a.iss.owner}</div>
                  </div>
                  <ChevronRight size={15} color={SUB} style={{ flexShrink: 0 }} />
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
