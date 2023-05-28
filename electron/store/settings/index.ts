import { Setting } from '@/types'
import Store from 'electron-store'

const store = new Store()

/* store.has("settings") ||  */// store.set("settings", {})

// class Setting {
//   declare id: string
//   declare name: string
//   declare type: string
//   declare value: any
//   declare description: string
// }

function saveSetting(setting: Setting) {
  store.set(`settings.${setting.id}.name`, setting.name)
  store.set(`settings.${setting.id}.description`, setting.description)
  store.set(`settings.${setting.id}.type`, setting.type)
  store.set(`settings.${setting.id}.value`, setting.value)
  // store.getSetting("settings")[setting.id] = {
  //   name: setting.name,
  //   description: setting.description,
  //   type: setting.type,
  //   value: setting.value
  // }
}
function initSettings(settings: Setting[]) {
  settings.forEach(setting => {
    store.set(`settings.${setting.id}.name`, setting.name)
    store.set(`settings.${setting.id}.description`, setting.description)
    store.set(`settings.${setting.id}.type`, setting.type)
    store.set(`settings.${setting.id}.value`, setting.value)
    // store.getSetting("settings")[setting.id] = {
    //   name: setting.name,
    //   description: setting.description,
    //   type: setting.type,
    //   value: setting.value
    // }
  })
}

// export function isAdminMode() {
//   return store.getSetting("settings.adminMode.value") == 1
// }

function getSetting(key: string) {
  return store.get(key, null) as Record<string, Setting>
}

function onDidChange(key: string, callback: Function) {
  return store.onDidChange(key, (newValue: any) => callback(key, newValue))
}

export default {
  saveSetting,
  initSettings,
  getSetting,
  onDidChange
}