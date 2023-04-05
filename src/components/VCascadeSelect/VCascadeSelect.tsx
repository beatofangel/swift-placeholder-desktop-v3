import { computed, withDirectives, mergeProps, ref } from 'vue'
// @ts-ignore
import { deepEqual, genericComponent, omit, propsFactory, useRender, wrapInArray } from 'vuetify/lib/util/index.mjs'

// @ts-ignore
import { forwardRefs } from 'vuetify/lib/composables/forwardRefs.mjs'
// @ts-ignore
import { IconValue } from 'vuetify/lib/composables/icons.mjs'
// @ts-ignore
import { makeItemsProps, useItems } from 'vuetify/lib/composables/items.mjs'
// @ts-ignore
import { makeTransitionProps } from 'vuetify/lib/composables/transition.mjs'
// @ts-ignore
import { useForm } from 'vuetify/lib/composables/form.mjs'
// @ts-ignore
import { useLocale } from 'vuetify/lib/composables/locale.mjs'
// @ts-ignore
import { useProxiedModel } from 'vuetify/lib/composables/proxiedModel.mjs'

// Styles
import "vuetify/lib/components/VTextField/VTextField.sass"
import "vuetify/lib/components/VSelect/VSelect.sass" // Components
import "./VCascadeSelect.css"

// Directives
// @ts-ignore
import { Scroll } from 'vuetify/lib/directives/scroll/index.mjs'

// Service
// @ts-ignore
import goTo from 'vuetify/lib/services/goto/index.mjs'

// @ts-ignore
import { makeVTextFieldProps } from 'vuetify/lib/components/VTextField/VTextField.mjs'
import { VDialogTransition } from 'vuetify/lib/components/transitions/index'
import { VList, VListItem } from 'vuetify/lib/components/VList/index'
import { VChip } from 'vuetify/lib/components/VChip/index'
import { VMenu } from 'vuetify/lib/components/VMenu/index'
import { VTextField } from 'vuetify/lib/components/VTextField/index'
import { VCheckboxBtn } from 'vuetify/lib/components/VCheckbox/index'
import { VDefaultsProvider } from 'vuetify/lib/components/VDefaultsProvider/index'
import { VCard, VCardText } from 'vuetify/lib/components/VCard/index'
import { VRow, VCol } from 'vuetify/lib/components/VGrid/index'
import { VBtn } from 'vuetify/lib/components/VBtn/index'
import { VIcon } from 'vuetify/lib/components/VIcon/index'
// import VCascadeSelectList from "./VCascadeSelectList"; // Extensions

// @ts-ignore
import type { MakeSlots, SlotsToProps } from 'vuetify/lib/util/index.mjs'
// @ts-ignore
import type { VInputSlots } from 'vuetify/lib/components/VInput/VInput.mjs'
// @ts-ignore
import type { VFieldSlots } from 'vuetify/lib/components/VField/VField.mjs'
// @ts-ignore
// import type { InternalItem } from 'vuetify/lib/composables/items.mjs'
import type { PropType } from 'vue'
interface InternalItem<T = any> {
  title: string
  value: any
  props: {
    [key: string]: any
    title: string
    value: any
  }
  children?: InternalItem<T>[]
  raw: T
}

export const defaultMenuProps = {
  closeOnClick: false,
  closeOnContentClick: false,
  disableKeys: true,
  openOnClick: false,
  maxHeight: 296, //304,
  listHeaderMaxHeight: 24,
}

