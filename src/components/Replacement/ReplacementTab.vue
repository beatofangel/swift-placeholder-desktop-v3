<template>
  <v-container>
    <v-row>
      <v-col>
        <validation-observer ref="observer">
          <v-form ref="form" @submit.prevent="onSubmit">
            <v-card height="calc(100vh - 124px)">
              <v-card-text>
                <v-row>
                  <v-col>
                    <validation-provider name="业务类型" :rules="rules.businessCategory" v-slot="{ errors }">
                      <v-cascade-select v-model="session.businessCategory" :items="businessCategoryOptions" label="业务类型"
                        placeholder="请选择业务类型" persistent-placeholder
                        :menuProps="{ offsetY: true, closeOnContentClick: false }" :error-messages="errors[0]"
                        item-text="name" item-value="id" clearable open-on-clear outlined :scroll-offset="0">
                        <template v-slot:append-outer>
                          <v-hover v-slot="{ hover }" v-if="isAdminMode">
                            <v-icon @click="showBusinessCategoryListDialog"
                              :class="{ 'rotate-transition-120': hover }">mdi-cog</v-icon>
                          </v-hover>
                        </template>
                      </v-cascade-select>
                    </validation-provider>
                  </v-col>
                </v-row>
                <!-- <v-row>
                    <v-col>
                      <validation-provider
                        name="输出文件夹"
                        :rules="rules.outputFolder"
                        v-slot="{ errors }"
                      >
                        <v-text-field
                          v-model="formData.outputFolder"
                          label="输出文件夹"
                          :error-messages="errors[0]"
                          placeholder="请选择输出文件夹"
                          persistent-placeholder
                          append-icon="mdi-folder"
                          @click:append="showFolderBrowserDialog"
                          clearable
                          readonly
                          outlined
                        >
                        </v-text-field>
                      </validation-provider>
                    </v-col>
                  </v-row> -->
                <v-row>
                  <v-col>
                    <v-card>
                      <v-toolbar :color="$vuetify.theme.dark ? 'grey darken-4' : 'primary'" dark>
                        <!-- <v-icon color="grey lighten-2">mdi-file-document-multiple-outline</v-icon> -->
                        <v-tabs v-model="tab" ref="templateTabs" align-with-title>
                          <v-tabs-slider
                            :key="session.templates[tab] == null ? 'not_found' : session.templates[tab].id"></v-tabs-slider>
                          <v-tab v-for="{ id, name } in session.templates" :key="id">
                            <span class="text-h6">{{ name }}</span>
                          </v-tab>
                          <v-hover v-slot="{ hover }"
                            v-if="session.businessCategory && session.templates.length == 0 && isAdminMode">
                            <v-btn @click="showTemplateDialog" height="100%" color="transparent" depressed tile>
                              <v-icon :class="{ 'rotate-transition-180': hover }" color="success">mdi-plus</v-icon><span
                                class="text-h6">添加模板</span>
                            </v-btn>
                          </v-hover>
                          <v-hover v-slot="{ hover }"
                            v-if="session.businessCategory && session.templates.length > 0 && isAdminMode">
                            <v-btn @click="showTemplateListDialog" height="100%" color="transparent" depressed tile>
                              <v-icon :class="{ 'rotate-transition-120': hover }">mdi-cog</v-icon>
                            </v-btn>
                          </v-hover>
                          <v-banner v-if="!session.businessCategory">
                            <v-icon class="mt-n1 mr-1" color="warning">mdi-alert</v-icon>
                            <span class="text-h6">未选择业务类型</span>
                          </v-banner>
                        </v-tabs>
                      </v-toolbar>
                      <v-tabs-items v-model="tab">
                        <v-tab-item v-for="{ id, path } in session.templates" :key="id">
                          <replacement-edit :session="session" :tplId="id" :tplPath="path"
                            @input:template-path="onTemplatePathChange"
                            @input:placeholder-groups="onPlaceholderGroupsChange">
                          </replacement-edit>
                        </v-tab-item>
                      </v-tabs-items>
                    </v-card>
                  </v-col>
                </v-row>
              </v-card-text>
              <!-- <v-card-actions class="px-4">
                  <v-spacer></v-spacer>
                  <v-btn
                    type="submit"
                    :loading="processing.submit"
                    :disabled="invalid"
                    color="primary"
                    >开始替换</v-btn
                  >
                </v-card-actions> -->
            </v-card>
          </v-form>
        </validation-observer>
      </v-col>
    </v-row>
    <v-dialog width="calc(100vw)" v-model="dialog.showBusinessCategoryList">
      <business-category-list :visible="dialog.showBusinessCategoryList" @close="dialog.showBusinessCategoryList = false"
        @change="updateCategoryOptions"></business-category-list>
    </v-dialog>
    <v-dialog width="600" v-model="dialog.showTemplateList">
      <common-list :condition="{ bcId: session.businessCategory }" model="Template" title="模板" :headers="templateHeaders"
        :item-names="['name', 'path']" :visible="dialog.showTemplateList" @close="dialog.showTemplateList = false"
        @change="onBusinessCategoryChange" :interceptor="{ save: saveTemplateFile, delete: deleteTemplateFile }">
        <template v-slot:[`item.path`]="{ item }">
          <v-icon @click="openTemplate(item.path)">mdi-open-in-new</v-icon>
        </template>
        <template v-slot="{ id, name, path, isEdit, cancel, save }">
          <template-detail :id="id" :name="name" :path="path" :bcId="session.businessCategory" :isEdit="isEdit"
            @cancel="cancel" @save="save"></template-detail>
        </template>
      </common-list>
    </v-dialog>
    <v-dialog width="500" v-model="dialog.showTemplateDetail">
      <template-detail v-bind="newTemplate" :isEdit="false" @cancel="cancelTemplete"
        @save="saveTemplate"></template-detail>
    </v-dialog>
  </v-container>
