import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    // Support older phones/browsers (transpile modern JS down to ES2017)
    target: "es2017",
  },
  server: {
    port: 3000,
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
});
