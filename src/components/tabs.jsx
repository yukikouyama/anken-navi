import React, { useState } from "react";
import {
  TEAL, TEAL_D, INK, SUB, CARD, BORDER, LINE_C,
  BLUE, ORANGE, PURPLE, RED, LANES, OWNER_CHIPS,
  TYPE_KEYS, MILESTONES_DEFAULT,
} from "../constants.js";
import {
  fmt, todayIso, nowIso, uid, man, daysTo,
  taxIncluded, committed, remaining,
  openIssues, waitingCount, dueSoonCount, getMilestone,
} from "../utils.js";
import { StatTile, Card, MilestoneTimeline, Gantt } from "./ui.jsx";
import {
  MessageCircle, Clock, CalendarClock, JapaneseYen, CalendarDays, Flag,
  PieChart, FileText, PencilLine, HardHat, Receipt, Search, Check,
  ChevronRight, Users, Circle, Plus, Trash2, X,
} from "lucide-react";

export const ISSUE_TYPES = {
  予算:   { icon: JapaneseYen, color: TEAL   },
  工期:   { icon: CalendarClock, color: ORANGE },
  仕様:   { icon: PencilLine,  color: BLUE   },
  業者:   { icon: Users,       color: PURPLE },
  その他: { icon: Circle,      color: SUB    },
};

const inputStyle = {
  border: `1px solid ${BORDER}`, borderRadius: 8, padding: "8px 10px",
  fontSize: 14, background: "#fff", color: INK, outline: "none", width: "100%",
};
const smallStyle = {
  border: `1px solid ${BORDER}`, borderRadius: 8, padding: "6px 8px",
  fontSize: 13, background: "#fff", color: INK, outline: "none",
};

/* ======== DashboardTab ======== */
export function DashboardTab({ p, go }) {
  return (
    <div style={{ padding: "12px 14px" }}>
      <div style={{ display: "flex", gap: 8 }}>
        <StatTile icon={MessageCircle} label="進行中論点" value={openIssues(p).length} unit="件" />
        <StatTile icon={Clock}         label="確認待ち"   value={waitingCount(p)}       unit="件" color={ORANGE} />
        <StatTile icon={CalendarClock} label="重要期限"   value={dueSoonCount(p)}       unit="件" color={RED} />
        <StatTile icon={JapaneseYen}   label="予算差額"   value={man(remaining(p))}     unit="万円" color={remaining(p) < 0 ? RED : TEAL} />
      </div>
      <Card title="スケジュール概要"><MilestoneTimeline milestones={p.milestones} /></Card>
      <Card title="進行中の論点">
        {openIssues(p).length === 0 && <div style={{ fontSize: 12, color: SUB }}>論点はありません</div>}
        {openIssues(p).slice(0, 5).map((iss) => {
          const T = ISSUE_TYPES[iss.type] || ISSUE_TYPES["その他"];
          return (
            <button key={iss.id} onClick={() => go("issues")}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: `1px solid ${LINE_C}`, textAlign: "left" }}>
              <T.icon size={18} color={T.color} strokeWidth={2.2} style={{ flexShrink: 0 }} />
              <span style={{ fontWeight: 700, fontSize: 14, color: INK, whiteSpace: "nowrap" }}>{iss.title}</span>
              <span style={{ flex: 1, textAlign: "right", fontSize: 13, color: SUB, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{iss.status}</span>
              <ChevronRight size={16} color={SUB} style={{ flexShrink: 0 }} />
            </button>
          );
        })}
      </Card>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <StatTile icon={CalendarDays} label="工事開始予定" value={fmt(getMilestone(p, "着工")?.date)}   color={BLUE}   />
        <StatTile icon={Flag}         label="引渡し目標"   value={fmt(getMilestone(p, "引渡し")?.date)} color={ORANGE} />
        <StatTile icon={PieChart}     label="総予算"       value={man(p.budgetTotal)} unit="万円" color={TEAL}   />
        <StatTile icon={FileText}     label="設計費"       value={man(p.designFee)}   unit="万円" color={PURPLE} />
      </div>
    </div>
  );
}

