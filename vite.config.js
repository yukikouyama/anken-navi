import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// リポジトリ名に合わせて base を変更する
// 例: https://yourname.github.io/anken-navi/ の場合 → "/anken-navi/"
export default defineConfig({
  plugins: [react()],
  base: "/anken-navi/",
});
