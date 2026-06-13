import {
  STALL_DAYS, DUE_SOON_DAYS, ALERT_KINDS, RED, ORANGE, SUB, TYPE_KEYS,
} from "./constants.js";

// ---- 日付 ----
export const fmt = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  return isNaN(d) ? "—" : `${d.getMonth() + 1}/${d.getDate()}`;
};
export const todayIso = () => new Date().toISOString().slice(0, 10);
export const nowIso   = () => new Date().toISOString();
export const isPast   = (iso) => iso && new Date(iso + "T23:59:59") <= new Date();
export const daysTo   = (iso) =>
  iso ? Math.ceil((new Date(iso + "T00:00:00") - new Date()) / 86400000) : null;
export const dayNum   = (iso) =>
  Math.floor(new Date(iso + "T00:00:00").getTime() / 86400000);
export const daysSince = (iso) =>
  iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 86400000) : null;

// ---- 表示 ----
export const man = (v) =>
  v === "" || v == null || isNaN(Number(v)) ? "—" : Number(v).toLocaleString();

// ---- 金額計算 ----
export const taxIncluded = (p) =>
  Math.round((Number(p.constructionEx) || 0) * (1 + (Number(p.taxRate) || 10) / 100));
export const committed = (p) =>
  (Number(p.designFee) || 0) +
  taxIncluded(p) +
  (Number(p.arrangedGoods) || 0) +
  (Number(p.miscCosts) || 0);
export const remaining = (p) => (Number(p.budgetTotal) || 0) - committed(p);

// ---- 論点集計 ----
export const openIssues   = (p) => p.issues.filter((i) => !i.done);
export const waitingCount = (p) => openIssues(p).filter((i) => i.owner && i.owner !== "自分").length;
export const dueSoonCount = (p) =>
  openIssues(p).filter((i) => { const d = daysTo(i.due); return d !== null && d <= DUE_SOON_DAYS; }).length;

// ---- マイルストーン ----
export const getMilestone    = (p, label) => p.milestones.find((m) => m.label === label);
export const currentMsIndex  = (p) => {
  const i = p.milestones.findIndex((m) => !m.done);
  return i === -1 ? p.milestones.length - 1 : i;
};

// ---- UID ----
export const uid = () => Math.random().toString(36).slice(2, 10);

// ---- データマイグレーション（updatedAt 補完）----
export const migrate = (projects) =>
  projects.map((p) => ({
    ...p,
    issues: p.issues.map((i) => (i.updatedAt ? i : { ...i, updatedAt: nowIso() })),
  }));

// ---- アラート集計 ----
export function computeAlerts(projects) {
  const out = [];
  projects.filter((p) => !p.archived).forEach((p) => {
    openIssues(p).forEach((iss) => {
      const d     = daysTo(iss.due);
      const stale = daysSince(iss.updatedAt);
      let kind = null, note = "";
      if (iss.owner === "自分") {
        kind = "self";
        note = d !== null && d < 0 ? `期限${-d}日超過` : d !== null ? `あと${d}日` : "対応待ち";
      } else if (d !== null && d < 0) {
        kind = "overdue"; note = `${-d}日超過`;
      } else if (d !== null && d <= DUE_SOON_DAYS) {
        kind = "due"; note = `あと${d}日`;
      } else if (stale !== null && stale >= STALL_DAYS) {
        kind = "stall"; note = `${stale}日動きなし`;
      }
      if (kind) out.push({ id: iss.id, kind, note, project: p, iss });
    });
  });
  return out.sort((a, b) => {
    const r = ALERT_KINDS[a.kind].rank - ALERT_KINDS[b.kind].rank;
    if (r !== 0) return r;
    const da = daysTo(a.iss.due), db = daysTo(b.iss.due);
    return (da == null ? 9999 : da) - (db == null ? 9999 : db);
  });
}