/* ======== IssuesTab ======== */
export function IssuesTab({ p, set }) {
  const [editing, setEditing] = useState(null);
  const [adding, setAdding]   = useState(false);
  const [draft, setDraft]     = useState({ type: "その他", title: "", status: "", owner: "自分", due: "", rel: "" });
  const [newDecided, setNewDecided] = useState("");
  const [newCheck,   setNewCheck]   = useState("");

  const upd   = (id, patch) => set({ issues: p.issues.map((i) => i.id === id ? { ...i, ...patch, updatedAt: nowIso() } : i) });
  const finish = (iss) => {
    set({
      issues:  p.issues.filter((i) => i.id !== iss.id),
      decided: [...p.decided, { id: uid(), text: `${iss.title}：${iss.status || "確定"}`, date: todayIso() }],
    });
    setEditing(null);
  };

  const IssueEditor = ({ value, onChange }) => (
    <div style={{ background: "#F6F9F9", borderRadius: 10, padding: 10 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
        {TYPE_KEYS.map((k) => {
          const T = ISSUE_TYPES[k], on = value.type === k;
          return (
            <button key={k} onClick={() => onChange({ ...value, type: k })}
              style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, padding: "4px 9px", borderRadius: 99, border: `1px solid ${on ? T.color : BORDER}`, background: on ? T.color : "#fff", color: on ? "#fff" : INK }}>
              <T.icon size={12} color={on ? "#fff" : T.color} /> {k}
            </button>
          );
        })}
      </div>
      <input style={{ ...smallStyle, width: "100%", marginBottom: 6 }} value={value.title}  placeholder="論点名（例：工期確認）"        onChange={(e) => onChange({ ...value, title:  e.target.value })} />
      <input style={{ ...smallStyle, width: "100%", marginBottom: 6 }} value={value.status} placeholder="ステータス（例：消防工事日程確認）" onChange={(e) => onChange({ ...value, status: e.target.value })} />
      <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
        <input style={{ ...smallStyle, flex: 1 }} value={value.owner} placeholder="担当" list="owners-list" onChange={(e) => onChange({ ...value, owner: e.target.value })} />
        <input type="date" style={{ ...smallStyle, width: 150 }} value={value.due} onChange={(e) => onChange({ ...value, due: e.target.value })} />
      </div>
      <input style={{ ...smallStyle, width: "100%" }} value={value.rel} placeholder="関連節目（例：着工前）" list="rel-list" onChange={(e) => onChange({ ...value, rel: e.target.value })} />
      <datalist id="owners-list">{OWNER_CHIPS.map((o) => <option key={o} value={o} />)}</datalist>
      <datalist id="rel-list">{[...p.milestones.map((m) => m.label), "予算確定前", "発注前", "着工前", "契約前", "中間確認前", "引渡し前"].map((o, i) => <option key={i} value={o} />)}</datalist>
    </div>
  );

  return (
    <div style={{ padding: "12px 14px" }}>
      <Card title="進行中の論点">
        <div style={{ display: "flex", fontSize: 10, color: SUB, padding: "0 0 6px", gap: 6 }}>
          <span style={{ flex: 1.2, paddingLeft: 26 }}>論点</span>
          <span style={{ flex: 1.3 }}>ステータス</span>
          <span style={{ width: 56 }}>担当</span>
          <span style={{ width: 36 }}>期限</span>
          <span style={{ width: 16 }} />
        </div>
        {openIssues(p).map((iss) => {
          const T = ISSUE_TYPES[iss.type] || ISSUE_TYPES["その他"];
          const d = daysTo(iss.due), urgent = d !== null && d <= 7, isE = editing === iss.id;
          return (
            <div key={iss.id} style={{ borderTop: `1px solid ${LINE_C}` }}>
              <button onClick={() => setEditing(isE ? null : iss.id)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 6, padding: "9px 0", textAlign: "left" }}>
                <T.icon size={18} color={T.color} strokeWidth={2.2} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1.2, fontWeight: 700, fontSize: 13, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{iss.title}</span>
                <span style={{ flex: 1.3, fontSize: 12, color: "#4A5A66", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{iss.status}</span>
                <span style={{ width: 56, fontSize: 11, color: iss.owner === "自分" ? RED : "#4A5A66", fontWeight: iss.owner === "自分" ? 700 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{iss.owner}</span>
                <span style={{ width: 36, fontSize: 11, fontWeight: 700, color: urgent ? RED : TEAL_D }}>{fmt(iss.due)}</span>
                <ChevronRight size={15} color={SUB} style={{ width: 16, flexShrink: 0, transform: isE ? "rotate(90deg)" : "none" }} />
              </button>
              {iss.rel && !isE && <div style={{ fontSize: 10, color: SUB, paddingLeft: 26, paddingBottom: 8 }}>関連節目：{iss.rel}</div>}
              {isE && (
                <div style={{ paddingBottom: 10 }}>
                  <IssueEditor value={iss} onChange={(v) => upd(iss.id, v)} />
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button onClick={() => finish(iss)} style={{ flex: 1, background: TEAL, color: "#fff", borderRadius: 8, padding: "9px 0", fontSize: 13, fontWeight: 700 }}>確定 → 決定事項へ</button>
                    <button onClick={() => { set({ issues: p.issues.filter((x) => x.id !== iss.id) }); setEditing(null); }}
                      style={{ color: RED, fontSize: 12, padding: "0 10px", display: "flex", alignItems: "center", gap: 4 }}>
                      <Trash2 size={14} />削除
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {adding ? (
          <div style={{ borderTop: `1px solid ${BORDER}`, marginTop: 8, paddingTop: 10 }}>
            <IssueEditor value={draft} onChange={setDraft} />
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button onClick={() => {
                if (!draft.title.trim()) return;
                set({ issues: [...p.issues, { id: uid(), done: false, updatedAt: nowIso(), ...draft }] });
                setDraft({ type: "その他", title: "", status: "", owner: "自分", due: "", rel: "" });
                setAdding(false);
              }} style={{ flex: 1, background: TEAL, color: "#fff", borderRadius: 8, padding: "9px 0", fontSize: 13, fontWeight: 700 }}>追加する</button>
              <button onClick={() => setAdding(false)} style={{ color: SUB, fontSize: 12, padding: "0 10px" }}>やめる</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAdding(true)} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: TEAL, fontWeight: 700, marginTop: 10 }}>
            <Plus size={15} /> 論点を追加
          </button>
        )}
      </Card>

      {/* 次に確認すること */}
      <Card title="次に確認すること">
        {p.nextChecks.map((it) => (
          <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `1px solid ${LINE_C}` }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: TEAL, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 13 }}>{it.text}</span>
            <button onClick={() => set({ nextChecks: p.nextChecks.filter((x) => x.id !== it.id) })} style={{ color: SUB }}><X size={14} /></button>
          </div>
        ))}
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          <input style={{ ...smallStyle, flex: 1 }} value={newCheck} placeholder="確認事項を追加" onChange={(e) => setNewCheck(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && newCheck.trim()) { set({ nextChecks: [...p.nextChecks, { id: uid(), text: newCheck.trim() }] }); setNewCheck(""); } }} />
          <button onClick={() => { if (newCheck.trim()) { set({ nextChecks: [...p.nextChecks, { id: uid(), text: newCheck.trim() }] }); setNewCheck(""); } }}
            style={{ border: `1px solid ${BORDER}`, borderRadius: 8, padding: "0 14px", fontSize: 13 }}>追加</button>
        </div>
      </Card>

      {/* 決定事項 */}
      <Card title="決定事項">
        {p.decided.length === 0 && <div style={{ fontSize: 12, color: SUB }}>まだ決定事項はありません</div>}
        {p.decided.map((it) => (
          <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `1px solid ${LINE_C}` }}>
            <Check size={14} color={TEAL} strokeWidth={3} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 13, color: "#3A4753" }}>{it.text}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: TEAL_D }}>{fmt(it.date)}</span>
            <button onClick={() => set({ decided: p.decided.filter((x) => x.id !== it.id) })} style={{ color: SUB }}><X size={14} /></button>
          </div>
        ))}
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          <input style={{ ...smallStyle, flex: 1 }} value={newDecided} placeholder="決定事項を追加" onChange={(e) => setNewDecided(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && newDecided.trim()) { set({ decided: [...p.decided, { id: uid(), text: newDecided.trim(), date: todayIso() }] }); setNewDecided(""); } }} />
          <button onClick={() => { if (newDecided.trim()) { set({ decided: [...p.decided, { id: uid(), text: newDecided.trim(), date: todayIso() }] }); setNewDecided(""); } }}
            style={{ border: `1px solid ${BORDER}`, borderRadius: 8, padding: "0 14px", fontSize: 13 }}>追加</button>
        </div>
      </Card>
    </div>
  );
}

