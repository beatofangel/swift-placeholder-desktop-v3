<template>
  <router-view />
</template>

<script lang="ts" setup>
  //
</script>

<style lang="css">
*::-webkit-scrollbar {
  width: 4px;
}
*::-webkit-scrollbar-track {
  background: rgb(var(--v-scrollbarTrack));
  /* background: #e6e6e6; */
  /* border-left: 1px solid #dadada; */
}
*::-webkit-scrollbar-thumb {
  background: rgb(var(--v-scrollbarThumb));
  /* border: solid 2px #e6e6e6; */
  border-radius: 2px;
}
*::-webkit-scrollbar-thumb:hover {
  background: rgb(var(--v-scrollbarThumbHover));
}
.v-btn--closable.v-btn--variant-text .v-btn__overlay {
  background-color: transparent;
}

</style>