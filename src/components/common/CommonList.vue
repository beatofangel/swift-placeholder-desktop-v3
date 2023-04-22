<template>
  <v-card :flat="flat">
    <v-card-title v-if="hideToolBar && !!title" class="d-flex justify-center">
      <span class="text-h5 ml-1 mt-1">{{ title }}列表</span>
    </v-card-title>
    <v-toolbar v-else-if="!!title" color="primary" dark>
      <v-icon>mdi-format-list-bulleted</v-icon>
      <span class="text-h5 ml-1 mt-1">{{ title }}列表</span>
      <v-spacer></v-spacer>
      <v-btn @click="onClose" fab plain small>
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-toolbar>
    <v-data-table
      v-model="selected"
      :items="items"
      :headers="headers"
      disable-sort
      hide-default-footer
      disable-pagination
      :show-select="showSelect"
      single-select
      fixed-header
      :height="tableHeight"
    >
      <template v-slot:body="{ items: slotItems, headers, isSelected, select }">
        <draggable
          v-model="items"
          :animation="200"
          :group="`${title}List`"
          :disabled="slotItems.length == 0"
          ghostClass="ghost"
          tag="tbody"
          @start="onDragRow"
          @end="onDropRow"
        >
          <template v-for="(item, index) in slotItems">
            <transition :name="!drag ? 'flip-list' : null" type="transition" :key="item.name">
              <v-hover v-slot="{ hover }">
                <tr>
                  <template v-for="{ value, cellClass } in headers">
                    <td v-if="value == 'data-table-select'" :key="value">
                      <v-icon :color="isSelected(item) ? 'primary' : ''" @click="select(item, !isSelected(item))">{{ isSelected(item) ? 'mdi-radiobox-marked' : 'mdi-radiobox-blank'}}</v-icon>
                    </td>
                    <td v-if="value == 'index'" class="text-start" :key="`item.${value}`">
                      <v-icon v-if="hover" class="ml-n1">mdi-swap-vertical</v-icon>
                      <template v-else>
                        {{ index + 1 }}
                      </template>
                    </td>
                    <td v-if="!['index', 'data-table-select', 'actions'].includes(value)" :class="`text-start ${cellClass || ''}`" :key="`item.${value}`">
                      <slot v-if="$scopedSlots[`item.${value}`]" :name="`item.${value}`" v-bind:item="item" v-on="$scopedSlots[`item.${value}`]"></slot>
                      <template v-else>{{ item[value] }}</template>
                    </td>
                    <td v-if="value == 'actions'" class="text-center" :key="`item.${value}`">
                      <v-row class="actions justify-center">
                        <v-icon class="edit" @click="showEdit({...item, isEdit: true})">mdi-pencil</v-icon>
                        <v-icon class="delete" @click="handleDelete({ ...item, delete: true})">mdi-delete</v-icon>
                      </v-row>
                    </td>
                  </template>
                </tr>
              </v-hover>
            </transition>
          </template>
          <tr v-if="slotItems.length == 0" class="v-data-table__empty-wrapper">
            <td :colspan="headers.length">
              {{ noData }}
            </td>
          </tr>
        </draggable>
      </template>
    </v-data-table>
    <v-divider></v-divider>
    <v-card-actions>
      <!-- <v-btn v-if="showSelect && !hideSelectBtn" color="primary" :disabled="items.length == 0 || selected.length == 0" @click="handleSelect">选择</v-btn> -->
      <v-spacer></v-spacer>
      <v-btn v-if="!hideCreate" color="success" @click="showEdit()"><v-icon>mdi-plus</v-icon></v-btn>
    </v-card-actions>
    <v-dialog width="500" v-model="dialog.showDetail">
      <slot v-bind="item" :title="title" :visible="dialog.showDetail" :cancel="handleCancel" :save="handleSave"></slot>
    </v-dialog>
    <!-- <confirm-dialog
      v-model="dialog.showConfirm"
      :message="`确定要删除该${title}？`"
      @confirm="handleDelete({ ...item, delete: true})"
    ></confirm-dialog> -->
    <!-- <v-dialog width="500" v-model="dialog.showConfirm">
      <v-card>
        <v-card-title class="text-h5">{{ `确定要删除该${this.title}？` }}</v-card-title>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" text @click="dialog.showConfirm = false">取消</v-btn>
          <v-btn color="error" @click="handleDelete({ ...item, delete: true})">确定</v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog> -->
  </v-card>
