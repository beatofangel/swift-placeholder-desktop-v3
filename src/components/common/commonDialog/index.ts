import vuetify from "@/plugins/vuetify"
import { CommonDialog } from "./CommonDialog"
import { h, App, ref, onUnmounted, createApp, watch } from 'vue'

let installed = false

export default {
  install(app: App) {
    if (installed) return
    app.component('CommonDialog', CommonDialog)
    app.config.globalProperties.$dialog = (data: any) => {
      const show = ref(true)
      watch(show, (val) => {
        console.log('show', val)
        // !val && dialogApp.unmount()
      })
      data.modelValue = show.value
      data['onUpdate:modelValue'] = (val: boolean) => {
        show.value = val
      }
      const container = document.querySelector('.common-dialog-container') || document.createElement('div')
      container.classList.contains('common-dialog-container') || container.classList.add('common-dialog-container')
      const dialog = h(CommonDialog, data)
      const dialogApp = createApp(dialog)
      dialogApp.use(vuetify)
      dialogApp.mount(container)
      // onUnmounted: ()=>{
      //   console.log('unmounted')
      //   // document.querySelector('#app')?.removeChild(container)
      // }
    }
    installed = true
  }
}