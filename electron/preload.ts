import { contextBridge, ipcRenderer } from 'electron'
import session from './store/session'
import setting from './store/setting'
import * as commonService from './service/commonService'
import * as replaceService from './service/replaceService'
import * as log from 'electron-log'

const channels = {
  r2m: [
    'toMain',
    'directoryPicker',
    'filePicker',
    'notification',
    'openFile',
    'saveFile',
    'deleteFile',
    'previewPdf',
    'replacePdf',
    'getAppVersion',
    'minimize',
    'maximize',
    'close',
    'createSession'
  ],
  m2r: [
    'fromMain',
    'previewPdf',
    'replacePdf',
    'readPlaceholderFromTemplate'
  ]
}

const listeners: {[key: string]: (...args: any[]) => void} = {}
contextBridge.exposeInMainWorld('ipc', {
  invoke: (channel: string, data: any) => {
    if (channels.r2m.includes(channel)) {
      return ipcRenderer.invoke(channel, data)
    } else {
      new Error(`invalid channel:${channel}`)
    }
  },
  send: (channel: string, data: { uid: any }) => {
    if (!data.uid) new Error('ipcRenderer.send: uid is required!')
    if (channels.r2m.includes(channel)) {
      ipcRenderer.send(channel, data)
    } else {
      new Error(`invalid channel:${channel}`)
    }
  },
  receive: (channel: string, func: (...args: any[]) => void) => {
    if (channels.m2r.includes(channel.split('-')[0])) {
      listeners[channel] = (event: any, ...args: any[]) => func(...args)
      ipcRenderer.on(channel, listeners[channel])
    } else {
      new Error(`invalid channel:${channel}`)
    }
  },
  removeListener: (channel: string) => {
    ipcRenderer.removeListener(channel, listeners[channel])
    delete listeners[channel]
  }
})

contextBridge.exposeInMainWorld('replaceService', { ...replaceService })
// contextBridge.exposeInMainWorld('settingService', { ...require('./service/settingService') })
contextBridge.exposeInMainWorld('commonService', { ...commonService })
contextBridge.exposeInMainWorld('setting', { ...setting })
contextBridge.exposeInMainWorld('session', { ...session })
// contextBridge.exposeInMainWorld('log', log)