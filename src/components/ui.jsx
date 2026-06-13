import React from "react";
import {
  TEAL, TEAL_D, INK, SUB, CARD, BORDER, LINE_C, BLUE, ORANGE, PURPLE, LANES,
} from "../constants.js";
import { fmt, dayNum } from "../utils.js";
import {
  ChevronRight, Check,
} from "lucide-react";

/* ---- Header ---- */
export function Header({ title, left, right }) {
  return (
    <div style={{
      background: CARD, borderBottom: `1px solid ${BORDER}`,
      padding: "12px 14px", display: "flex", alignItems: "center", gap: 10,
      position: "sticky", top: 0, zIndex: 30,
    }}>
      <div style={{ width: 60, display: "flex", justifyContent: "flex-start" }}>{left}</div>
      <div style={{ flex: 1, textAlign: "center", fontWeight: 800, fontSize: 17, color: INK, letterSpacing: "0.04em" }}>{title}</div>
      <div style={{ width: 60, display: "flex", justifyContent: "flex-end", gap: 12 }}>{right}</div>
    </div>
  );
}

/* ---- StatTile ---- */
export function StatTile({ icon: I, label, value, unit, color }) {
  return (
    <div style={{
      flex: 1, minWidth: 0, background: CARD, border: `1px solid ${BORDER}`,
      borderRadius: 12, padding: "10px 4px", textAlign: "center",
    }}>
      <I size={18} color={color || TEAL} strokeWidth={2} style={{ margin: "0 auto" }} />
      <div style={{ fontSize: 10, color: SUB, marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</div>
      <div style={{ marginTop: 1, whiteSpace: "nowrap" }}>
        <span style={{ fontSize: 17, fontWeight: 800, color: color || INK }}>{value}</span>
        {unit && <span style={{ fontSize: 10, color: SUB, marginLeft: 1 }}>{unit}</span>}
      </div>
    </div>
  );
}

/* ---- Card ---- */
export function Card({ title, children, style }) {
  return (
    <div style={{
      background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14,
      padding: "12px 14px", marginTop: 12, ...style,
    }}>
      {title && <div style={{ fontWeight: 800, fontSize: 13, color: INK, marginBottom: 8 }}>{title}</div>}
      {children}
    </div>
  );
}

/* ---- MilestoneTimeline ---- */
export function MilestoneTimeline({ milestones }) {
  const cur = (() => {
    const i = milestones.findIndex((m) => !m.done);
    return i === -1 ? milestones.length - 1 : i;
  })();
  return (
    <div style={{ display: "flex", overflowX: "auto", paddingBottom: 4 }}>
      {milestones.map((m, i) => {
        const done = m.done, isCur = i === cur && !done;
        return (
          <div key={m.id} style={{ flex: i === milestones.length - 1 ? "0 0 auto" : 1, minWidth: 52, display: "flex", flexDirection: "column" }}>
            <div style={{ textAlign: "center", fontSize: 9.5, color: INK, fontWeight: 600, whiteSpace: "nowrap" }}>{m.label}</div>
            <div style={{ display: "flex", alignItems: "center", margin: "5px 0" }}>
              <div style={{ flex: 1, height: 2, background: i === 0 ? "transparent" : (done || i <= cur) ? TEAL : "#CDD6DB" }} />
              <div style={{
                width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                background: done ? TEAL : "#fff",
                border: `2px solid ${done ? TEAL : isCur ? TEAL : "#CDD6DB"}`,
                boxShadow: isCur ? `0 0 0 3px ${TEAL}33` : "none",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {done && <Check size={11} color="#fff" strokeWidth={3.5} />}
                {isCur && <div style={{ width: 7, height: 7, borderRadius: "50%", background: TEAL }} />}
              </div>
              <div style={{ flex: 1, height: 2, background: i === milestones.length - 1 ? "transparent" : ((done && milestones[i + 1]?.done) || i < cur) ? TEAL : "#CDD6DB" }} />
            </div>
            <div style={{ textAlign: "center", fontSize: 10, color: SUB, whiteSpace: "nowrap" }}>{fmt(m.date)}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ---- Gantt ---- */
export function Gantt({ tasks, onEdit }) {
  if (tasks.length === 0)
    return <div style={{ fontSize: 12, color: SUB, padding: "8px 0" }}>工程がまだありません。「＋ 工程を追加」から登録できます。</div>;

  const PX = 9;
  const allDays = tasks.flatMap((t) => [dayNum(t.start), dayNum(t.end)]).filter((n) => !isNaN(n));
  let min = Math.min(...allDays), max = Math.max(...allDays);
  min = min - ((min % 7) + 7) % 7;
  max = max + (6 - (((max % 7) + 7) % 7));
  const totalDays = Math.max(max - min, 7), gridW = totalDays * PX, labelW = 64;
  const weeks = []; for (let d = min; d <= max; d += 7) weeks.push(d);

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ minWidth: labelW + gridW }}>
        {/* 日付ヘッダ */}
        <div style={{ display: "flex", marginBottom: 6 }}>
          <div style={{ width: labelW, flexShrink: 0 }} />
          <div style={{ position: "relative", width: gridW, height: 14 }}>
            {weeks.map((d) => (
              <div key={d} style={{ position: "absolute", left: (d - min) * PX, fontSize: 9, color: SUB, transform: "translateX(-50%)", whiteSpace: "nowrap" }}>
                {new Date(d * 86400000).getMonth() + 1}/{new Date(d * 86400000).getDate()}
              </div>
            ))}
          </div>
        </div>
        {/* レーン */}
        {LANES.map((lane) => {
          const laneTasks = tasks
            .filter((t) => t.lane === lane.key)
            .sort((a, b) => dayNum(a.start) - dayNum(b.start));
          if (laneTasks.length === 0) return null;
          const rows = [];
          laneTasks.forEach((t) => {
            let placed = false;
            for (const row of rows) {
              if (dayNum(t.start) >= dayNum(row[row.length - 1].end)) { row.push(t); placed = true; break; }
            }
            if (!placed) rows.push([t]);
          });
          const laneH = rows.length * 26;
          return (
            <div key={lane.key} style={{ display: "flex", alignItems: "flex-start", borderTop: `1px solid ${LINE_C}`, padding: "6px 0" }}>
              <div style={{ width: labelW, flexShrink: 0, fontSize: 11, fontWeight: 700, color: INK, paddingTop: 4 }}>{lane.key}</div>
              <div style={{ position: "relative", width: gridW, height: laneH }}>
                {weeks.map((d) => <div key={d} style={{ position: "absolute", left: (d - min) * PX, top: 0, bottom: 0, width: 1, background: LINE_C }} />)}
                {rows.map((row, ri) => row.map((t) => {
                  const s = dayNum(t.start), e = dayNum(t.end);
                  const left = (s - min) * PX, w = Math.max((e - s) * PX, 24);
                  return (
                    <button key={t.id} onClick={() => onEdit(t)}
                      title={`${t.label} ${fmt(t.start)}–${fmt(t.end)}`}
                      style={{
                        position: "absolute", left, top: ri * 26, width: w, height: 20,
                        background: lane.color, color: "#fff", borderRadius: 5,
                        fontSize: 10, fontWeight: 700,
                        display: "flex", alignItems: "center",
                        padding: "0 5px", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
                      }}>
                      {t.label}
                    </button>
                  );
                }))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
