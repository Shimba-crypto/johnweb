import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";

// Writes dist/version.json with the build timestamp so installed PWAs can detect
// that a new version was deployed and prompt the user to reload.
function buildStamp(): Plugin {
  return {
    name: "build-stamp",
    apply: "build",
    writeBundle() {
      const out = path.resolve(__dirname, "dist", "version.json");
      fs.writeFileSync(out, JSON.stringify({ version: new Date().toISOString() }));
    },
  };
}

export default defineConfig({
  plugins: [react(), buildStamp()],
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
