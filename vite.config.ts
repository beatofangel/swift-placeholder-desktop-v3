// Plugins
import vue from '@vitejs/plugin-vue'
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
import electron from "vite-plugin-electron"
import vueJsx from "@vitejs/plugin-vue-jsx";

// Utilities
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    vue({ 
      template: { transformAssetUrls }
    }),
    vueJsx({}),
    // https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vite-plugin
    vuetify({
      autoImport: true,
      styles: {
        configFile: 'src/styles/settings.scss',
      },
    }),
    electron([
      {
        entry: 'electron/background.ts',
        vite: {
          build: {
            rollupOptions: {
              external: ['@vscode/sqlite3', 'sequelize']
            }
          }
        }
      },
      {
        entry: 'electron/preload.ts',
        vite: {
          build: {
            rollupOptions: {
              external: ['@vscode/sqlite3', 'sequelize']
            }
          }
        }
      }
    ]),
  ],
  // optimizeDeps: {
  //   include: [

  //   ]
  // },
  define: { 'process.env': {} },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
    extensions: [
      '.js',
      '.json',
      '.jsx',
      '.mjs',
      '.ts',
      '.tsx',
      '.vue',
    ],
  },
  server: {
    port: 3000,
  },
})
