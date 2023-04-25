import { defineComponent, ref } from "vue";
import { VDialog } from "vuetify/lib/components/VDialog/index";
import {
  VCard,
  VCardText,
  VCardActions,
} from "vuetify/lib/components/VCard/index";
import { VBtn } from "vuetify/lib/components/VBtn/index";
import { VIcon } from "vuetify/lib/components/VIcon/index";
import { VToolbar, VToolbarTitle } from "vuetify/lib/components/VToolbar/index";
import { appName } from "@/composables";
import { VHover } from "vuetify/lib/components/VHover/index";
import { isBoolean, isString } from "lodash";

import "./CommonDialog.css";

const validateAutoBoolean = (val: Boolean | String) => {
  return isString(val) && val == 'auto' || isBoolean(val)
}
export const CommonDialog = defineComponent({
  name: "CommonDialog",
  props: {
    width: {
      type: [Number, String],
      default: "auto",
    },
    minWidth: {
      type: [Number, String],
      default: "300",
    },
    modelValue: {
      type: Boolean,
      default: true,
    },
    attach: {
      type: [String, Boolean, Element],
      default: '#app'
    },
    title: {
      type: String,
      default: appName,
    },
    text: String,
    info: Boolean,
    warning: Boolean,
    error: Boolean,
    persistent: {
      type: [Boolean, String],
      default: 'auto',
      validator: validateAutoBoolean
    },
    closable: {
      type: [Boolean, String],
      default: 'auto',
      validator: validateAutoBoolean
    },
    cancelable: {
      type: [Boolean, String],
      default: 'auto',
      validator: validateAutoBoolean
    },
    cancelButtonText: {
      type: String,
      default: "取消",
    },
    okButtonText: {
      type: String,
      default: "确定",
    },
  },
  computed: {
    icon(): string {
      return this.dialogInfo
        ? "mdi-information"
        : this.dialogWarning
          ? "mdi-alert"
          : this.dialogError
            ? "mdi-information"
            : "mdi-blank";
    },
    iconColor(): string {
      return this.dialogInfo
        ? "primary"
        : this.dialogWarning
          ? "orange-darken-2"
          : this.dialogError
            ? "red"
            : "default";
    },
    dialogInfo(): boolean {
      if (this.info && (this.error || this.warning)) {
        console.warn('[info]属性设定无效')
      }
      return !this.error && !this.warning && this.info
    },
    dialogWarning(): boolean {
      if (this.warning && this.error) {
        console.warn('[warning]属性设定无效')
      }
      return !this.error && this.warning
    },
    dialogError(): boolean {
      return this.error
    },
    dialogCancelable(): boolean {
      return this.cancelable == 'auto' ? !this.dialogInfo : this.cancelable as boolean
    },
    dialogClosable(): boolean {
      return this.closable == 'auto' ? this.dialogInfo && !this.dialogCancelable : this.closable as boolean
    },
    dialogPersistent(): boolean {
      return this.persistent == 'auto' ? !this.dialogInfo || this.dialogCancelable : this.persistent as boolean
    }
  },
  emits: {
    "closed": () => true,
    "unmounted": () => true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    "update:modelValue": (val: boolean) => true,
    confirm: () => true,
    cancel: () => true,
  },
  methods: {
    onConfirm() {
      this.$emit("confirm");
      this.visible = false;
      this.$emit("update:modelValue", this.visible);
    },
    onCancel() {
      this.$emit("cancel");
      this.visible = false;
      this.$emit("update:modelValue", this.visible);
    },
    onDialogClosed() {
      console.log('onDialogClosed')
      this.$emit('closed')
    }
  },
  setup(props/* , ctx */) {
    const visible = ref(props.modelValue)
    return {
      visible
    }
  },
  render() {
    return (
      <VDialog
        v-model={this.visible}
        width={this.$props.width}
        minWidth={this.$props.minWidth}
        persistent={this.dialogPersistent}
        // @ts-ignore
        onAfterLeave={this.onDialogClosed}
        attach={this.$props.attach}
      >
        <VCard>
          <VToolbar color="white" density="compact" class={["pl-4", "d-flex"]}>
            <VIcon icon={this.icon} color={this.iconColor} start></VIcon>
            <VToolbarTitle>{this.$props.title}</VToolbarTitle>
            {this.dialogClosable && (<VHover>
              {{
                default: ({ isHovering, props }) => (
                  <VBtn
                    class={["v-btn--closable"]}
                    {...props}
                    ripple={false}
                    density="compact"
                    icon="mdi-close"
                    color={isHovering ? "red" : ""}
                    // @ts-ignore
                    onClick={this.onCancel}
                  ></VBtn>
                ),
              }}
            </VHover>)}
          </VToolbar>
          <VCardText>{this.$props.text}</VCardText>
          <VCardActions class={["justify-end"]}>
            {this.dialogCancelable && (
              <VBtn
                variant="text"
                // @ts-ignore
                onClick={this.onCancel}
              >
                {this.cancelButtonText}
              </VBtn>
            )}
            <VBtn
              variant="flat"
              color={this.iconColor}
              // @ts-ignore
              onClick={this.onConfirm}
            >
              {this.okButtonText}
            </VBtn>
          </VCardActions>
        </VCard>
      </VDialog>
    );
  },
});