</template>
  
<script lang="ts" setup>
import CommonList from "@/components/Common/CommonList.vue";
import TemplateDetail from '@/components/Template/TemplateDetail.vue';
import ReplacementEdit from './ReplacementEdit.vue';
import { VCascadeSelect } from '../VCascadeSelect'
import BusinessCategoryList from '@/components/BusinessCategory/BusinessCategoryList.vue'
import { defineProps, watch } from 'vue'
import { ref } from "vue";
// import { Session } from 'electron/store/session'
import type { Session } from '@/types'
import { computed } from "@vue/reactivity";

const props = withDefaults(defineProps<{
  session: Session
}>(), {
  session: {} as (props: Readonly<Omit<{ session: Session; }, never> & {}>) => Session
})
// const props = defineProps({
//   session: {
//     type: Session,
//     default: () => {}
//   }
// })

const tab = ref(0)

const emit = defineEmits(['input'])

watch(() => props.session, (newSession) => {
  window.store.saveSession(newSession)
})

watch(() => props.session.businessCategory, (newBusinessCategory) => {
  tab.value = 0
  if (newBusinessCategory) {
    onBusinessCategoryChange()
    emit('input', props.session.id, selectedBusinessCategories.map(e => e.name).join('_'))
  } else {
    props.session.templates.splice(0)
  }
})

const selectedBusinessCategories = computed({
  get: () => {
    
  }
})

function onBusinessCategoryChange() {
      window.replaceService
        .findTemplateByBcId({ bcId: props.session.businessCategory })
        .then(data => {
          props.session.templates = data;
          this.$refs.templateTabs.callSlider()
        }).catch(err => {
          console.log(err)
          this.$toast.error(`模板加载失败！`)
        })
    }

