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
      text="测试内容3"
      error
      cancelable
      @confirm="handleConfirm"
      @cancel="handleCancel"
    ></CommonDialog> -->
    <v-btn @click="showDialog({op: EditModeDelete, text: () => h(VBtn, { prop: { variant: 'text' }}, ()=>'ok') })">delete</v-btn>
    <v-btn @click="showDialog({op: EditModeCreate, text: () => 'no'})">create</v-btn>
    <v-btn @click="showDialog({op: EditModeUpdate})">update</v-btn>
    <v-btn @click="showDialog({op: EditModeRead})">read</v-btn>
  </v-container>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { VCascadeSelect } from './VCascadeSelect';
import { watch } from 'vue';
import { EditModeCreate, EditModeDelete, EditModeRead, EditModeUpdate, useCurrentInstance } from '@/composables';
import { h } from 'vue';
import { VBtn } from 'vuetify/lib/components/VBtn/index';
const { proxy } = useCurrentInstance()
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
function showDialog(data: any) {
  proxy.$dialog.confirm({
    ...data,
    'onUpdate:modelValue': (val: boolean) => {console.log('onUpdate:modelValue', val)},
    'onClosed': () => { console.log('this is my onClosed event handler.') },
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
