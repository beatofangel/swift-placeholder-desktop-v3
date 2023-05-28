import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import path from 'path'
import log from 'electron-log'
import { sequelize } from './database/sequelize'
import Store from 'electron-store'
Store.initRenderer() // https://github.com/sindresorhus/electron-better-ipc/issues/43#issuecomment-1243739674

app.disableHardwareAcceleration()
log.debug('当前模式：', import.meta.env.MODE)
const isDevelopment = import.meta.env.DEV

function createWindow () {
  // 创建浏览器窗口
  const mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    frame: false,
    transparent: true,
    webPreferences: {
      preload: path.join(__dirname, '../dist-electron/preload.js'),
      nodeIntegration: true,
      // contextIsolation: false,
    }
  })

  // 加载 index.html
  mainWindow.loadURL(
    isDevelopment
      ? 'http://localhost:3000'
      :`file://${path.join(__dirname, '../dist/index.html')}`
  )

  // 打开开发工具
  if (isDevelopment) {
    mainWindow.webContents.openDevTools({ mode: 'right'/*'undocked'*/ })
  }
}

// 这段程序将会在 Electron 结束初始化
// 和创建浏览器窗口的时候调用
// 部分 API 在 ready 事件触发后才能使用。
app.whenReady().then(async () => {
  if (isDevelopment) {
    // Install Vue Devtools
    try {
      /****************** 加载本地vue-devTools **************/
      const { session } = require("electron");
      session.defaultSession.loadExtension(
        path.resolve(__dirname, "../../vue-devtools/packages/shell-chrome")
      ); 
      /*****************************************************/
    } catch (e: any) {
      log.error('Vue Devtools failed to install:', e.toString())
    }
  }

  await sequelize.sync({
    alter: process.env.NODE_ENV === 'development' && {
      drop: false
    }
  })
  log.info('数据库初始化成功')
  createWindow()

  app.on('activate', function () {
    // 通常在 macOS 上，当点击 dock 中的应用程序图标时，如果没有其他
    // 打开的窗口，那么程序会重新创建一个窗口。
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// 除了 macOS 外，当所有窗口都被关闭的时候退出程序。 因此，通常对程序和它们在
// 任务栏上的图标来说，应当保持活跃状态，直到用户使用 Cmd + Q 退出。
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// TODO 暂不支持多窗口
ipcMain.handle('minimize', async () => {
  const win = BrowserWindow.getFocusedWindow() as Electron.BrowserWindow
  win.minimize()
})

ipcMain.handle('maximize', async () => {
  const win = BrowserWindow.getFocusedWindow() as Electron.BrowserWindow
  const maximized = win.isMaximized()
  maximized ? win.unmaximize() : win.maximize()
  return !maximized
})

ipcMain.handle('close', async event => {
  const win = BrowserWindow.getFocusedWindow() as Electron.BrowserWindow
  event.sender.isDevToolsOpened() && event.sender.closeDevTools()
  win.close()
  // win.destroy()
})

ipcMain.handle('directoryPicker', async (event, data) => {
  const result = await dialog.showOpenDialog(BrowserWindow.getFocusedWindow() as Electron.BrowserWindow, {
    title: `选择${data.title}`,
    defaultPath: data.directory || app.getPath("documents"),
    properties: [
      'openDirectory'
    ]
  })

  return result.canceled ? '' : result.filePaths[0]
})

ipcMain.handle('getAppVersion', async (event) => {
  return app.getVersion()
})