import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    base: '/Mucuww/',
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'icon.svg',
          'apple-touch-icon.png',
          'pwa-192x192.png',
          'pwa-512x512.png',
          'pwa-maskable-512x512.png',
        ],
        manifest: {
          id: '/Mucuww/',
          name: 'Mucuw — Catat Keuangan & Budgeting',
          short_name: 'Mucuw',
          description:
            'Aplikasi pencatat keuangan pribadi, scan struk AI, budgeting anti-bocor, dan pengingat rutin.',
          theme_color: '#F3ECFF',
          background_color: '#F3ECFF',
          display: 'standalone',
          orientation: 'portrait-primary',
          start_url: '/Mucuww/',
          scope: '/Mucuww/',
          categories: ['finance', 'productivity'],
          shortcuts: [
            {
              name: 'Catat Pengeluaran',
              short_name: 'Catat',
              url: '/Mucuww/?action=expense',
              icons: [{src: '/Mucuww/pwa-192x192.png', sizes: '192x192', type: 'image/png'}],
            },
            {
              name: 'Scan Struk AI',
              short_name: 'Scan',
              url: '/Mucuww/?tab=scanner',
              icons: [{src: '/Mucuww/pwa-192x192.png', sizes: '192x192', type: 'image/png'}],
            },
          ],
          icons: [
            {
              src: '/Mucuww/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/Mucuww/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/Mucuww/pwa-maskable-512x512.png',
