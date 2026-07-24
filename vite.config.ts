import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Listen on the LAN so the dev server is reachable from an iPad/phone
    // on the same network (http://<computer-ip>:5173).
    host: true,
    proxy: {
      // Proxy API calls to the Express backend so the browser avoids CORS.
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
});
