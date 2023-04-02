<template>
  <router-view />
</template>

<script lang="ts" setup>
  //
</script>

<style>
*::-webkit-scrollbar {
  width: 4px;
}
*::-webkit-scrollbar-track {
  background: var(--v-scrollbarTrack-base);
  /* background: #e6e6e6; */
  /* border-left: 1px solid #dadada; */
}
*::-webkit-scrollbar-thumb {
  background: var(--v-scrollbarThumb-base);
  /* border: solid 2px #e6e6e6; */
  border-radius: 2px;
}
*::-webkit-scrollbar-thumb:hover {
  background: var(--v-scrollbarThumbHover-base);
}
</style>