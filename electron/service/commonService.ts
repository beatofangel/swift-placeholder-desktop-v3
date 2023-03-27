import { saveBusinessCategory, bulkSaveBusinessCategory, saveTemplate, bulkSaveTemplate, findTemplateByBcId, findBusinessCategoryByPid } from './replaceService'
import { upperFirst } from 'lodash'

const saveMethods: {[key:string]:any} = {
  saveBusinessCategory,
  bulkSaveBusinessCategory,
  saveTemplate,
  bulkSaveTemplate
}

const findMethods: {[key:string]:any} = {
  findTemplateByBcId,
  findBusinessCategoryByPid,
}

export async function find(modelName: string, conditions: {[key:string]: string | number | Date | boolean | undefined}) {
  const methodName = `find${modelName}` + (conditions ? `By${Object.keys(conditions).map(upperFirst).join('And')}` : 'All')
  console.log(methodName, conditions)
  return await findMethods[methodName](conditions)
}

export async function bulkSave(modelName: string, ...items: any[]) {
  const methodName = `bulkSave${modelName}`
  return await saveMethods[methodName](items)
}

export async function save(modelName: string, item: any) {
  const methodName = `save${modelName}`
  return await saveMethods[methodName](item)
}