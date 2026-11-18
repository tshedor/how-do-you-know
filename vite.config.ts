import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

const BASE_PATH = process.env.BASE_PATH
  ? (`/${process.env.BASE_PATH.replace(/^\/+/, '')}` as `/${string}`)
  : '';

export default defineConfig({
  plugins: [
    sveltekit({
      adapter: adapter({
        fallback: 'index.html'
      }),
      paths: {
        base: BASE_PATH
      }
    })
  ]
});
