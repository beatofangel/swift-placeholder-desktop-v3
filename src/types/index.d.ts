export {}

declare global {
  interface Window {
    replaceService: {
      findBusinessCategoryCascaded: () => Promise<any>
    },
  }
}