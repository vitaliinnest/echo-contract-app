import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/storage-smart-contract-app/",
  alias: {
    events: "rollup-plugin-node-polyfills/polyfills/events",
    path: "rollup-plugin-node-polyfills/polyfills/path",
  },
});
