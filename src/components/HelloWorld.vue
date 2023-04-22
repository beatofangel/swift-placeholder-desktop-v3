<template>
  <v-container fluid class="fill-height">
    <v-cascade-select
      v-model="selected"
      variant="outlined"
      chips
      :items="items"
      item-title="name"
      item-value="id"
      clearable
      open-on-clear
      label="业务类型"
      placeholder="请选择业务类型"
    ></v-cascade-select>
    <!-- <CommonDialog
      v-model="dialog"
      text="测试内容"
      warning
      cancelable
      @confirm="handleConfirm"
      @cancel="handleCancel"
    ></CommonDialog> -->
    <v-btn @click="showDialog">test</v-btn>
  </v-container>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { VCascadeSelect } from './VCascadeSelect';
import { getCurrentInstance } from 'vue';
import { watch } from 'vue';
// @ts-ignore
const { proxy } = getCurrentInstance()
// import { CommonDialog } from './common/commonDialog';
// class CascadeSelectionItem {
//   name: String
//   id: String
//   children?: Array<CascadeSelectionItem>

//   constructor(name: String, id: String, children?: Array<CascadeSelectionItem>) {
//     this.name = name
//     this.id = id
//     this.children = children
//   }
// }
const dialog = ref(true)
function handleConfirm() {
  console.log('confirm')
}
function handleCancel() {
  console.log('cancel')
}
watch(dialog, (val) => {
  console.log('dialog', val)
})
// TODO 对话框无法关闭
function showDialog() {
  proxy.$dialog({
    text: '测试内容',
    warning: true,
    cancelable: true,
    onConfirm: handleConfirm,
    onCancel: handleCancel,
  })
}
const items = ref([])
window.replaceService.findBusinessCategoryCascaded().then(result=>{
  items.value = result
})
// const items = new Array(10).fill(new CascadeSelectionItem('', '')).map((e: any, i: number)=>{ return new CascadeSelectionItem(`Item #1_${i + 1}`, `#1_${i + 1}`)})
// items[0].children = new Array<CascadeSelectionItem>()
// items[0].children.push(...new Array(6).fill(new CascadeSelectionItem('', '')).map((e: any, i: number)=>{ return new CascadeSelectionItem(`Item #2_${i + 1}`, `#1_1_#2_${i + 1}`)}))
// items[0].children[1].children = new Array<CascadeSelectionItem>()
// items[0].children[1].children.push(...new Array(3).fill(new CascadeSelectionItem('', '')).map((e: any, i: number)=>{ return new CascadeSelectionItem(`Item #3_${i + 1}`, `#1_1_#2_2_#3_${i + 1}`)}))
const selected = ref()
// const selected2 = ref()
//
</script>
