import { defineComponent, watch } from "vue";
import { VDialog } from "vuetify/lib/components/VDialog/index";
import {
  VCard,
  VCardText,
  VCardActions,
} from "vuetify/lib/components/VCard/index";
import { VBtn } from "vuetify/lib/components/VBtn/index";
import { VIcon } from "vuetify/lib/components/VIcon/index";
import { VToolbar, VToolbarTitle } from "vuetify/lib/components/VToolbar/index";
import { appName } from "@/Composables";
import { VHover } from "vuetify/lib/components/VHover/index";

import "./CommonDialog.css";
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
      default: false,
    },
    title: {
      type: String,
      default: appName,
    },
    text: String,
    info: Boolean,
    warning: Boolean,
    error: Boolean,
    cancelable: {
      type: Boolean,
      default: false,
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
      return this.info
        ? "mdi-information"
        : this.warning
        ? "mdi-alert"
        : this.error
        ? "mdi-cancel"
        : "mdi-blank";
    },
    iconColor(): string {
      return this.info
        ? "primary"
        : this.warning
        ? "orange-darken-2"
        : this.error
        ? "red"
        : "default";
    },
  },
  emits: {
    "update:modelValue": (val: boolean) => true,
    confirm: () => true,
    cancel: () => true,
  },
  methods: {
    onConfirm() {
      this.$emit("confirm");
      this.$emit("update:modelValue", false);
    },
    onCancel() {
      this.$emit("cancel");
      this.$emit("update:modelValue", false);
    },
  },
  mounted() {
    console.log('dialog mounted')
  },
  unmounted() {
    console.log('dialog unmounted')
  },
  setup(props, ctx) {
    watch(() => props.modelValue, (val) => {
      console.log('watch in dialog', val)
    })
  },
  render() {
    return (
      <VDialog
        v-model={this.$props.modelValue}
        width={this.$props.width}
        minWidth={this.$props.minWidth}
        persistent
        attach="#app"
      >
        <VCard>
          <VToolbar color="white" density="compact" class={["pl-4"]}>
            <VIcon icon={this.icon} color={this.iconColor} start></VIcon>
            <VToolbarTitle>{this.$props.title}</VToolbarTitle>
            <VHover>
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
            </VHover>
          </VToolbar>
          <VCardText>{this.$props.text}</VCardText>
          <VCardActions class={["justify-end"]}>
            {this.$props.cancelable && (
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
