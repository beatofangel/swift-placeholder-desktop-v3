import vuetify from "@/plugins/vuetify"
import { CommonDialog } from "./CommonDialog"
import { h, App, createApp, Plugin } from 'vue'

let installed = false

const CommonDialogPlugin: Plugin = {
  install(app: App) {
    if (installed) return
    app.component('CommonDialog', CommonDialog)
    let dialogApp: App<Element>
    const container = document.createElement('div')
    app.config.globalProperties.$dialog = (data: any) => {
      console.log(container)
      const customOnClosed = data.onClosed || (() => { })
      data['onClosed'] = async () => {
        await customOnClosed()
        dialogApp && dialogApp.unmount()
      }
      const dialog = h(CommonDialog, data)
      dialogApp = createApp(dialog)
      dialogApp.use(vuetify)
      dialogApp.mount(container)
    }
    installed = true
  }
}

export default CommonDialogPlugin