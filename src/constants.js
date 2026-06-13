// ---- 色 ----
export const TEAL   = "#0F857A";
export const TEAL_D = "#0B5F57";
export const INK    = "#1B2A36";
export const SUB    = "#7C8A99";
export const BG     = "#EEF2F3";
export const CARD   = "#FFFFFF";
export const BORDER = "#E3E8EC";
export const LINE_C = "#F0F3F5";
export const BLUE   = "#2C7BE5";
export const ORANGE = "#E8842A";
export const PURPLE = "#7C4DBE";
export const RED    = "#D9483B";

// ---- 案件フェーズ ----
export const MILESTONES_DEFAULT = [
  "予算確定", "基本設計", "実施設計", "見積調整",
  "着工", "中間確認", "完了検査", "引渡し",
];

// ---- 論点種別 ----
export const TYPE_KEYS = ["予算", "工期", "仕様", "業者", "その他"];

// ---- 工程レーン ----
export const LANES = [
  { key: "設計",       color: TEAL   },
  { key: "見積・契約", color: BLUE   },
  { key: "工事",       color: ORANGE },
  { key: "検査・引渡し", color: PURPLE },
];

// ---- 担当チップ ----
export const OWNER_CHIPS = ["自分", "お客様", "工務店", "業者", "メーカー", "行政"];

// ---- アラート設定 ----
export const STALL_DAYS    = 5;   // 他者待ちで停滞とみなす日数
export const DUE_SOON_DAYS = 7;   // 期限間近とみなす日数

export const ALERT_KINDS = {
  self:    { label: "自分が止めている", color: RED,    rank: 0 },
  overdue: { label: "期限を過ぎている", color: RED,    rank: 1 },
  due:     { label: "期限が近い",       color: ORANGE, rank: 2 },
  stall:   { label: "停滞している",     color: SUB,    rank: 3 },
};

// ---- Gemini ----
export const GEMINI_MODELS    = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];
export const STORE_KEY        = "anken-navi-v3";
export const GEMINI_KEY_STORE = "anken-navi-gemini-key";
export const GEMINI_MODEL_STORE = "anken-navi-gemini-model";
