<template>
  <v-app :class="{ 'rounded-lg': !maximized }">
    <default-bar @maximized="handleMaximized" />
    <default-side-menu :maximized="maximized" />
    <default-view />
    <span
      style="
        position: absolute;
        right: 0;
        bottom: 0;
        opacity: 50%;
        font-size: 28px;
        margin: 20px;
      "
    >
      测试版 v{{ appVersion }}
    </span>
  </v-app>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import DefaultBar from "./AppBar.vue";
import DefaultSideMenu from "./SideMenu.vue";
import DefaultView from "./View.vue";

const maximized = ref();
const appVersion = ref("0.0.0");
window.ipc.invoke("getAppVersion").then((ver) => {
  appVersion.value = ver;
});

function handleMaximized(isMaximized: boolean) {
  console.log('rounded border', !isMaximized)
  maximized.value = isMaximized;
}
</script>
