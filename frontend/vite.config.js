import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:4001",
      "/assets-api": {
        target: "http://localhost:4001",
        rewrite: (p) => p.replace(/^\/assets-api/, "/assets"),
      },
    },
  },
});
