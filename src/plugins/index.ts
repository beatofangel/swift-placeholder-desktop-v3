/**
 * plugins/index.ts
 *
 * Automatically included in `./src/main.ts`
 */

// Plugins
import { loadFonts } from './webfontloader'
import vuetify from './vuetify'
import router from '../router'
import CommonDialogPlugin from '@/components/common/CommonDialogPlugin';
import Toast, { PluginOptions } from "vue-toastification";
import "vue-toastification/dist/index.css";
const options: PluginOptions = {
  // You can set your default options here
}

// Types
import type { App } from 'vue'


export function registerPlugins (app: App) {
  loadFonts()
  app
    .use(vuetify)
    .use(router)
    .use(Toast, options)
    .use(CommonDialogPlugin)
}
