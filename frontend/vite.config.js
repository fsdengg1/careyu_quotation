import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    allowedHosts: ['.ngrok-free.dev', '.ngrok-free.app', '.ngrok.io'],
    proxy: {
      "/api": "http://localhost:4001",
      "/assets-api": {
        target: "http://localhost:4001",
        rewrite: (p) => p.replace(/^\/assets-api/, "/assets"),
      },
    },
  },
});
