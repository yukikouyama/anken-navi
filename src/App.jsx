import React, { useState, useEffect, useRef } from "react";
import {
  TEAL, TEAL_D, INK, SUB, BG, CARD, BORDER, LINE_C, BLUE, ORANGE, RED,
  STORE_KEY,
} from "./constants.js";
import { uid, man, fmt, todayIso, nowIso, migrate, computeAlerts, openIssues, remaining, waitingCount, currentMsIndex } from "./utils.js";
import { seedProject, blankProject } from "./data.js";
import { Header, StatTile, Card, MilestoneTimeline } from "./components/ui.jsx";
import {
  DashboardTab, IssuesTab, ScheduleTab, BudgetTab, SettingsTab,
} from "./components/tabs.jsx";
import AiModal     from "./components/AiModal.jsx";
import AlertPanel  from "./components/AlertPanel.jsx";
import {
  Home, Scale, CalendarDays, PieChart, Settings, Bell,
  Menu, Plus, ChevronLeft, ChevronRight, Sparkles,
  MessageCircle, Clock, JapaneseYen,
} from "lucide-react";

/* ---- タブ定義 ---- */
const TABS = [
  { key: "dash",     label: "ダッシュボード", icon: Home        },
  { key: "issues",   label: "論点",          icon: Scale       },
  { key: "schedule", label: "スケジュール",   icon: CalendarDays },
  { key: "budget",   label: "予算",          icon: PieChart    },
  { key: "settings", label: "設定",          icon: Settings    },
];

/* ============================================================
   ProjectView
   ============================================================ */
