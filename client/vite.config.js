import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Lets `npm run dev` be reached from another machine on the shop floor
    // network if needed; harmless for local-only use.
    host: true,
  },
});
