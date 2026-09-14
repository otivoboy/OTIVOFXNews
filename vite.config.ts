import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const k1 =
    env.VITE_GEMINI_API_KEY ||
    env.GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    env.GOOGLE_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    '';

  const k2 =
    env.VITE_GEMINI_API_KEY_2 ||
    env.GEMINI_API_KEY_2 ||
    process.env.VITE_GEMINI_API_KEY_2 ||
    process.env.GEMINI_API_KEY_2 ||
    env.GOOGLE_API_KEY_2 ||
    process.env.GOOGLE_API_KEY_2 ||
    '';

  const k3 =
    env.VITE_GEMINI_API_KEY_3 ||
    env.GEMINI_API_KEY_3 ||
    process.env.VITE_GEMINI_API_KEY_3 ||
    process.env.GEMINI_API_KEY_3 ||
    env.GOOGLE_API_KEY_3 ||
    process.env.GOOGLE_API_KEY_3 ||
    '';

  const k4 =
    env.VITE_GEMINI_API_KEY_4 ||
    env.GEMINI_API_KEY_4 ||
    process.env.VITE_GEMINI_API_KEY_4 ||
    process.env.GEMINI_API_KEY_4 ||
    '';

  const k5 =
    env.VITE_GEMINI_API_KEY_5 ||
    env.GEMINI_API_KEY_5 ||
    process.env.VITE_GEMINI_API_KEY_5 ||
    process.env.GEMINI_API_KEY_5 ||
    '';

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(k1),
      'process.env.VITE_GEMINI_API_KEY': JSON.stringify(k1),
      'process.env.GEMINI_API_KEY_2': JSON.stringify(k2),
      'process.env.VITE_GEMINI_API_KEY_2': JSON.stringify(k2),
      'process.env.GEMINI_API_KEY_3': JSON.stringify(k3),
      'process.env.VITE_GEMINI_API_KEY_3': JSON.stringify(k3),
      'process.env.VITE_GEMINI_API_KEY_4': JSON.stringify(k4),
      'process.env.VITE_GEMINI_API_KEY_5': JSON.stringify(k5),
      'process.env.GOOGLE_API_KEY': JSON.stringify(k1),
      'process.env.GOOGLE_API_KEY_2': JSON.stringify(k2),
      'process.env.GOOGLE_API_KEY_3': JSON.stringify(k3),
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(k1),
      'import.meta.env.VITE_GEMINI_API_KEY_2': JSON.stringify(k2),
      'import.meta.env.VITE_GEMINI_API_KEY_3': JSON.stringify(k3),
      'import.meta.env.VITE_GEMINI_API_KEY_4': JSON.stringify(k4),
      'import.meta.env.VITE_GEMINI_API_KEY_5': JSON.stringify(k5),
      'import.meta.env.GEMINI_API_KEY': JSON.stringify(k1),
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