export const makeSelectProps = propsFactory({
  chips: Boolean,
  closableChips: Boolean, // TODO disabled
  eager: Boolean,
  hideNoData: Boolean,
  hideSelected: Boolean,
  menu: Boolean,
  menuIcon: {
    type: IconValue,
    default: '$dropdown',
  },
  menuProps: {
    type: Object as PropType<VMenu['$props']>,
    // default: () => defaultMenuProps,
  },
  multiple: Boolean, // TODO disabled
  noDataText: {
    type: String,
    default: '$vuetify.noDataText',
  },
  openOnClear: Boolean,
  valueComparator: {
    type: Function as PropType<typeof deepEqual>,
    default: deepEqual,
  },
  colors: {
    type: Array<String>,
    default: ["primary", "light-green", "orange", "pink", "cyan", "blue-grey"],
  },
  scrollOffset: {
    type: [ Number, String ],
    default: 0
  },
  // ...makeItemsProps({ itemChildren: false }),
  ...makeItemsProps(),
}, 'v-cascade-select')

type Primitive = string | number | boolean | symbol

type Val<T, ReturnObject extends boolean> = T extends Primitive
  ? T
  : (ReturnObject extends true ? T : any)

type Value<T, ReturnObject extends boolean, Multiple extends boolean> =
  Multiple extends true
  ? readonly Val<T, ReturnObject>[]
  : Val<T, ReturnObject>

export const VCascadeSelect = genericComponent<new <
  T,
  ReturnObject extends boolean = false,
  Multiple extends boolean = false,
  V extends Value<T, ReturnObject, Multiple> = Value<T, ReturnObject, Multiple>
