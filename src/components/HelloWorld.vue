<template>
  <v-container fluid class="fill-height">
    <v-cascade-select :items="items"></v-cascade-select>
  </v-container>
</template>

<script lang="ts" setup>
import { VCascadeSelect } from './VCascadeSelect';
const items = new Array(10).fill(null).map((e: any, i: number)=>{ return { title: `Item #${i + 1}`, value: i + 1}})
  //
</script>
