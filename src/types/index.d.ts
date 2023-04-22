export {}

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
      findBusinessCategoryCascaded: () => Promise<any>
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