>() => {
  $props: {
    items?: readonly T[]
    returnObject?: ReturnObject
    multiple?: Multiple
    modelValue?: V
    'onUpdate:modelValue'?: (val: V) => void
  } & SlotsToProps<
    Omit<VInputSlots & VFieldSlots, 'default'> & MakeSlots<{
      item: [{ item: InternalItem<T>, index: number, props: Record<string, unknown> }]
      chip: [{ item: InternalItem<T>, index: number, props: Record<string, unknown> }]
      selection: [{ item: InternalItem<T>, index: number }]
      'prepend-item': []
      'append-item': []
      'no-data': []
    }>
  >
}>()({
  name: 'VCascadeSelect',
  props: {
    ...makeSelectProps(),
    ...omit(makeVTextFieldProps({
      modelValue: null,
    }), ['validationValue', 'dirty', 'appendInnerIcon']),
    ...makeTransitionProps({ transition: { component: VDialogTransition } }),
  },
  emits: {
    'update:modelValue': (val: any) => true,
    'update:menu': (val: boolean) => true,
  },
  setup (props: any, { slots }: { slots: any }) {
    const { t } = useLocale()
    const vTextFieldRef = ref()
    const vMenuRef = ref<VMenu>()
    const _menu = useProxiedModel(props, 'menu')
    const menu = computed({
      get: () => _menu.value,
      set: v => {
        if (_menu.value && !v && vMenuRef.value?.ΨopenChildren) return
        _menu.value = v
      },
    })
    const { items, transformIn, transformOut } = useItems(props)
    const model = useProxiedModel(
      props,
      'modelValue',
      [],
      (v: any) => transformIn(wrapInArray(v)),
      (v: any) => {
        const transformed = transformOut(v)
        return props.multiple ? transformed : (transformed[0] ?? null)
      }
    )
    const form = useForm()
    // TODO 需要修改选中项
    // const selections = computed(() => {
    //   return model.value.map((v: any) => {
    //     return items.value.find((item: { value: any }) => props.valueComparator(item.value, v.value)) || v
    //   })
    // })
    // const selected = computed(() => selections.value.map((selection: { props: { value: any } }) => selection.props.value))

    // const displayItems = computed(() => {
    //   if (props.hideSelected) {
    //     return items.value.filter((item: any) => !selections.value.some((s: any) => s === item))
    //   }
    //   return items.value
    // })
    // =========================================
    // watch(model, (val) => {
    //   console.log('on model changed', val.value)
    // })
    console.log(items)
    const cascadeSelections = computed(() => {
      const path: number[] = []
      const cascadeSelections: InternalItem[][] = []
      const findPath = (obj: InternalItem[] | undefined, level: number): Boolean => {
        if (obj && Array.isArray(obj)) {
          for (let i = 0; i < obj.length; i++) {
            path.push(i);
            cascadeSelections.push([obj[i]])
            if (model.value.length > 0 && obj[i].value == model.value[0].value) {
              return true;
            } else {
              if (obj[i].children) {
                if (findPath(obj[i].children, level + 1)) {
                  return true;
                } else {
                  path.pop();
                  cascadeSelections.pop()
                }
              } else {
                path.pop();
                cascadeSelections.pop()
              }
            }
          }
        }
        return false;
      };

      findPath(items.value, 1)

      console.log(cascadeSelections)

      return cascadeSelections
    })
    const cascadeSelected = computed(() => {
      return cascadeSelections.value.map((selection) => [selection[0].value])
    })
    console.log("cascadeSelected", cascadeSelected.value)
    const cascadeDisplayItems = computed(() => {
      const cascadeDisplayItems: InternalItem[][] = []
      // cascadeDisplayItems.push(items.value)
      const findPath = (obj: InternalItem[] | undefined, level: number): Boolean => {
        if (obj && Array.isArray(obj)) {
          for (let i = 0; i < obj.length; i++) {
            cascadeDisplayItems.push(obj);
            if (model.value.length > 0 && obj[i].value == model.value[0].value) {
              return true;
            } else {
              if (obj[i].children) {
                if (findPath(obj[i].children, level + 1)) {
                  return true;
                } else {
                  cascadeDisplayItems.pop();
                }
              } else {
                cascadeDisplayItems.pop();
              }
            }
          }
        }
        return false;
      };

      if (model.value.length > 0) {
        findPath(items.value, 1)
        const nextLevelItems = cascadeDisplayItems.at(-1)?.find(item=>item.value == model.value[0].value)?.children
        nextLevelItems && cascadeDisplayItems.push(nextLevelItems)
      } else {
        cascadeDisplayItems.push(items.value)
      }

      return cascadeDisplayItems
    })
    console.log("cascadeDisplayItems", cascadeDisplayItems.value)
    // =========================================

    const listRef = ref<VList>()

    function onClear (e: MouseEvent) {
      if (props.openOnClear) {
        menu.value = true
      }
    }
    function onMousedownControl () {
      if (
        (props.hideNoData && !items.value.length) ||
        props.readonly || form?.isReadonly.value
      ) return

      menu.value = !menu.value
    }
    function onKeydown (e: KeyboardEvent) {
      if (props.readonly || form?.isReadonly.value) return

      if (['Enter', ' ', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
        e.preventDefault()
      }

      if (['Enter', 'ArrowDown', ' '].includes(e.key)) {
        menu.value = true
      }

      if (['Escape', 'Tab'].includes(e.key)) {
        menu.value = false
      }

      if (e.key === 'ArrowDown') {
        listRef.value?.focus('next')
      } else if (e.key === 'ArrowUp') {
        listRef.value?.focus('prev')
      } else if (e.key === 'Home') {
        listRef.value?.focus('first')
      } else if (e.key === 'End') {
        listRef.value?.focus('last')
      }
    }
    // ===================================
    function cascadeSelect (item: InternalItem, index: number = -1) {
      const fallback: InternalItem[] = []
      if (model.value.length > 0 && model.value[0].value === item.value) {
        cascadeSelections.value.forEach((e, i) => {
          if (e.length > 0 && e[0].value === item.value) {
            i > 0 && fallback.push(...cascadeSelections.value[i - 1])
          }
        })
        model.value = fallback
      } else {
        model.value = [item]
      }
      // model.value = [item]
      
      // menu.value = false
      console.log('cascadeSelect', model.value)
    }
    // ===================================
    // function select (item: InternalItem) {
    //   if (props.multiple) {
    //     const index = selected.value.findIndex((selection: any) => props.valueComparator(selection, item.value))

    //     if (index === -1) {
    //       model.value = [...model.value, item]
    //     } else {
    //       const value = [...model.value]
    //       value.splice(index, 1)
    //       model.value = value
    //     }
    //   } else {
    //     model.value = [item]
    //     menu.value = false
    //   }
    // }
    function onBlur (e: FocusEvent) {
      if (!listRef.value?.$el.contains(e.relatedTarget as HTMLElement)) {
        menu.value = false
      }
    }
    function onFocusout (e: FocusEvent) {
      if (e.relatedTarget == null) {
        vTextFieldRef.value?.focus()
      }
    }
    // ===================================
    // TODO goto尚未确定是否在vuetify3中实现
    function listScroll(container: string, up: boolean) {
      const current = (document.querySelector(container) as HTMLElement).scrollTop;
      const target = current + 48 + (up ? -48 * 3 : 48 * 3);
      
      window.scrollBy({
        top: target,
        left: 0,
        behavior:'smooth'
      })
      // goTo(target, {
      //   container: container,
      //   easing: "easeInOutCubic",
      //   offset: props.scrollOffset,
      // });
    }
    function listScrollUp(container: string) {
      listScroll(container, true);
    }
    function listScrollDown(container: string) {
      listScroll(container, false);
    }
    function updateScrollTop (level: number, top: boolean) {
      scrollTop.value[level] = top
    }
    function updateScrollBottom (level: number, bottom: boolean) {
      scrollBottom.value[level] = bottom
    }
    /* 深度 */
    const depth = computed(() => {
      const hasChildren = (item: InternalItem) => item.children ? item.children.length > 0 : false
      const depthArray: number[] = []
      const calcDepth = (item: InternalItem, currentDepth: number) => {
        if (item && hasChildren(item)) {
          const nextDepth = currentDepth + 1
          for (const child of item.children!) {
            calcDepth(child, nextDepth)
          }
        } else {
          depthArray.push(currentDepth)
        }
      }
      items.value.forEach((item: InternalItem) => {
        calcDepth(item, 1)
      })
      return Math.max(...depthArray)
    })
    const scrollTop = ref(new Array<boolean>)
    const scrollBottom = ref(new Array<boolean>)
    if (depth.value != -Infinity) {
      scrollTop.value = new Array<boolean>(depth.value).fill(true)
      scrollBottom.value = new Array<boolean>(depth.value).fill(true)
    }
    // ===================================

    useRender(() => {
      const hasChips = !!(props.chips || slots.chip)
      const hasList = !!((!props.hideNoData || cascadeDisplayItems.value.at(-1)?.length) || slots.prepend || slots.append || slots['no-data'])
      // const hasList = !!((!props.hideNoData || displayItems.value.length) || slots.prepend || slots.append || slots['no-data'])
      const [textFieldProps] = VTextField.filterProps(props)
      const cardList: JSX.Element[] = []
      const colPattern = (depth: number) => {
        return Math.floor(12 / depth)
      }
      for (let i = 0; i< cascadeDisplayItems.value.length; i++) {
        cardList.push(
          <VCol cols={ colPattern(depth.value) }>
            <VCard
              style={[{ 'display': 'flex' }, { 'flex-direction': 'column' }]}
              class={[ 'py-1', 'mx-1' ]}
              maxHeight={ defaultMenuProps.maxHeight }
              flat
              rounded='0'
            >
              <VRow
                style={[{ maxHeight: defaultMenuProps.listHeaderMaxHeight }]}
                class={[ 'ma-0' ]}
                noGutters
              >
                <VCol
                  class={[ 'pa-0', 'd-flex', 'justify-start' ]}
                  cols='4'
                ></VCol>
                <VCol
                  class={[ 'pa-0', 'd-flex', 'justify-center' ]}
                  cols='4'
                >
                  <VBtn
                    style={[{ maxHeight: defaultMenuProps.listHeaderMaxHeight }]}
                    variant='text'
                    disabled={ scrollTop.value[i] }
                    // @ts-ignore
                    onClick={ () => listScrollUp(`.auto-hide-scrollbar-${i}`) }
                  >
                    <VIcon
                      class={[ 'no-bg-color-icon' ]}
                    >{ scrollTop.value[i] ? 'mdi-blank' : 'mdi-chevron-up' }</VIcon>
                  </VBtn>
                </VCol>
                <VCol
                  class={[ 'pa-0', 'd-flex', 'justify-end' ]}
                  cols='4'
                ></VCol>
              </VRow>
              {
                withDirectives(
                  <VCardText
                    class={[ 'pa-0', {'auto-hide-scrollbar': !( scrollTop.value[i] && scrollBottom.value[i] )}, `auto-hide-scrollbar-${i}`, 'overflow-y-auto', 'flex-grow-1' ]}
                  >
                    <VList
                      ref={ listRef }
                      selected={ cascadeSelected.value[i] }
                      selectStrategy={ props.multiple ? 'independent' : 'single-independent' }
                      density='compact'
                      // @ts-ignore
                      onMousedown={ (e: MouseEvent) => e.preventDefault() }
                      onFocusout={ onFocusout }
                    >
                      { !cascadeDisplayItems.value[i].length && !props.hideNoData && (slots['no-data']?.() ?? (
                        <VListItem title={ t(props.noDataText) } />
                      ))}

                      { slots['prepend-item']?.() }

                      { cascadeDisplayItems.value[i].map((item: any, index: any) => {
                        if (slots.item) {
                          return slots.item?.({
                            item,
                            index,
                            props: mergeProps(item.props, { onClick: () => cascadeSelect(item, i) }),
                          })
                        }

                        return (
                          <VListItem
                            key={ index }
                            color={ props.colors[i] }
                            { ...item.props }
                            // disabled={ cascadeSelections.value.length > i && cascadeSelections.value[i].length > 0 && item.value === cascadeSelections.value[i][0].value }
                            onClick={ () => cascadeSelect(item, i) }
                          >
                            {{
                              // prepend: ({ isSelected }) => props.multiple && !props.hideSelected ? (
                              //   <VCheckboxBtn modelValue={ isSelected } ripple={ false } />
                              // ) : undefined,
                              prepend: () => (
                                <VIcon>{ item.raw.icon || 'mdi-blank' }</VIcon>
                              ),
                              append: () => item.children ? (
                                <VIcon>mdi-chevron-right</VIcon>
                              ) : undefined,
                            }}
                          </VListItem>
                        )
                      })}

                      { slots['append-item']?.() }
                    </VList>
                  </VCardText>,
                  [[
                    Scroll,
                    (e: Event) => {
                      const elem = e.target as HTMLElement
                      if (elem.scrollTop == 0) {
                        updateScrollTop(i, true)
                      } else if (elem.scrollTop == elem.children[0].clientHeight - elem.clientHeight) {
                        updateScrollBottom(i, true)
                      } else {
                        updateScrollTop(i, false)
                        updateScrollBottom(i, false)
                      }
                    },
                    '',
                    { self: true } ]]
                )
              }
              <VRow
                style={[{ maxHeight: defaultMenuProps.listHeaderMaxHeight }]}
                class={[ 'ma-0' ]}
                noGutters
              >
                <VCol
                  class={[ 'pa-0', 'd-flex', 'justify-start' ]}
                  cols='4'
                ></VCol>
                <VCol
                  class={[ 'pa-0', 'd-flex', 'justify-center' ]}
                  cols='4'
                >
                  <VBtn
                    style={[{ maxHeight: defaultMenuProps.listHeaderMaxHeight }]}
                    variant='text'
                    disabled={ scrollBottom.value[i] }
                    // @ts-ignore
                    onClick={ () => listScrollDown(`.auto-hide-scrollbar-${i}`) }
                  >
                    <VIcon
                      class={[ 'no-bg-color-icon' ]}
                    >{ scrollBottom.value[i] ? 'mdi-blank' : 'mdi-chevron-down' }</VIcon>
                  </VBtn>
                </VCol>
                <VCol
                  class={[ 'pa-0', 'd-flex', 'justify-end' ]}
                  cols='4'
                ></VCol>
              </VRow>
            </VCard>
          </VCol>
        )
      }

      return (
        <VTextField
          ref={ vTextFieldRef }
          { ...textFieldProps }
          modelValue={ model.value.map((v: { props: { value: any } }) => v.props.value).join(', ') }
          onUpdate:modelValue={ v => { if (v == null) model.value = [] } }
          validationValue={ model.externalValue }
          dirty={ model.value.length > 0 }
          class={[
            'v-select',
            {
              'v-select--active-menu': menu.value,
              'v-select--chips': !!props.chips,
              [`v-select--${props.multiple ? 'multiple' : 'single'}`]: true,
              'v-select--selected': model.value.length,
            },
          ]}
          appendInnerIcon={ props.menuIcon }
          readonly
          onClick:clear={ onClear }
          onMousedown:control={ onMousedownControl }
          // @ts-ignore
          onBlur={ onBlur }
          onKeydown={ onKeydown }
        >
          {{
            ...slots,
            default: () => (
              <>
                <VMenu
                  ref={ vMenuRef }
                  v-model={ menu.value }
                  activator="parent"
                  contentClass="v-select__content"
                  eager={ props.eager }
                  maxHeight={ 310 }
                  openOnClick={ false }
                  closeOnContentClick={ false }
                  transition={ props.transition }
                  { ...props.menuProps }
                >
                  { hasList && (
                    <VCard
                      maxHeight={ defaultMenuProps.maxHeight }
                      variant='flat'
                    >
                      <VCardText
                        class={[ 'd-flex', 'flex-nowrap', 'py-0', 'pl-0', 'pr-5' ]}
                      >
                        <VRow noGutters>
                          { ...cardList }
                        </VRow>
                      </VCardText>
                    </VCard>
                  )}
                </VMenu>

                { cascadeSelections.value.map((items: any, index: any) => {
                  const item = items[0]
                  // function onChipClose (e: Event) {
                  //   e.stopPropagation()
                  //   e.preventDefault()

                  //   cascadeSelect(item)
                  // }

                  const slotProps = {
                    // 'onClick:close': onChipClose,
                    modelValue: true,
                    'onUpdate:modelValue': undefined,
                  }

                  return (
                    <div key={ item.value } class="v-select__selection">
                      { hasChips ? (
                        !slots.chip ? (
                          <>
                            { index != 0 && <VIcon color='grey-darken-1'>mdi-chevron-right</VIcon> }
                            <VChip
                              key="chip"
                              closable={ props.closableChips }
                              label
                              color={ props.colors[index] }
                              size="small"
                              text={ item.title }
                              { ...slotProps }
                            >
                              {{
                                prepend: () => (
                                  <VIcon start>{ item.raw.icon || 'mdi-blank' }</VIcon>
                                )
                              }}
                            </VChip>
                          </>
                        ) : (
                          <VDefaultsProvider
                            key="chip-defaults"
                            defaults={{
                              VChip: {
                                closable: props.closableChips,
                                size: 'small',
                                text: item.title,
                              },
                            }}
                          >
                            { slots.chip?.({ item, index, props: slotProps }) }
                          </VDefaultsProvider>
                        )
                      ) : (
                        slots.selection?.({ item, index }) ?? (
                          <span class="v-select__selection-text">
                            { item.title }
                            {/* { props.multiple && (index < selections.value.length - 1) && (
                              <span class="v-select__selection-comma">,</span>
                            )} */}
                          </span>
                        )
                      )}
                    </div>
                  )
                })}
              </>
            ),
          }}
        </VTextField>
      )
    })

    return forwardRefs({
      menu,
      cascadeSelect,
    }, vTextFieldRef)
  },
})

export type VCascadeSelect = InstanceType<typeof VCascadeSelect>