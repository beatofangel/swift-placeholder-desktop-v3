<template>
  <v-app-bar
    :color="darkMode ? '' : 'primary'"
    class="title-bar title-bar-drag"
    :class="{'rounded-t-lg': !maximized}"
    flat
    height="36"
  >
    <div class="d-flex align-center logo">
      <v-img
        alt="App Logo"
        class="shrink mr-4 ml-2"
        contain
        src="logo.png"
        transition="scale-transition"
        width="32"
      />
    </div>
    <v-app-bar-title class="text-h6"> SWIFT PLACEHOLDER </v-app-bar-title>
    <v-spacer></v-spacer>
    <div class="d-flex flex-nowrap utility-region">
      <v-avatar
        class="hidden-sm-and-down mr-4 mt-1"
        color="grey darken-1 shrink"
        size="32"
        >A</v-avatar
      >
      <v-switch
        @click="toggleDarkMode"
        :value="darkMode"
        class="my-auto"
        density="compact"
        hide-details
        :ripple="false"
        inset
      ></v-switch>
    </div>
    <div class="d-flex flex-nowrap system-control-region align-self-start">
      <v-btn
        @click="minimize"
        variant="text"
        :ripple="false"
        rounded="0"
        small
      >
        <v-icon size="20">mdi-minus</v-icon>
      </v-btn>
      <v-btn
        @click="maximize"
        variant="text"
        :ripple="false"
        rounded="0"
        small
      >
        <v-icon size="18">{{
          maximized
            ? "mdi-checkbox-multiple-blank-outline mdi-rotate-180"
            : "mdi-checkbox-blank-outline"
        }}</v-icon>
      </v-btn>
      <v-hover v-slot="{ isHovering, props }">
        <v-btn
          @click="close"
          v-bind="props"
          :color="
            isHovering
              ? 'error lighten-5'
              : ''
          "
          :ripple="false"
          variant="text"
          rounded="0"
          small
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-hover>
    </div>
  </v-app-bar>
</template>

<script lang="ts" setup>
import { computed, ref } from "@vue/reactivity";
import { useTheme } from "vuetify";
const maximized = ref(false);
const theme = useTheme();
const darkMode = computed(() => {
  return theme.global.current.value.dark;
});

// emits
const emit = defineEmits<{
  (event:'maximized', isMaximized: boolean): void,
}>()

// methods
function minimize() {
  window.ipc.invoke("minimize");
}
async function maximize() {
  maximized.value = await window.ipc.invoke("maximize");
  emit('maximized', maximized.value)
}
function close() {
  window.ipc.invoke("close");
}
function toggleDarkMode() {
  theme.global.name.value = theme.global.current.value.dark ? "light" : "dark";
  // localStorage.setItem("darkTheme", this.$vuetify.theme.dark.toString());
}
</script>
<style lang="scss">
.title-bar > .v-toolbar__content {
  // padding-left: 6px;
  padding-right: 0px;
}
.utility-region,
.system-control-region {
  -webkit-app-region: no-drag;
}

.title-bar-drag {
  user-select: none;
  -webkit-user-select: none;
  -webkit-app-region: drag;
}
</style>