export default {
  name: 'replacement-tab',
  props: {
    session: {
      type: Object,
      default: () => { }
    }
  },
  components: {
    CommonList,
    TemplateDetail,
    ReplacementEdit,
    VCascadeSelect,
    BusinessCategoryList
  },
  mounted() {
    this.adminMode = window.store.getSetting('settings.adminMode').value
    this.unsubscribe = window.store.onDidChange('settings.adminMode', this.switchAdminMode)
    this.updateCategoryOptions()
  },
  beforeDestroy() {
    this.unsubscribe && this.unsubscribe()
  },
  watch: {
    session: {
      deep: true,
      handler(val) {
        window.store.saveSession(val)
      }
    },
    // "formData.templates": {
    //   deep: true,
    //   handler(val) {
    //     this.session.templates = val
    //   }
    // },
    "session.businessCategory"(val) {
      console.log("业务分类(watch)：", val);
      this.tab = 0
      if (val) {
        this.onBusinessCategoryChange()
        this.$emit('input', this.session.id, this.selectedBusinessCategories.map(e => e.name).join('_'))
        // this.session.businessCategory = {
        //   id: this.session.businessCategory,
        //   name: this.selectedBusinessCategories.map(e=>e.name).join('>')
        // }
        // this.$emit('input', this.session.id, {
        //   id: this.session.businessCategory,
        //   name: this.selectedBusinessCategories.map(e=>e.name).join('>')
        // })
        // console.log(this.session.businessCategory.name)
      } else {
        this.session.templates.splice(0)
      }
    },
  },
  computed: {
    isAdminMode() {
      return this.adminMode == 1
    },
    selectedBusinessCategories() {
      const path = [];
      const pathFinder = (obj, level) => {
        if (obj && Array.isArray(obj)) {
          for (let i = 0; i < obj.length; i++) {
            path.push(obj[i]);
            if (obj[i].id == this.session.businessCategory) {
              return true;
            } else {
              if (obj[i].children) {
                if (pathFinder(obj[i].children, level + 1)) {
                  return true;
                } else {
                  path.pop();
                }
              } else {
                path.pop();
              }
            }
          }
        }
        return false;
      };
      this.session.businessCategory && pathFinder(this.businessCategoryOptions, 0);
      return path
    },
  },
  methods: {
    onTemplatePathChange(tplId, path) {
      console.log(tplId, path)
      // const template = this.session.templates.find(e=>e.id == tplId)
      // if (!template) {
      //   this.session.templates.push({
      //     id: tplId,
      //     path: path,
      //     placeholderGroups: []
      //   })
      // } else {
      //   template.path = path
      // }
    },
    onPlaceholderGroupsChange(tplId, groups) {
      console.log(tplId, groups)
      // const idx = this.session.templates.findIndex(e=>e.id == tplId)
      // if (!idx) {
      //   // dead code
      // } else {
      //   this.$set(this.session.templates[idx], 'placeholderGroups', groups)
      //   // this.session.templates[idx].placeholderGroups = groups
      // }
    },
    switchAdminMode(key, val) {
      this.$set(this, 'adminMode', val.value)
    },
    /** 当类型列表修改时，同步修改内容（重新取得下拉菜单） */
    updateCategoryOptions() {
      window.replaceService.findBusinessCategoryCascaded().then(data => {
        this.businessCategoryOptions = data
      }).catch(err => {
        console.log(err)
        this.$toast.error(`业务类型加载失败！`)
      })
    },
    onBusinessCategoryChange() {
      window.replaceService
        .findTemplateByBcId({ bcId: this.session.businessCategory })
        .then(data => {
          this.session.templates = data;
          this.$refs.templateTabs.callSlider()
        }).catch(err => {
          console.log(err)
          this.$toast.error(`模板加载失败！`)
        })
    },
    cancelTemplete() {
      this.dialog.showTemplateDetail = false
    },
    showTemplateDialog() {
      this.dialog.showTemplateDetail = true
      this.$set(this, 'newTemplate', {
        id: null,
        name: null,
        path: null,
        bcId: this.session.businessCategory
      })
    },
    saveTemplateFile({ path, ignoreSaveFile }) {
      return ignoreSaveFile ? Promise.resolve() : window.ipc
        .invoke("saveFile", {
          srcPath: path,
          folder: this.session.businessCategory,
          type: "template",
        })
    },
    deleteTemplateFile(path) {
      console.log("删除模板文件", path)
      return window.ipc.invoke("deleteFile", {
        filePath: path
      })
        .then(() => {
          this.$toast.success('模板文件删除成功！')
        })
        .catch(err => {
          console.warn(err)
          this.$toast.warning('模板文件删除失败！')
        })
    },
    saveTemplate(newTemplate) {
      this.saveTemplateFile(newTemplate).then(preResult => {
        for (const key in preResult) {
          newTemplate[key] && (newTemplate[key] = preResult[key])
        }
        console.log(newTemplate)
        window.replaceService.saveTemplate(newTemplate).then(() => {
          this.dialog.showTemplateDetail = false
          // this.onBusinessCategoryChange()
          this.$toast.success(`模板保存成功！`)
        }).catch(err => {
          console.log(err)
          this.$toast.error(`模板保存失败！`)
        })
      })
    },
    openTemplate(path) {
      window.ipc.invoke("openFile", path).then((err) => {
        if (err) {
          console.error(err);
        }
      });
    },
    showBusinessCategoryListDialog() {
      this.dialog.showBusinessCategoryList = true
    },
    showTemplateListDialog() {
      this.dialog.showTemplateList = true;
    },
    // showFolderBrowserDialog() {
    //   window.ipc
    //     .invoke("directoryPicker", {
    //       title: "输出文件夹",
    //       directory: this.formData.outputFolder,
    //     })
    //     .then((res) => {
    //       if (res) {
    //         this.formData.outputFolder = res;
    //       }
    //     });
    // },
  },
  data() {
    return {
      businessCategoryOptions: [
      ],
      // formData: {
      //   businessCategory: null,
      //   outputFolder: null,
      //   templates: [],
      // },
      templateHeaders: [
        {
          text: 'No.',
          value: 'index'
        },
        {
          text: '名称',
          value: 'name'
        },
        {
          text: '模板',
          value: 'path'
        },
        {
          text: '操作',
          value: 'actions',
          align: 'center',
        },
      ],
      rules: {
        businessCategory: { requiredSelect: true },
        outputFolder: { requiredSelect: true },
      },
      processing: {
        submit: false,
      },
      dialog: {
        // showCategoryList: false,
        showBusinessCategoryList: false,
        showTemplateList: false,
        showTemplateDetail: false,
      },
      newTemplate: {},
      tab: 0,
      adminMode: false,
      unsubscribe: null
    };
  },
};
</script>