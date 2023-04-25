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

declare global {
  interface Window {
    replaceService: {
      findBusinessCategoryCascaded: () => Promise<any>,
      findTemplateByBcId: ({ bcId }: { bcId: string }) => Promise<any>
    },
    store: {
      saveSession: (session: Session) => Promise<any>
    },
    commonService: {
      find: (modelName: string, condition: object) => Promise<any>,
      bulkSave: (modelName: string, ...items: Array<CommonListItem>) => Promise<any>,
    },
    appService: {
      appName: () => Promise<any>,
    }
  }
}