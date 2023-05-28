export { }

export interface Session extends Record<string, any> {
  declare id: string
  declare name: string
  declare type: string
  declare businessCategory: string
  declare templates: string[]
}

export enum EditMode {
  Create = 1, Read = 2, Update = 3, Delete = 4
}

export interface CommonListItem {
  id: string,
  name: string,
  icon?: string,
  ordinal: number,
  isEdit: boolean,
  sort: boolean,
}

export interface Link {
  name: string,
  path: string,
  icon: string,
}

export interface Setting {
  id: string,
  name: string,
  description: string,
  type: string,
  value: string | number | boolean
}

declare global {
  interface Window {
    replaceService: {
      findBusinessCategoryCascaded: () => Promise<any>,
      findTemplateByBcId: ({ bcId }: { bcId: string }) => Promise<any>
    },
    session: {
      saveSession: (session: Session) => Promise<any>,
    },
    settings: {
      getSetting: (name: string) => Record<string, Setting>,
      saveSetting: (setting: Setting) => Promise<any>
    },
    commonService: {
      find: (modelName: string, condition: object) => Promise<any>,
      bulkSave: (modelName: string, ...items: Array<CommonListItem>) => Promise<any>,
    },
    appService: {
      appName: () => Promise<any>,
      // appVersion: () => Promise<string>,
      // directoryPicker: (title: string, directory: string) => Promise<string>,
      // maximize: () => Promise<boolean>,
      // minimize: () => Promise<any>,
      // close: () => Promise<any>,
    },
    ipc: {
      invoke: (api: string, params?: any) => Promise<any>
    }
  }
}