</template>

<script lang="ts" setup>
import { useToast } from "vue-toastification";
import { watch } from "vue"
import { ref, reactive } from "vue"
import { defineComponent } from "vue"
import draggable from "vue3-draggable-next"
import { CommonListItem } from "@/types"
import { computed } from "vue";
const toast = useToast()
const props = defineProps({
  condition: {
    type: Object,
    default: ()=>null
  },
  model: {
    type: String,
    required: true
  },
  flat: Boolean,
  hideToolBar: Boolean,
  hideSelectBtn: Boolean,
  title: String,
  headers: Array,
  itemNames: Array,
  visible: Boolean,
  selectedId: String,
  hideCreate: Boolean,
  showSelect: Boolean,
  cascade: Boolean,
  noData: {
    type: String,
    default: '没有数据'
  },
  interceptor: {
    type: Object,
    default: ()=>{
      return {
        save: () => Promise.resolve(true),
        delete: () => Promise.resolve(true)
      }
    }
  },
})

const item = ref<CommonListItem>()
const items = ref<Array<CommonListItem>>([])
const dialog = reactive({
  showDetail: false,
  showConfirm: false
})
const selected = ref<Array<CommonListItem>>([])
const drag = ref(false)

defineComponent(draggable)

const emit = defineEmits<{
  (event: 'selectionChange', selected: Array<CommonListItem>): void,
  (event:'change'): void,
  (event:'close'): void,
}>()

// watch
watch(
  () => props.visible,
  (val) => {
    if (val) {
      props.visible && props.condition && window.commonService.find(props.model, props.condition).then(data => {
        items.value = data
        selected.value = props.selectedId ? items.value.filter(item => item.id == props.selectedId) : []
      }).catch((err) => {
        console.log(err)
        toast.error(`${props.title}读取失败！`);
      })
    }
  },
  { immediate: true }
)

watch(
  () => props.condition,
  (newVal, oldVal) => {
    // =====TODO 待测试=====
    if (newVal === oldVal) return
    // =====================
    // if (!this.cascade) return
    console.log("condition", newVal, oldVal)
    selected.value = []
    if (newVal) {
      window.commonService.find(props.model, props.condition).then(data => {
        items.value = data
      }).catch(err => {
        console.log(err)
        toast.error(`${props.title}读取失败！`);
      })
    } else {
      items.value= []
    }
  },
  {
    deep: true
  }
)

watch(
  () => selected,
  (val) => emit('selectionChange', val.value)
)

const tableHeight = computed(
  () => {
    return '528px'
  }
)

// method
function createNewItem() {
  const rst: { pid?: string } = {}
  props.cascade && (rst.pid = props.condition.pid)
  return rst
}

function onDragRow() {
  drag.value = true
}

function onDropRow() {
  drag.value = false
  let targetArr: Array<CommonListItem> = []
  items.value.forEach((item, index) => {
    const oriOrdinal = index + 1
    if (oriOrdinal != item.ordinal) {
      item.ordinal = oriOrdinal
      item.sort = true
      targetArr.push(item)
    }
  })
  console.log('update range:', targetArr)
  targetArr.length > 0 && window.commonService.bulkSave(props.model, ...targetArr).then(()=>{
    window.commonService.find(props.model, props.condition).then(data => {
      items.value = data
    }).catch(err => {
      console.log(err)
    })
    emit('change')
    // this.$toast.success(`${this.title}更新成功！`)
  }).catch(err => {
    console.error(err)
    toast.error(`${props.title}更新失败！`)
  })
}

function onClose() {
  emit('close')
}

function showEdit(val: CommonListItem) {
  item.value = val || createNewItem()
  dialog.showDetail = true
}

// showConfirm(item) {
//   this.item = JSON.parse(JSON.stringify(item))
//   this.dialog.showConfirm = true
// },