/* ======== TaskEditor（ボトムシート）======== */
export function TaskEditor({ task, onSave, onDelete, onClose }) {
  const [t, setT] = useState(task);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(20,30,40,0.45)", zIndex: 60, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, background: "#EEF2F3", borderRadius: "16px 16px 0 0", padding: 18, paddingBottom: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontWeight: 800, fontSize: 15 }}>{t._new ? "工程を追加" : "工程を編集"}</span>
          <button onClick={onClose} style={{ color: SUB }}><X size={20} /></button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
          {LANES.map((l) => (
            <button key={l.key} onClick={() => setT({ ...t, lane: l.key })}
              style={{ fontSize: 12, padding: "5px 11px", borderRadius: 99, border: `1px solid ${t.lane === l.key ? l.color : BORDER}`, background: t.lane === l.key ? l.color : "#fff", color: t.lane === l.key ? "#fff" : INK }}>{l.key}</button>
          ))}
        </div>
        <input style={{ ...inputStyle, marginBottom: 8 }} value={t.label} placeholder="工程名" onChange={(e) => setT({ ...t, label: e.target.value })} />
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1 }}><div style={{ fontSize: 11, color: SUB, marginBottom: 2 }}>開始</div><input type="date" style={inputStyle} value={t.start} onChange={(e) => setT({ ...t, start: e.target.value })} /></div>
          <div style={{ flex: 1 }}><div style={{ fontSize: 11, color: SUB, marginBottom: 2 }}>終了</div><input type="date" style={inputStyle} value={t.end}   onChange={(e) => setT({ ...t, end:   e.target.value })} /></div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => t.label.trim() && onSave(t)} style={{ flex: 1, background: TEAL, color: "#fff", borderRadius: 8, padding: "11px 0", fontSize: 14, fontWeight: 700 }}>保存</button>
          {!t._new && <button onClick={onDelete} style={{ color: RED, padding: "0 14px", display: "flex", alignItems: "center", gap: 4 }}><Trash2 size={16} />削除</button>}
        </div>
      </div>
    </div>
  );
}

