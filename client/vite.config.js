import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'; // Gunakan garis miring (/), bukan titik (.)
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});