function ProjectView({ p, set, archive, remove, onBack, onAi, onBell, alertCount, initialTab, allProjects }) {
  const [tab, setTab] = useState(initialTab || "dash");

  // initialTab が変わったときに追従
  useEffect(() => { if (initialTab) setTab(initialTab); }, [initialTab]);

  return (
    <div>
      <Header
        title={p.name || "（名称未設定）"}
        left={<button onClick={onBack} style={{ color: INK }}><ChevronLeft size={24} /></button>}
        right={<>
          <button onClick={onAi} style={{ color: TEAL }}><Sparkles size={20} /></button>
          <button onClick={onBell} style={{ color: INK, position: "relative" }}>
            <Bell size={20} />
            {alertCount > 0 && (
              <span style={{ position: "absolute", top: -5, right: -6, minWidth: 15, height: 15, padding: "0 3px", background: RED, color: "#fff", borderRadius: 8, fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {alertCount > 99 ? "99+" : alertCount}
              </span>
            )}
          </button>
        </>}
      />
      <div style={{ maxWidth: 480, margin: "0 auto", paddingBottom: 76 }}>
        {tab === "dash"     && <DashboardTab p={p} go={setTab} />}
        {tab === "issues"   && <IssuesTab    p={p} set={set}  />}
        {tab === "schedule" && <ScheduleTab  p={p} set={set}  />}
        {tab === "budget"   && <BudgetTab    p={p} set={set}  />}
        {tab === "settings" && <SettingsTab  p={p} set={set} archive={archive} remove={remove} allProjects={allProjects} />}
      </div>
      {/* 下タブ */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: CARD, borderTop: `1px solid ${BORDER}`, zIndex: 30 }}>
        <div style={{ maxWidth: 480, margin: "0 auto", display: "flex", padding: "6px 0 8px" }}>
          {TABS.map((t) => {
            const on = tab === t.key;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, color: on ? TEAL : SUB }}>
                <t.icon size={21} strokeWidth={on ? 2.4 : 2} />
                <span style={{ fontSize: 9.5, fontWeight: on ? 700 : 500 }}>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   ProjectList
   ============================================================ */
function ProjectList({ projects, onOpen, onNew, onAi, onBell, alerts }) {
  const active   = projects.filter((p) => !p.archived);
  const done     = projects.filter((p) =>  p.archived);
  const [showDone, setShowDone] = useState(false);
  const urgent   = alerts.filter((a) => a.kind === "self" || a.kind === "overdue");

  const Mini = ({ p }) => {
    const cur = p.milestones[currentMsIndex(p)];
    return (
      <button onClick={() => onOpen(p.id)}
        style={{ width: "100%", background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 14, marginBottom: 12, textAlign: "left", boxShadow: "0 1px 3px rgba(20,40,40,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 30, height: 30, borderRadius: 9, background: "#E3F0EE", color: TEAL, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Home size={16} />
          </span>
          <span style={{ flex: 1, fontWeight: 800, fontSize: 16, color: INK }}>{p.name || "（名称未設定）"}</span>
          <ChevronRight size={18} color={SUB} />
        </div>
        <div style={{ display: "flex", gap: 14, marginTop: 10, fontSize: 12, color: SUB }}>
          <span><MessageCircle size={12} style={{ verticalAlign: "-1px" }} /> 論点 <b style={{ color: INK }}>{openIssues(p).length}</b></span>
          <span><Clock size={12} style={{ verticalAlign: "-1px" }} /> 待ち <b style={{ color: ORANGE }}>{waitingCount(p)}</b></span>
          <span><JapaneseYen size={12} style={{ verticalAlign: "-1px" }} /> 差額 <b style={{ color: remaining(p) < 0 ? RED : TEAL }}>{man(remaining(p))}</b></span>
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: TEAL_D }}>
          現在地：<b>{cur?.label || "—"}</b>
          {cur?.date && <span style={{ color: SUB }}>（{fmt(cur.date)}）</span>}
        </div>
      </button>
    );
  };

  return (
    <div>
      <Header
        title="案件ナビ"
        left={<button style={{ color: INK }}><Menu size={22} /></button>}
        right={<>
          <button onClick={onBell} style={{ color: INK, position: "relative" }}>
            <Bell size={20} />
            {alerts.length > 0 && (
              <span style={{ position: "absolute", top: -5, right: -6, minWidth: 15, height: 15, padding: "0 3px", background: RED, color: "#fff", borderRadius: 8, fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {alerts.length > 99 ? "99+" : alerts.length}
              </span>
            )}
          </button>
          <button onClick={onAi}  style={{ color: TEAL }}><Sparkles size={20} /></button>
          <button onClick={onNew} style={{ color: TEAL }}><Plus size={22} /></button>
        </>}
      />
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "14px 14px 40px" }}>
        {/* 緊急バナー */}
        {urgent.length > 0 && (
          <button onClick={onBell}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, background: "#FDECEA", border: `1px solid #F3C9C4`, borderRadius: 12, padding: "10px 12px", marginBottom: 12, textAlign: "left" }}>
            <Bell size={16} color={RED} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 13, color: "#9A2C24", fontWeight: 700 }}>自分待ち・期限超過が {urgent.length} 件あります</span>
            <ChevronRight size={15} color={RED} />
          </button>
        )}

        {projects.length === 0 && (
          <div style={{ textAlign: "center", marginTop: 50, color: SUB }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: INK }}>案件がありません</div>
            <p style={{ fontSize: 13, marginTop: 8, lineHeight: 1.8 }}>右上の ＋ で案件を作成するか、<br />✦ で現場メモから整理できます。</p>
          </div>
        )}
        {active.map((p) => <Mini key={p.id} p={p} />)}
        {done.length > 0 && (
          <div style={{ marginTop: 6 }}>
            <button onClick={() => setShowDone(!showDone)} style={{ fontSize: 12, color: SUB }}>
              {showDone ? "▾" : "▸"} 完了した案件（{done.length}）
            </button>
            {showDone && done.map((p) => <Mini key={p.id} p={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   App（ルート）
   ============================================================ */
export default function App() {
  const [projects,    setProjects]    = useState([]);
  const [loaded,      setLoaded]      = useState(false);
  const [openId,      setOpenId]      = useState(null);
  const [showAi,      setShowAi]      = useState(false);
  const [showAlerts,  setShowAlerts]  = useState(false);
  const [entryTab,    setEntryTab]    = useState("dash");
  const saveTimer = useRef(null);

  // 初回読み込み
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      setProjects(raw ? migrate(JSON.parse(raw)) : migrate([seedProject()]));
    } catch {
      setProjects(migrate([seedProject()]));
    }
    setLoaded(true);
  }, []);

  // 自動保存（600ms debounce）
  useEffect(() => {
    if (!loaded) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try { localStorage.setItem(STORE_KEY, JSON.stringify(projects)); } catch (e) { console.error(e); }
    }, 600);
    return () => clearTimeout(saveTimer.current);
  }, [projects, loaded]);

  const update       = (np)  => setProjects((prev) => prev.map((x) => x.id === np.id ? np : x));
  const removeProject = (id) => setProjects((prev) => prev.filter((x) => x.id !== id));

  const addNew = () => {
    const np = blankProject();
    setProjects((prev) => [np, ...prev]);
    setEntryTab("dash");
    setOpenId(np.id);
  };

  const openProject = (id) => { setEntryTab("dash");   setOpenId(id); };
  const jumpToIssues = (id) => { setEntryTab("issues"); setOpenId(id); setShowAlerts(false); };

  const applyAi = ({ name, issues, decided, nextChecks }, target) => {
    if (target === "new") {
      const np = { ...blankProject(), name, issues, decided, nextChecks };
      setProjects((prev) => [np, ...prev]);
      setEntryTab("issues");
      setOpenId(np.id);
    } else {
      setProjects((prev) => prev.map((p) => p.id !== target ? p : {
        ...p,
        issues:     [...p.issues,     ...issues],
        decided:    [...p.decided,    ...decided],
        nextChecks: [...p.nextChecks, ...nextChecks],
      }));
    }
    setShowAi(false);
  };

  const open   = projects.find((p) => p.id === openId);
  const alerts = computeAlerts(projects);

  return (
    <div style={{ minHeight: "100vh", background: BG, color: INK, fontFamily: "'Hiragino Kaku Gothic ProN','Yu Gothic','Noto Sans JP',sans-serif" }}>
      {!loaded ? (
        <div style={{ padding: 40, color: SUB, textAlign: "center" }}>読み込み中…</div>
      ) : open ? (
        <ProjectView
          key={open.id}
          p={open}
          set={(patch) => update({ ...open, ...patch })}
          archive={() => { update({ ...open, archived: !open.archived }); setOpenId(null); }}
          remove={() => { if (confirm("この案件を削除しますか？")) { removeProject(open.id); setOpenId(null); } }}
          onBack={() => setOpenId(null)}
          onAi={() => setShowAi(true)}
          onBell={() => setShowAlerts(true)}
          alertCount={alerts.filter((a) => a.project.id === open.id).length}
          initialTab={entryTab}
          allProjects={projects}
        />
      ) : (
        <ProjectList
          projects={projects}
          onOpen={openProject}
          onNew={addNew}
          onAi={() => setShowAi(true)}
          onBell={() => setShowAlerts(true)}
          alerts={alerts}
        />
      )}
      {showAi     && <AiModal    projects={projects} onApply={applyAi}      onClose={() => setShowAi(false)}     />}
      {showAlerts && <AlertPanel alerts={alerts}     onJump={jumpToIssues}  onClose={() => setShowAlerts(false)} />}
    </div>
  );
}
