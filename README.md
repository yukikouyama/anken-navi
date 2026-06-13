# 案件ナビ

設計・リフォーム業務向けの案件管理アプリ。  
論点・予算・スケジュールを1画面で管理し、毎朝LINEに状況サマリーを送信します。

---

## セットアップ手順

### 1. リポジトリを作成してpush

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/<yourname>/anken-navi.git
git push -u origin main
```

### 2. GitHub Pages を有効化

GitHub リポジトリ → Settings → Pages  
Source: **Deploy from a branch** → Branch: **gh-pages** / root  
→ 保存すると `deploy.yml` が自動実行され、数分後に公開されます。

公開URL: `https://<yourname>.github.io/anken-navi/`

### 3. LINE Messaging API のチャネルを作成

1. [LINE Developers](https://developers.line.biz/) にログイン
2. 新規プロバイダー作成（個人名でOK）
3. **Messaging API** チャネルを作成（業種は何でもOK）
4. チャネルを作成したら、スマホでそのBotを**友だち追加**する
5. `Messaging API設定` タブ → **チャネルアクセストークン（長期）** を発行してコピー
6. `チャネル基本設定` タブ → 最下部の **あなたのユーザーID**（`Uxxxxxxxxx`）をコピー

### 4. GitHub Secrets に登録

GitHub リポジトリ → Settings → Secrets and variables → Actions → New repository secret

| Name | 値 |
|------|-----|
| `GEMINI_API_KEY` | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) で取得 |
| `LINE_CHANNEL_ACCESS_TOKEN` | 手順3でコピーしたトークン |
| `LINE_USER_ID` | 手順3でコピーしたユーザーID（`Uxxxxxxxxx`） |

### 5. LINE通知のデータ同期

1. ブラウザでアプリを開く
2. 案件を開く → 設定タブ → **「通知用データをエクスポート」**
3. ダウンロードされた `data.json` を `functions/data.json` に配置
4. コミット & push → 翌朝8時から通知が届く

```bash
cp ~/Downloads/data.json functions/data.json
git add functions/data.json
git commit -m "update notification data"
git push
```

### 6. 手動で通知テスト

GitHub → Actions → **Morning LINE Notification** → Run workflow

---

## ローカル開発

```bash
npm install
npm run dev
```

---

## データについて

- アプリのデータは**ブラウザの localStorage** に保存されます
- `functions/data.json` は LINE通知専用で、手動エクスポートで更新します
- `functions/data.json` は `.gitignore` に含まれています（公開リポジトリでも安全）
- Gemini APIキーはブラウザの localStorage にのみ保存され、GitHubには含まれません
