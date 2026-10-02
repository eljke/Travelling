import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { destinations, images } from './src/content/registry'

const covers = Object.fromEntries(
  Object.values(destinations).map((bundle) => [
    bundle.destination.id,
    images[bundle.destination.heroImageId],
  ]),
)

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'preload-destination-cover',
      transformIndexHtml() {
        return [
          {
            tag: 'script',
            injectTo: 'head',
            children: `
        const covers = ${JSON.stringify(Object.fromEntries(Object.entries(covers).map(([id, image]) => [id, { src: image.src, small: image.small }])))};
        const route = location.hash.slice(1).split('?')[0].split('/').filter(Boolean);
        const cover = covers[route[0] || ${JSON.stringify(Object.keys(covers)[0])}];
        if (route.length <= 1 && cover) {
          const preload = document.createElement('link');
          preload.rel = 'preload'; preload.as = 'image'; preload.href = './' + cover.src;
          preload.imageSrcset = './' + cover.small + ' 640w, ./' + cover.src + ' 1280w';
          preload.imageSizes = '100vw'; preload.fetchPriority = 'high'; document.head.append(preload);
        }
      `,
          },
        ]
      },
    },
  ],
  base: './',
  build: { target: 'es2022' },
  server: { host: '127.0.0.1' },
})