/* ======== ScheduleTab ======== */
export function ScheduleTab({ p, set }) {
  const [task, setTask] = useState(null);
  const num = (v) => (v === "" ? "" : Number(v));
  return (
    <div style={{ padding: "12px 14px" }}>
      <Card title="主要マイルストーン">
        <MilestoneTimeline milestones={p.milestones} />
        <div style={{ marginTop: 12, borderTop: `1px solid ${LINE_C}`, paddingTop: 8 }}>
          {p.milestones.map((m) => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0" }}>
              <button onClick={() => set({ milestones: p.milestones.map((x) => x.id === m.id ? { ...x, done: !x.done } : x) })}
                style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, background: m.done ? TEAL : "#fff", border: `2px solid ${m.done ? TEAL : "#CDD6DB"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {m.done && <Check size={13} color="#fff" strokeWidth={3.5} />}
              </button>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{m.label}</span>
              <input type="date" value={m.date} style={{ ...smallStyle, width: 150 }} onChange={(e) => set({ milestones: p.milestones.map((x) => x.id === m.id ? { ...x, date: e.target.value } : x) })} />
            </div>
          ))}
        </div>
      </Card>
      <Card title="詳細スケジュール（工程）">
        <Gantt tasks={p.gantt} onEdit={setTask} />
        <button onClick={() => setTask({ id: uid(), lane: "工事", label: "", start: todayIso(), end: todayIso(), _new: true })}
          style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: TEAL, fontWeight: 700, marginTop: 10 }}>
          <Plus size={15} /> 工程を追加
        </button>
      </Card>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        {[["総予算", man(p.budgetTotal), "万円", PieChart, TEAL], ["希望工期", p.desiredDuration, "日", CalendarDays, BLUE], ["遅延バッファ", p.delayBuffer, "日", Clock, ORANGE]].map(([lbl, val, unit, I, col]) => (
          <div key={lbl} style={{ flex: 1, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 8, textAlign: "center" }}>
            <I size={15} color={col} style={{ margin: "0 auto" }} />
            <div style={{ fontSize: 10, color: SUB, marginTop: 3 }}>{lbl}</div>
            <div><span style={{ fontSize: 15, fontWeight: 800, color: col }}>{val || "—"}</span><span style={{ fontSize: 10, color: SUB }}>{unit}</span></div>
          </div>
        ))}
      </div>
      {task && (
        <TaskEditor task={task}
          onSave={(t) => { const { _new, ...rest } = t; set({ gantt: _new ? [...p.gantt, rest] : p.gantt.map((x) => x.id === t.id ? rest : x) }); setTask(null); }}
          onDelete={() => { set({ gantt: p.gantt.filter((x) => x.id !== task.id) }); setTask(null); }}
          onClose={() => setTask(null)} />
      )}
    </div>
  );
}

/* ======== BudgetTab ======== */
export function BudgetTab({ p, set }) {
  const num = (v) => (v === "" ? "" : Number(v));
  const moneyInput = (val, onCh) => (
    <input type="number" inputMode="numeric" value={val} placeholder="0" onChange={(e) => onCh(num(e.target.value))}
      style={{ ...smallStyle, width: 86, textAlign: "right", fontWeight: 700 }} />
  );
  const Row = ({ icon: I, color, label, children }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${LINE_C}` }}>
      <I size={18} color={color} strokeWidth={2.2} style={{ flexShrink: 0 }} />
      <span style={{ fontSize: 14, fontWeight: 600, color: INK }}>{label}</span>
      <span style={{ flex: 1, textAlign: "right", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4 }}>{children}</span>
    </div>
  );
  return (
    <div style={{ padding: "12px 14px" }}>
      <div style={{ display: "flex", gap: 6 }}>
        <StatTile icon={PieChart}    label="総予算"    value={man(p.budgetTotal)}     unit="万円" color={TEAL}   />
        <StatTile icon={FileText}    label="設計費"    value={man(p.designFee)}       unit="万円" color={PURPLE} />
        <StatTile icon={HardHat}     label="工事税抜"  value={man(p.constructionEx)}  unit="万円" color={ORANGE} />
        <StatTile icon={Receipt}     label="工事税込"  value={man(taxIncluded(p))}    unit="万円" color={ORANGE} />
        <StatTile icon={Flag}        label="残り"      value={man(remaining(p))}      unit="万円" color={remaining(p) < 0 ? RED : TEAL} />
      </div>
      <Card title="予算内訳">
        <Row icon={PencilLine} color={PURPLE} label="設計費">{moneyInput(p.designFee, (v) => set({ designFee: v }))}<span style={{ fontSize: 11, color: SUB }}>万円（税込）</span></Row>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${LINE_C}` }}>
          <HardHat size={18} color={ORANGE} strokeWidth={2.2} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>工事金額</span>
          <span style={{ flex: 1, textAlign: "right", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4 }}>
            {moneyInput(p.constructionEx, (v) => set({ constructionEx: v }))}
            <span style={{ fontSize: 11, color: SUB }}>万円（税抜）</span>
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 4, fontSize: 12, color: SUB, padding: "2px 0 8px" }}>
          → <span style={{ fontWeight: 700, color: INK }}>{man(taxIncluded(p))}</span> 万円（税込・{p.taxRate}%）
        </div>
        <Row icon={Receipt}   color={TEAL}   label="手配品">{moneyInput(p.arrangedGoods, (v) => set({ arrangedGoods: v }))}<span style={{ fontSize: 11, color: SUB }}>万円（税込）</span></Row>
        <Row icon={FileText}  color={PURPLE} label="諸経費">{moneyInput(p.miscCosts,    (v) => set({ miscCosts:    v }))}<span style={{ fontSize: 11, color: SUB }}>万円（税込）</span></Row>
        <div style={{ fontSize: 11, color: SUB, marginTop: 8 }}>※工事金額のみ税抜・税込を併記。他項目は税込表示。</div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <div style={{ flex: 1, background: "#F6F9F9", borderRadius: 10, padding: 8, textAlign: "center" }}>
            <div style={{ fontSize: 10, color: SUB }}>見込総額（税込）</div>
            <div><span style={{ fontSize: 16, fontWeight: 800, color: INK }}>{man(committed(p))}</span><span style={{ fontSize: 10, color: SUB }}>万円</span></div>
          </div>
          <div style={{ flex: 1, background: "#F6F9F9", borderRadius: 10, padding: 8, textAlign: "center" }}>
            <div style={{ fontSize: 10, color: SUB }}>残り</div>
            <div><span style={{ fontSize: 16, fontWeight: 800, color: remaining(p) < 0 ? RED : TEAL }}>{man(remaining(p))}</span><span style={{ fontSize: 10, color: SUB }}>万円</span></div>
          </div>
        </div>
      </Card>
      <Card title="重要タイミング">
        <div style={{ display: "flex", gap: 6 }}>
          {[["予算確定", Check, TEAL], ["着工", HardHat, TEAL], ["中間確認", Search, BLUE], ["引渡し", Flag, ORANGE]].map(([label, I, col]) => (
            <div key={label} style={{ flex: 1, background: "#F6F9F9", borderRadius: 10, padding: "8px 4px", textAlign: "center" }}>
              <I size={15} color={col} style={{ margin: "0 auto" }} />
              <div style={{ fontSize: 10, color: SUB, marginTop: 3, whiteSpace: "nowrap" }}>{label}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: TEAL_D }}>{fmt(getMilestone(p, label)?.date)}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ======== SettingsTab ======== */
export function SettingsTab({ p, set, archive, remove, allProjects }) {
  const exportData = () => {
    const json = JSON.stringify(allProjects, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "data.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: "12px 14px" }}>
      <Card title="案件情報">
        <div style={{ fontSize: 11, color: SUB, marginBottom: 4 }}>案件名</div>
        <input style={{ ...inputStyle, marginBottom: 12 }} value={p.name} placeholder="案件名" onChange={(e) => set({ name: e.target.value })} />
        <div style={{ fontSize: 11, color: SUB, marginBottom: 4 }}>消費税率（工事金額に適用）</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input type="number" style={{ ...inputStyle, width: 90 }} value={p.taxRate} onChange={(e) => set({ taxRate: e.target.value === "" ? "" : Number(e.target.value) })} />
          <span style={{ fontSize: 13, color: SUB }}>%</span>
        </div>
      </Card>

      <Card title="LINE通知用データ">
        <div style={{ fontSize: 12, color: SUB, marginBottom: 10, lineHeight: 1.6 }}>
          毎朝のLINE通知には、GitHubリポジトリの <code style={{ background: "#F0F3F5", padding: "1px 4px", borderRadius: 4 }}>functions/data.json</code> が使われます。<br />
          下のボタンで全案件データをエクスポートし、リポジトリにコミットしてください。
        </div>
        <button onClick={exportData}
          style={{ width: "100%", background: TEAL, color: "#fff", borderRadius: 8, padding: "10px 0", fontSize: 14, fontWeight: 700 }}>
          通知用データをエクスポート（data.json）
        </button>
      </Card>

      <Card>
        <button onClick={archive} style={{ width: "100%", textAlign: "left", fontSize: 14, color: TEAL_D, fontWeight: 700, padding: "8px 0", display: "flex", alignItems: "center", gap: 8 }}>
          <Check size={16} /> {p.archived ? "進行中に戻す" : "この案件を完了にする"}
        </button>
        <button onClick={remove} style={{ width: "100%", textAlign: "left", fontSize: 14, color: RED, padding: "8px 0", borderTop: `1px solid ${LINE_C}`, display: "flex", alignItems: "center", gap: 8 }}>
          <Trash2 size={16} /> 案件を削除
        </button>
      </Card>
    </div>
  );
}
