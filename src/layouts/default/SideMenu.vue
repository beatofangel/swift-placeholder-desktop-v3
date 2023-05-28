<template>
  <v-navigation-drawer
    rail-width="48"
    v-if="!showLogin"
    rail
    permanent
    color="secondary-lighten-1"
    :theme="isDarkMode ? 'dark' : 'light'"
    :class="{'rounded-bs-lg': !props.maximized}"
  >
    <v-tabs
      grow
      slider-color="secondary"
      direction="vertical"
    >
      <template v-for="link in links" :key="link.name">
        <v-tooltip transition="fade-transition" right>
          <template v-slot:activator="{ props }">
            <v-tab
              style="-webkit-user-drag: none; min-width: unset"
              v-bind="props"
              class="pl-2 pr-0"
              :to="link.path"
            >
              <v-icon size="32" left>{{
                $route.path == link.path || isDarkMode
                  ? link.icon
                  : `${link.icon}-outline`
              }}</v-icon>
            </v-tab>
          </template>
          {{ link.name }}
        </v-tooltip>
      </template>
      <v-divider></v-divider>
      <v-tooltip transition="fade-transition" right>
        <template v-slot:activator="{ props }">
          <v-btn
            @click="toggleDarkMode"
            v-bind="props"
            min-width="48"
            width="48"
            height="48"
            variant="text"
          >
            <v-icon
              size="32"
              :color="isDarkMode ? 'yellow darken-2' : 'blue lighten-1'"
            >
              {{ isDarkMode ? "mdi-weather-sunny" : "mdi-weather-night" }}
            </v-icon>
          </v-btn>
        </template>
        {{ isDarkMode ? "关闭" : "开启" }}夜间模式
      </v-tooltip>
      <v-bottom-sheet v-model="dialog.settingDialog">
        <template v-slot:activator="{ props: bottomSheetProps }">
          <v-tooltip transition="fade-transition" right>
            <template v-slot:activator="{ props }">
              <v-hover v-slot="{ isHovering }">
                <v-btn
                  @click="dialog.settingDialog = !dialog.settingDialog"
                  v-bind="Object.assign(bottomSheetProps, props)"
                  class="px-0"
                  min-width="48"
                  width="48"
                  height="48"
                  variant="text"
                >
                  <v-icon
                    size="32"
                    :class="{ 'rotate-transition-120': isHovering }"
                    :color="
                      isDarkMode ? 'secondary lighten-4' : 'secondary lighten-2'
                    "
                    >mdi-cog</v-icon
                  >
                </v-btn>
              </v-hover>
            </template>
            设置
          </v-tooltip>
        </template>
        <v-sheet class="text-center">
          <v-card>
            <v-toolbar dense flat>
              <v-icon color="primary" class="mr-3">mdi-cog</v-icon>
              <v-app-bar-title>设置</v-app-bar-title>
              <v-spacer></v-spacer>
              <v-btn
                variant="text"
                color="red"
                @click="dialog.settingDialog = !dialog.settingDialog"
                icon
              >
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </v-toolbar>
            <v-card-text>
              <v-row>
                <v-col v-for="(setting, key) in settings" :key="key">
                  <v-card width="200">
                    <v-card-title class="d-flex justify-center">
                      <v-switch
                        v-if="setting.type === 'BOOL'"
                        true-value="1"
                        false-value="0"
                        v-model="settings[key].value"
                        :label="setting.name"
                        @change="settingChangeHandler(key, setting)"
                      ></v-switch>
                      <v-text-field
                        v-else-if="setting.type === 'TEXT'"
                        v-model="settings[key].value"
                        :label="setting.name"
                        dense
                        outlined
                      ></v-text-field>
                      <v-text-field
                        v-else-if="setting.type === 'PATH'"
                        v-model="settings[key].value"
                        :label="setting.name"
                        dense
                        append-icon="mdi-folder"
                        @click="showFolderBrowserDialog(key)"
                        @click:append="showFolderBrowserDialog(key)"
                        clearable
                        readonly
                        outlined
                      ></v-text-field>
                      <template v-else>
                        {{ setting }}
                      </template>
                    </v-card-title>
                    <v-card-text class="grey--text">
                      <v-icon small>mdi-information-variant</v-icon
                      >{{ setting.description }}
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
              <!-- <v-row v-for="row in settingRow" :key="row">
                <v-col v-for="col in settingCol" :key="col">
                  <v-card v-if="(row - 1) * settingCol + col - 1 < settings.length" width="200">
                    <v-card-title class="d-flex justify-center">
                      <v-switch
                        v-if="setting(row, col).type === 'BOOL'"
                        true-value="1" 
                        false-value="0"
                        v-model="setting(row, col).value"
                        :label="setting(row, col).name"
                        @change="updateBoolSetting(setting(row, col))"
                      ></v-switch>
                    </v-card-title>
                    <v-card-text class="grey--text">
                      <v-icon small>mdi-information-variant</v-icon>{{ setting(row, col).description }}
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row> -->
            </v-card-text>
          </v-card>
        </v-sheet>
      </v-bottom-sheet>
      <v-container
        class="pa-0 fill-height draggable-region"
        fluid
      ></v-container>
    </v-tabs>
    <!-- <v-dialog v-model="showLogin" width="unset" no-click-animation hide-overlay persistent light>
      <common-login @input="e=>showLogin = e"></common-login>
    </v-dialog> -->
    <!-- 避免遮罩层挡住app-bar -->
    <v-overlay :absolute="true" :value="showLogin"></v-overlay>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import type { Link, Setting } from "@/types";
import { computed, ref } from "@vue/reactivity";
import { useRouter } from "vue-router";
import { useTheme } from "vuetify";
import { VBottomSheet } from "vuetify/lib/labs/components.mjs";
const theme = useTheme();
const showLogin = ref(false);
const dialog = ref({
  settingDialog: false,
});
const props = defineProps({
  maximized: Boolean
})

const links = ref(new Array<Link>());

useRouter().options.routes.forEach((pRoute) => {
  if (pRoute.path === '/') {
    pRoute.children?.forEach(route => {
      console.log('router:', route.path)
      links.value.push({
        name: route.name,
        path: route.path,
        icon: route.meta?.icon,
      } as Link);
    })
  }
});

const isDarkMode = computed(() => {
  return theme.global.current.value.dark;
});

const settings = computed(() => {
  const s = window.settings.getSetting("settings");
  console.log(s)
  return s
});

// methods
function toggleDarkMode() {
  theme.global.name.value = theme.global.current.value.dark ? "light" : "dark";
}
function settingChangeHandler(id: string, setting: Setting) {
  setting.id = id;
  window.settings.saveSetting(setting);
}
function showFolderBrowserDialog(key: string) {
  window.ipc
    .invoke("directoryPicker", {
      title: "文件夹",
      directory: settings.value[key].value as string,
    })
    .then((path) => {
      if (path) {
        settings.value[key].value = path;
        settingChangeHandler(key, settings.value[key]);
      }
    });
}
</script>
