import vuetify from "@/plugins/vuetify"
import { CommonDialog } from "./CommonDialog"
import { h, App, createApp, Plugin } from 'vue'
import type { EditMode } from "@/types"

let installed = false

const CommonDialogPlugin: Plugin = {
  install(app: App) {
    if (installed) return
    app.component('CommonDialog', CommonDialog)
    let dialogApp: App<Element>
    const container = document.createElement('div')
    const baseDialog = (data: any) => {
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
    app.config.globalProperties.$dialog = (data: any) => {
      baseDialog(data)
    }
    app.config.globalProperties.$dialog.confirm = (data: { title: string, text: string, op: EditMode, error: boolean, cancelable: boolean, closable: boolean, persistent: boolean }) => {
      data.error = true
      data.cancelable = true
      data.closable = true
      data.persistent = true
      baseDialog(data)
    }
    installed = true
  }
}

export default CommonDialogPlugin