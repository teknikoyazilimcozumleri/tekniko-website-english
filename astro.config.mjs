import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  site: "https://teknikosoftwaresolutions.com",
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'tr'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  redirects: {
    '/en': '/',
    '/blog/en': '/blog',
    '/blog/posts/en/strategy': '/blog/posts/strategy',
    '/blog/posts/strateji': '/blog/posts/tr/strateji',
  },
  vite: {
    plugins: [tailwindcss()]
  }
});
