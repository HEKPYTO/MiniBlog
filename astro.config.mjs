import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({
  output: 'server',
  site: 'https://miniblog.tsunyanapat.com',
  adapter: node({
    mode: 'standalone',
  }),
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
    build: {
      rollupOptions: {
        external: ['bun:sqlite'],
      },
    },
  },
});
