import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: tagName => {
            return tagName === 'vue-advanced-chat' || tagName === 'emoji-picker'
          }
        }
      }
    }),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  // due to built of libs with "module": "CommonJS", instead of "ESNext", we need to force pre-bundle them
  optimizeDeps: {
    include: ['@dm3-org/dm3-js-sdk', '@dm3-org/dm3-lib-crypto', 'dm3-org/dm3-lib-profile'],
  },
  build: {
    commonjsOptions: {
       // Ensure your library is included in CommonJS handling
      include: [/node_modules/, 
        /@dm3-org\/dm3-js-sdk/, 
        /@dm3-org\/dm3-lib-crypto/, 
        /dm3-org\/dm3-lib-profile/,
        /@dm3-org\/dm3-lib-storage/,
      ],
    },
  },
})
