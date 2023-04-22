import { build } from '../../package.json'

export function appName() {
  console.log('appName', build.productName)
  return build.productName
}