function handleDelete(delItem: CommonListItem) {
  // this.item = JSON.parse(JSON.stringify(item))
  this.$dialog.confirm({
    text: `确定要删除${this.title}${delItem['name'] ? `：${delItem['name']}` : '' }？`
  }).then(res => {
    if (res) {
      const path = delItem.path
      const ordinal = delItem.ordinal
      delItem.delete = true
      let targetArr = [ delItem ]
      for (const e of this.items) {
        if (e.ordinal > ordinal) {
          const moveUpItem = {}
          for (const key in e) {
            moveUpItem[key] = key == 'ordinal' ? (e.ordinal - 1) : e[key]
          }
          moveUpItem.sort = true
          targetArr.push(moveUpItem)
        }
      }
      
      window.commonService.bulkSave(this.model, ...targetArr).then(()=>{
        // this.dialog.showDetail = false
        window.commonService.find(this.model, this.condition).then(data => {
          this.items = data
        })
        this.$emit('change')
        this.$toast.success(`${this.title}删除成功！`)
      }).catch(err => {
        console.error(err)
        this.$toast.error(`${this.title}删除失败！`)
      }).finally(() => {
        this.interceptor.delete(path)
        this.dialog.showConfirm = false
        this.item = null
      })
    }
  })
},
handleSave(item) {
  this.interceptor.save(item).then(preResult=>{
    for (const key in preResult) {
      item[key] && (item[key] = preResult[key])
    }
    window.commonService.save(this.model, item).then(()=>{
      this.dialog.showDetail = false
      window.commonService.find(this.model, this.condition).then(data => {
        this.items = data
      })
      this.$emit('change')
      this.$toast.success(`${this.title}保存成功！`)
    }).catch(err => {
      console.error(err)
      this.$toast.error(`${this.title}保存失败！`)
    })
  })
},
handleSelect() {
  this.selected.length != 0 && this.$emit('select', this.selected[0].id)
},
handleCancel() {
  this.dialog.showDetail = false
}
</script>

<style scoped>
:deep(.v-data-table__wrapper > table > tbody > tr:hover:not(.v-data-table__expanded__content):not(.v-data-table__empty-wrapper) .rearrange:enabled) {
  color: var(--v-accent-base) !important;
}
:deep(.v-data-table__wrapper > table > tbody > tr:not(.v-data-table__expanded__content):not(.v-data-table__empty-wrapper) .rearrange:enabled) {
  color: var(--color, transparent) !important;
}
:deep(.v-data-table__wrapper > table > tbody > tr:not(.v-data-table__expanded__content):not(.v-data-table__empty-wrapper) .rearrange:disabled) {
  color: var(--color, transparent) !important;
}
:deep(.v-data-table__wrapper > table > tbody > tr:hover:not(.v-data-table__expanded__content):not(.v-data-table__empty-wrapper) .rearrange:hover:enabled) {
  color: var(--v-primary-base) !important;
}
:deep(.v-data-table__wrapper > table > tbody > tr:hover:not(.v-data-table__expanded__content):not(.v-data-table__empty-wrapper) .divider) {
  border-color: var(--v-secondary-lighten5) !important;
}
:deep(.v-data-table__wrapper > table > tbody > tr:not(.v-data-table__expanded__content):not(.v-data-table__empty-wrapper) .divider) {
  border-color: var(--color, transparent) !important;
}
:deep(.v-data-table__wrapper > table > tbody > tr:hover:not(.v-data-table__expanded__content):not(.v-data-table__empty-wrapper) .edit) {
  color: var(--v-primary-lighten2) !important;
}
:deep(.v-data-table__wrapper > table > tbody > tr:not(.v-data-table__expanded__content):not(.v-data-table__empty-wrapper) .edit) {
  color: var(--color, transparent) !important;
}
:deep(.v-data-table__wrapper > table > tbody > tr:hover:not(.v-data-table__expanded__content):not(.v-data-table__empty-wrapper) .edit:hover) {
  color: var(--v-primary-base) !important;
}
:deep(.v-data-table__wrapper > table > tbody > tr:hover:not(.v-data-table__expanded__content):not(.v-data-table__empty-wrapper) .delete) {
  color: var(--v-error-lighten2) !important;
}
:deep(.v-data-table__wrapper > table > tbody > tr:not(.v-data-table__expanded__content):not(.v-data-table__empty-wrapper) .delete) {
  color: var(--color, transparent) !important;
}
:deep(.v-data-table__wrapper > table > tbody > tr:hover:not(.v-data-table__expanded__content):not(.v-data-table__empty-wrapper) .delete:hover) {
  color: var(--v-error-base) !important;
}
:deep(.v-data-table__wrapper > table > tbody > tr:hover:not(.v-data-table__expanded__content):not(.v-data-table__empty-wrapper) .actions) {
  color: var(--v-error-lighten2) !important;
}
:deep(.v-data-table__wrapper > table > tbody > tr:not(.v-data-table__expanded__content):not(.v-data-table__empty-wrapper) .actions) {
  color: var(--color, transparent) !important;
}
</style>