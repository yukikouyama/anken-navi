import { uid, todayIso, nowIso } from "./utils.js";
import { MILESTONES_DEFAULT } from "./constants.js";

export function seedProject() {
  const Y = "2026";
  const mk = (label, m, d, done) => ({ id: uid(), label, date: `${Y}-${m}-${d}`, done });
  return {
    id: uid(),
    name: "盛岡民泊改修",
    milestones: [
      mk("予算確定",  "07", "10", true),
      mk("基本設計",  "07", "12", true),
      mk("実施設計",  "07", "16", true),
      mk("見積調整",  "07", "20", true),
      mk("着工",      "07", "27", false),
      mk("中間確認",  "08", "10", false),
      mk("完了検査",  "08", "22", false),
      mk("引渡し",    "08", "25", false),
    ],
    budgetTotal: 1600, designFee: 120, constructionEx: 1300,
    taxRate: 10, arrangedGoods: 30, miscCosts: 20,
    desiredDuration: 30, delayBuffer: 5,
    issues: [
      { id: uid(), type: "予算", title: "予算調整",  status: "見積再確認中",      owner: "自分",   due: `${Y}-07-12`, rel: "予算確定", done: false, updatedAt: nowIso() },
      { id: uid(), type: "工期", title: "工期確認",  status: "消防工事日程確認",  owner: "真工務店", due: `${Y}-07-14`, rel: "着工前",  done: false, updatedAt: nowIso() },
      { id: uid(), type: "仕様", title: "仕様確認",  status: "キッチン仕様未決",  owner: "飛澤様", due: `${Y}-07-15`, rel: "発注前",  done: false, updatedAt: nowIso() },
      { id: uid(), type: "業者", title: "業者回答",  status: "工務店返答待ち",    owner: "真工務店", due: `${Y}-07-13`, rel: "契約前",  done: false, updatedAt: nowIso() },
    ],
    gantt: [
      { id: uid(), lane: "設計",       label: "基本設計",  start: `${Y}-07-07`, end: `${Y}-07-15` },
      { id: uid(), lane: "設計",       label: "実施設計",  start: `${Y}-07-15`, end: `${Y}-07-22` },
      { id: uid(), lane: "見積・契約", label: "仕様確定",  start: `${Y}-07-07`, end: `${Y}-07-12` },
      { id: uid(), lane: "見積・契約", label: "予算確定",  start: `${Y}-07-10`, end: `${Y}-07-14` },
      { id: uid(), lane: "見積・契約", label: "見積取得",  start: `${Y}-07-14`, end: `${Y}-07-20` },
      { id: uid(), lane: "見積・契約", label: "金額調整",  start: `${Y}-07-20`, end: `${Y}-07-26` },
      { id: uid(), lane: "見積・契約", label: "契約",      start: `${Y}-07-22`, end: `${Y}-07-27` },
      { id: uid(), lane: "工事",       label: "着工準備",  start: `${Y}-07-22`, end: `${Y}-07-27` },
      { id: uid(), lane: "工事",       label: "着工",      start: `${Y}-07-27`, end: `${Y}-08-03` },
      { id: uid(), lane: "工事",       label: "中間確認",  start: `${Y}-08-08`, end: `${Y}-08-12` },
      { id: uid(), lane: "工事",       label: "仕上げ",    start: `${Y}-08-13`, end: `${Y}-08-22` },
      { id: uid(), lane: "検査・引渡し", label: "完了検査", start: `${Y}-08-20`, end: `${Y}-08-24` },
      { id: uid(), lane: "検査・引渡し", label: "是正",    start: `${Y}-08-23`, end: `${Y}-08-26` },
      { id: uid(), lane: "検査・引渡し", label: "引渡し",  start: `${Y}-08-25`, end: `${Y}-08-27` },
    ],
    decided: [],
    nextChecks: [
      { id: uid(), text: "消防検査日程" },
      { id: uid(), text: "キッチン仕様確定" },
      { id: uid(), text: "追加見積の反映" },
    ],
    archived: false,
  };
}

export function blankProject() {
  return {
    id: uid(),
    name: "",
    milestones: MILESTONES_DEFAULT.map((label) => ({ id: uid(), label, date: "", done: false })),
    budgetTotal: "", designFee: "", constructionEx: "",
    taxRate: 10, arrangedGoods: "", miscCosts: "",
    desiredDuration: "", delayBuffer: "",
    issues: [], gantt: [], decided: [], nextChecks: [],
    archived: false,
  };
}
