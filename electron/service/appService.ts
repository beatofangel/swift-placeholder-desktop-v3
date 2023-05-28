// import { BrowserWindow, app, dialog } from 'electron'
import { build } from '../../package.json'

export function appName() {
  console.log('appName', build.productName)
  return build.productName
}

// export function appVersion() {
//   return app.getVersion()
// }

// export async function directoryPicker(title: string, directory: string) {
//   const result = await dialog.showOpenDialog(BrowserWindow.getFocusedWindow() as Electron.BrowserWindow, {
//     title: `选择${title}`,
//     defaultPath: directory || app.getPath("documents"),
//     properties: [
//       'openDirectory'
//     ]
//   })

//   return result.canceled ? '' : result.filePaths[0]
// }

// export function maximize() {
//   const win = BrowserWindow.getFocusedWindow() as Electron.BrowserWindow
//   const maximized = win.isMaximized()
//   maximized ? win.unmaximize() : win.maximize()
//   return !maximized
// }

// export function minimize() {
//   const win = BrowserWindow.getFocusedWindow() as Electron.BrowserWindow
//   win.minimize()
// }

// export function close() {
//   const win = BrowserWindow.getFocusedWindow() as Electron.BrowserWindow
//   win.close()
// }
