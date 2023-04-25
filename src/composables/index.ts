import type { EditMode } from "@/types"
import { ComponentInternalInstance, getCurrentInstance } from 'vue'

export const appName = await window.appService.appName()

export const EditModeCreate: EditMode = 1
export const EditModeRead: EditMode = 2
export const EditModeUpdate: EditMode = 3
export const EditModeDelete: EditMode = 4

export function useCurrentInstance() {
    const { appContext } = getCurrentInstance() as ComponentInternalInstance
    const proxy = appContext.config.globalProperties
    return {
        proxy
    }
}