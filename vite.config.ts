// vite.config.ts
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  return {
    base: '/',
    plugins: [react()],
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@api': path.resolve(__dirname, './src/api'),
        '@components': path.resolve(__dirname, './src/components'),
        '@features': path.resolve(__dirname, './src/features'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@pages': path.resolve(__dirname, './src/pages'),
        '@theme': path.resolve(__dirname, './src/theme'),
        '@types': path.resolve(__dirname, './src/types'),
        '@utils': path.resolve(__dirname, './src/utils'),
      },
    },
    build: {
      outDir: 'dist',
      target: 'esnext',
      cssCodeSplit: true,
      treeshake: true,
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          // Keep tightly-coupled libs together to avoid init-order errors
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'mui-vendor': ['@mui/joy', '@mui/material', '@emotion/react', '@emotion/styled'],
            'i18n-vendor': ['i18next', 'react-i18next'],
            'net-vendor': ['axios'],
          },
        },
      },
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@mui/joy',
        '@mui/material',
        '@emotion/react',
        '@emotion/styled',
        'i18next',
        'react-i18next',
        'axios',
      ],
    },
    server: {
      port: 5173,
      open: true,
      historyApiFallback: true,
    },
  };
});
