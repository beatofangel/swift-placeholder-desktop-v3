// Components
import VCheckboxBtn from "vuetify/components/VCheckbox";
import VDivider from "vuetify/components/VDivider";
import {
  VList,
  VListItem,
  VListItemGroup,
  VListItemAction,
  VListItemIcon,
  VListItemContent,
  VListItemTitle,
  VListSubheader
} from "vuetify/components/VList"; // Directives

import ripple from "vuetify/lib/directives/ripple"; // Mixins

import Colorable from "vuetify/lib/mixins/colorable";
import Themeable from "vuetify/lib/mixins/themeable"; // Helpers

import { escapeHTML, getPropertyFromItem } from "vuetify/lib/util/helpers"; // Types

import mixins from "vuetify/lib/util/mixins";
import { VIcon } from "vuetify/lib/components";
/* @vue/component */

export default mixins(Colorable, Themeable).extend({
  name: "v-cascade-select-list",
  // https://github.com/vuejs/vue/issues/6872
  directives: {
    ripple,
  },
  props: {
    level: Number,
    action: Boolean,
    dense: Boolean,
    hideSelected: Boolean,
    items: {
      type: Array,
      default: () => [],
    },
    itemDisabled: {
      type: [String, Array, Function],
      default: "disabled",
    },
    itemText: {
      type: [String, Array, Function],
      default: "text",
    },
    itemValue: {
      type: [String, Array, Function],
      default: "value",
    },
    noDataText: String,
    noFilter: Boolean,
    searchInput: null,
    selectedIndex: {
      type: Array,
      default: () => [],
    },
    selectedItems: {
      type: Array,
      default: () => [],
    },
    maxHeight: Number,
    isMenuActive: Boolean,
    defaultItemCount: Number,
    scrollOffset: [Number, String],
  },
  mounted() {
    if (this.isMenuActive) {
      console.log('list mounted')
      if (this.items.length <= this.defaultItemCount) {
        this.$emit('update:scroll-top', true)
        this.$emit('update:scroll-bottom', true)
      } else {
        if (this.$el.scrollTop == 0) {
          this.$emit('update:scroll-top', true)
          this.$emit('update:scroll-bottom', false)
        } else {
          this.$emit('update:scroll-top', false)
          this.$emit('update:scroll-bottom', false)
        }
      }
    }
  },
  watch: {
    isMenuActive: {
      immediate: true,
      handler(val) {
        if (val) {
          setTimeout(() => {
            if (!this.$el) {
              console.log('isMenuActive watch: element not ready')
              return
            }
            if (this.items.length > this.defaultItemCount) {
              const selectedDom = this.$el.querySelector('div.v-list-item--active')
              if (selectedDom) {
                const target = Number(selectedDom.ariaRowIndex) * 48 + 48
                console.log('scroll to', target, this.scrollOffset)
                this.$vuetify.goTo(target, { container: `.auto-hide-scrollbar-${this.level}`, easing: 'easeInOutCubic', offset: this.scrollOffset })
              }
            }
            // selectedDom && this.$nextTick(() => selectedDom.scrollIntoView()) // TODO 使用({ behavior: "smooth" }))后滚动失效
            // if (this.$el.scrollTop == 0) {
            //   this.$emit('update:scroll-top', true)
            // }
            // if (this.$el.scrollHeight <= 48 * 5) {
            //   this.$emit('update:scroll-top', true)
            //   this.$emit('update:scroll-bottom', true)
            // } else {
            //   if (this.$el.scrollTop == 0) {
            //     this.$emit('update:scroll-top', true)
            //     this.$emit('update:scroll-bottom', false)
            //   } else {
            //     this.$emit('update:scroll-top', false)
            //     this.$emit('update:scroll-bottom', false)
            //   }
            // }
          }, 200);
        }
      }
    },
    items: {
      deep: true,
      // immediate: true,
      handler() {
        // if (this.isMenuActive) {
          if (this.items.length <= this.defaultItemCount) {
            this.$emit('update:scroll-top', true)
            this.$emit('update:scroll-bottom', true)
          } else {
            if (this.$el.scrollTop == 0) {
              this.$emit('update:scroll-top', true)
              this.$emit('update:scroll-bottom', false)
            } else {
              this.$emit('update:scroll-top', false)
              this.$emit('update:scroll-bottom', false)
            }
          }
        // }
      }
    }
  },
  computed: {
    parsedItems() {
      return this.selectedItems.map((item) => this.getValue(item));
    },

    tileActiveClass() {
      return Object.keys(this.setTextColor(this.color).class || {}).join(" ");
    },

    staticNoDataTile() {
      const tile = {
        attrs: {
          role: undefined,
        },
        on: {
          mousedown: (e) => e.preventDefault(), // Prevent onBlur from being called
        },
      };
      return this.$createElement(VListItem, tile, [
        this.genTileContent(this.noDataText),
      ]);
    },
  },
  methods: {
    genAction(item, inputValue) {
      return this.$createElement(VListItemAction, [
        this.$createElement(VCheckboxBtn, {
          props: {
            color: this.color,
            value: inputValue,
            ripple: false,
          },
          on: {
            input: () => this.$emit("select", item, this.level),
          },
        }),
      ]);
    },

    genDivider(props) {
      return this.$createElement(VDivider, {
        props,
      });
    },

    // genFilteredText(text) {
    //   text = text || "";
    //   if (!this.searchInput || this.noFilter) return escapeHTML(text);
    //   const { start, middle, end } = this.getMaskedCharacters(text);
    //   return `${escapeHTML(start)}${this.genHighlight(middle)}${escapeHTML(
    //     end
    //   )}`;
    // },

    genHeader(props) {
      return this.$createElement(
        VListSubheader,
        {
          props,
        },
        props.header
      );
    },

    // genHighlight(text) {
    //   return `<span class="v-list-item__mask">${escapeHTML(text)}</span>`;
    // },

    // getMaskedCharacters(text) {
    //   const searchInput = (this.searchInput || "")
    //     .toString()
    //     .toLocaleLowerCase();
    //   const index = text.toLocaleLowerCase().indexOf(searchInput);
    //   if (index < 0)
    //     return {
    //       start: text,
    //       middle: "",
    //       end: "",
    //     };
    //   const start = text.slice(0, index);
    //   const middle = text.slice(index, index + searchInput.length);
    //   const end = text.slice(index + searchInput.length);
    //   return {
    //     start,
    //     middle,
    //     end,
    //   };
    // },

    genTile({ item, index, disabled = null, value = false }) {
      if (!value) value = this.hasItem(item);

      if (item === Object(item)) {
        disabled = disabled !== null ? disabled : this.getDisabled(item);
      }

      const tile = {
        attrs: {
          // Default behavior in list does not
          // contain aria-selected by default
          "aria-selected": String(value),
          "aria-rowindex": index,
          id: `list-item-${this._uid}-${index}`,
          role: "option",
        },
        on: {
          mousedown: (e) => {
            // Prevent onBlur from being called
            e.preventDefault();
          },
          click: () => disabled || this.$emit("select", item, index, this.level),
        },
        props: {
          activeClass: this.tileActiveClass,
          disabled,
          ripple: true,
          inputValue: value,
        },
      };

      if (!this.$scopedSlots.item) {
        return this.$createElement(VListItem, tile, [
          this.action && !this.hideSelected && this.items.length > 0
            ? this.genAction(item, value)
            : null,
          item.icon ? this.$createElement(VListItemIcon, { class: {'my-0': true, 'py-3': true } }, [this.$createElement(VIcon, item.icon)]) : null,
          this.genTileContent(item, index),
          item.children ? this.$createElement(VListItemIcon, { class: {'my-0': true, 'py-3': true } }, [this.$createElement(VIcon, 'mdi-chevron-right')]) : null,
        ]);
      }

      const parent = this;
      const scopedSlot = this.$scopedSlots.item({
        parent,
        item,
        attrs: {
          ...tile.attrs,
          ...tile.props,
        },
        on: tile.on,
      });
      return this.needsTile(scopedSlot)
        ? this.$createElement(VListItem, tile, scopedSlot)
        : scopedSlot;
    },
    /*eslint no-unused-vars: "off"*/
    genTileContent(item, index = -1) {
      const innerHTML = index == -1 ? this.getText(item) : `${item.ordinal} - ${this.getText(item)}`
      // const innerHTML = this.genFilteredText(this.getText(item));
      // const children = []
      // item.children && children.push(this.$createElement(VSpacer), this.$createElement(VIcon, { domProps: 'mdi-chevron-right' }))
      return this.$createElement(VListItemContent, [
        this.$createElement(VListItemTitle, {
          domProps: {
            innerHTML,
          },
        }),
      ]);
    },

    hasItem(item) {
      return this.parsedItems.indexOf(this.getValue(item)) > -1;
    },

    needsTile(slot) {
      return (
        slot.length !== 1 ||
        slot[0].componentOptions == null ||
        slot[0].componentOptions.Ctor.options.name !== "v-list-item"
      );
    },

    getDisabled(item) {
      return Boolean(getPropertyFromItem(item, this.itemDisabled, false));
    },

    getText(item) {
      return String(getPropertyFromItem(item, this.itemText, item));
    },

    getValue(item) {
      return getPropertyFromItem(item, this.itemValue, this.getText(item));
    },
  },

  render() {
    const children = [];
    const itemsLength = this.items.length;

    for (let index = 0; index < itemsLength; index++) {
      const item = this.items[index];
      if (this.hideSelected && this.hasItem(item)) continue;
      if (item == null)
        children.push(
          this.genTile({
            item,
            index,
          })
        );
      else if (item.header) children.push(this.genHeader(item));
      else if (item.divider) children.push(this.genDivider(item));
      else
        children.push(
          this.genTile({
            item,
            index,
          })
        );
    }

    const noData = children.length == 0
    children.length ||
      children.push(this.$slots["no-data"] || this.staticNoDataTile);
    this.$slots["prepend-item"] &&
      children.unshift(this.$slots["prepend-item"]);
    this.$slots["append-item"] && children.push(this.$slots["append-item"]);
    return this.$createElement(
      VList,
      {
        staticClass: "v-select-list",
        class: this.themeClasses,
        attrs: {
          role: "listbox",
          tabindex: -1,
        },
        props: {
          dense: this.dense,
        },
      },
      // children
      noData ? children : [ this.$createElement(VListItemGroup, { props: { value: this.selectedIndex[0] } }, children)]
    );
  },
});