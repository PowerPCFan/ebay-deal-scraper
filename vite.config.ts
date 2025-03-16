// config v1

// import { sveltekit } from '@sveltejs/kit/vite';
// import { defineConfig } from 'vite';

// export default defineConfig({
// 	plugins: [sveltekit()]
// });



// config v2
// import { sveltekit } from '@sveltejs/kit/vite';
// import { defineConfig, loadEnv } from 'vite';

// export default defineConfig(({ mode }) => {
//   const env = loadEnv(mode, process.cwd(), '');
//   return {
//     plugins: [sveltekit()],
//     define: {
//       'process.env.EBAY_APP_ID': JSON.stringify(env.EBAY_APP_ID),
//       'process.env.EBAY_CERT_ID': JSON.stringify(env.EBAY_CERT_ID)
//     }
//   };
// });



// config v3
// import { sveltekit } from '@sveltejs/kit/vite';
// import { defineConfig, loadEnv } from 'vite';
// import { fileURLToPath, URL } from 'url';
// import * as path from 'path';

// export default defineConfig(({ mode }) => {
//   const env = loadEnv(mode, process.cwd(), '');
//   return {
//     plugins: [sveltekit()],
//     define: {
//       'process.env.EBAY_APP_ID': JSON.stringify(env.EBAY_APP_ID),
//       'process.env.EBAY_CERT_ID': JSON.stringify(env.EBAY_CERT_ID)
//     },
//     resolve: {
//       alias: {
//         '@': path.resolve('./src')
//       }
//     }
//   };
// });



// config v4
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [sveltekit()],
  resolve: {
    alias: {
      $lib: resolve(__dirname, './src/lib'),
      $routes: resolve(__dirname, './src/routes')
    }
  },
  envPrefix: ['VITE_', 'EBAY_']
});