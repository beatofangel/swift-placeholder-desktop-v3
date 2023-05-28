<template>
  <v-main>
    <router-view v-slot="{ Component }">
      <keep-alive>
        <component :is="Component" />
      </keep-alive>
    </router-view>
  </v-main>
</template>

<script lang="ts" setup>
  //
</script>
