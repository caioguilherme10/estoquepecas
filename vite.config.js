// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Define a base para que os assets sejam carregados corretamente no Electron
  base: './',
  build: {
    // Define o diretório de saída para os arquivos buildados do renderer
    outDir: 'dist-renderer', // Ou o nome que preferir (ex: build/renderer)
  },
});