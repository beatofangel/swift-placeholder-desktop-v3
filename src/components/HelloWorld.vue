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
    <!-- <v-select
      v-model="selected2"
      :items="[
        {title: '1', value: 1},
        {title: '2', value: 2},
        {title: '3', value: 3},
        {title: '4', value: 4},
        {title: '5', value: 5},
        {title: '6', value: 6},
        {title: '7', value: 7},
        {title: '8', value: 8},
        {title: '9', value: 9},
        {title: '0', value: 0},
      ]"
    ></v-select> -->
  </v-container>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { VCascadeSelect } from './VCascadeSelect';
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
