import { computed, withDirectives, mergeProps, ref, watch, Ref } from 'vue'
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
// @ts-ignore
import { Intersect } from 'vuetify/lib/directives/intersect/index.mjs'

// Service
// @ts-ignore
// import goTo from 'vuetify/lib/services/goto/index.mjs'

// @ts-ignore
import { makeVTextFieldProps } from 'vuetify/lib/components/VTextField/VTextField.mjs'
import { VDialogTransition } from 'vuetify/lib/components/transitions/index'
import { VList, VListItem } from 'vuetify/lib/components/VList/index'
import { VChip } from 'vuetify/lib/components/VChip/index'
import { VMenu } from 'vuetify/lib/components/VMenu/index'
import { VTextField } from 'vuetify/lib/components/VTextField/index'
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
  maxHeight: 304,
  listHeaderMaxHeight: 28,
  displayItemCount: 6
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
    // watch(menu, (val) => {
    //   console.log('on menu visible changed', val)
    //   if (val) {
    //     setTimeout(() => {
    //       for (let i = 0; i < cascadeDisplayItems.value.length; i++) {
    //         console.log (i)
    //         updateScrollTop(i, true)
    //       }
    //     }, 500);
    //     // nextTick(()=>{
    //     //   for (let i = 0; i < cascadeDisplayItems.value.length; i++) {
    //     //     console.log (i)
    //     //     updateScrollTop(i, true)
    //     //   }
    //     // })
    //   }
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

    // const listRef = ref<VList>()
    const listRefs = new Array<Ref>()

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
        // listRef.value?.focus('next')
        listRefs.length > 0 && listRefs[0].value?.focus('next')
      } else if (e.key === 'ArrowUp') {
        // listRef.value?.focus('prev')
        listRefs.length > 0 && listRefs[0].value?.focus('prev')
      } else if (e.key === 'Home') {
        // listRef.value?.focus('first')
        listRefs.length > 0 && listRefs[0].value?.focus('first')
      } else if (e.key === 'End') {
        // listRef.value?.focus('last')
        listRefs.length > 0 && listRefs[0].value?.focus('last')
      }
    }
    // ===================================
    function onScroll(elem: HTMLElement, i: number) {
      if (elem.scrollTop == 0) {
        updateScrollTop(i, true)
        updateScrollBottom(i, false)
      } else if (elem.scrollTop + 1 >= elem.children[0].clientHeight - elem.clientHeight) { // fix: scrollTop为小数的问题
        updateScrollTop(i, false)
        updateScrollBottom(i, true)
      } else {
        updateScrollTop(i, false)
        updateScrollBottom(i, false)
      }
    }
    function onListOpened(val: any) {
      console.log(val)
    }
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
      // for (const lstRef of listRefs) {
      //   if (!lstRef.value?.$el.contains(e.relatedTarget as HTMLElement)) {
      //     menu.value = false
      //     break
      //     // console.log('onBlur')
      //   }
      // }
      // if (!listRef.value?.$el.contains(e.relatedTarget as HTMLElement)) {
      //   menu.value = false
      // }
    }
    function onFocusout (e: FocusEvent) {
      if (e.relatedTarget == null) {
        vTextFieldRef.value?.focus()
      }
    }
    // ===================================
    // TODO goto尚未确定是否在vuetify3中实现
    function listScroll(container: string, offset: number) {
      const $container = document.querySelector(container) as HTMLElement
      // const current = $container.scrollTop;
      // const target = current + 48 + (up ? -48 * 3 : 48 * 3);
      // const offset = upOrDown ? -40 * 3 : 40 * 3;
      // console.log(current, offset)
      
      $container.scrollBy({
        top: offset,
        // left: 0,
        behavior:'smooth'
      })
      // goTo(target, {
      //   container: container,
      //   easing: "easeInOutCubic",
      //   offset: props.scrollOffset,
      // });
    }
    function listScrollUp(container: string) {
      listScroll(container, -40 * 3);
    }
    function listScrollDown(container: string) {
      listScroll(container, 40 * 3);
    }
    function updateScrollTop (level: number, top: boolean) {
      // top && console.log('updateScrollTop', level, (document.querySelector(`.auto-hide-scrollbar-${level}`) as HTMLElement)?.scrollTop)
      scrollTop.value[level] = top
    }
    function updateScrollBottom (level: number, bottom: boolean) {
      // bottom && console.log('updateScrollBottom', level, (document.querySelector(`.auto-hide-scrollbar-${level}`) as HTMLElement)?.scrollTop)
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
      listRefs.splice(0)
      // const isScrollTop = (i: number) => {
      //   const scrollTop = (document.querySelector(`.auto-hide-scrollbar-${i}`) as HTMLElement)?.scrollTop
      //   // console.log ('isScrollTop:', scrollTop)
      //   return scrollTop == 0
      // }
      // const isScrollBottom = (i: number) => {
      //   const scrollTop = (document.querySelector(`.auto-hide-scrollbar-${i}`) as HTMLElement)?.scrollTop
      //   // console.log ('isScrollBottom:', scrollTop)
      //   return scrollTop == 40 * cascadeDisplayItems.value[i].length - (defaultMenuProps.maxHeight - 80)
      // }
      for (let i = 0; i< cascadeDisplayItems.value.length; i++) {
        const listRef = ref<VList>()
        listRefs.push(listRef)
        cardList.push(
          <VCol cols={ colPattern(depth.value) }>
            <VCard
              style={[{ 'display': 'flex' }, { 'flex-direction': 'column' }]}
              class={[ 'py-1', 'mx-1' ]}
              height={ defaultMenuProps.maxHeight }
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
                    size='small'
                    variant='text'
                    disabled={ cascadeDisplayItems.value[i].length <= defaultMenuProps.displayItemCount || scrollTop.value[i] }
                    // @ts-ignore
                    onClick={ () => listScrollUp(`.auto-hide-scrollbar-${i}`) }
                  >
                    {/* <VIcon
                      class={[ 'no-bg-color-icon' ]}
                    >{ isScrollTop(i) ? 'mdi-blank' : 'mdi-chevron-up' }</VIcon> */}
                    <VIcon class={[ 'no-bg-color-icon' ]}>mdi-chevron-up</VIcon>
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
                      class={[ 'pa-0' ]}
                      ref={ listRef }
                      selected={ cascadeSelected.value[i] }
                      selectStrategy={ props.multiple ? 'independent' : 'single-independent' }
                      density='compact'
                      minHeight={ defaultMenuProps.maxHeight - defaultMenuProps.listHeaderMaxHeight * 2 - 8 }
                      // @ts-ignore
                      onMousedown={ (e: MouseEvent) => e.preventDefault() }
                      onFocusout={ onFocusout }
                      onUpdate:opened={ onListOpened }
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
                            onClick={ () => cascadeSelect(item, i) }
                          >
                            {{
                              prepend: () => (
                                <VIcon icon={ item.raw.icon || 'mdi-blank' }></VIcon> // fix: <VIcon>{ item.raw.icon || 'mdi-blank' }</VIcon>写法图标刷新有问题
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
                  [
                    [
                      Scroll,
                      (e: Event) => {
                        const elem = e.target as HTMLElement
                        onScroll(elem, i)
                      },
                      '',
                      { self: true }
                    ],
                    [ /* 控制上下翻页按钮是否可用 */
                      Intersect,
                      (isIntersecting: boolean, entries: Array<IntersectionObserverEntry>) => {
                        if (isIntersecting) {
                          const $ele = entries[0].target as HTMLElement
                          for (let i = 0; i < cascadeDisplayItems.value.length; i++) {
                            if ($ele.classList.contains(`auto-hide-scrollbar-${i}`)) {
                              const selectedItem = $ele.querySelector('.v-list-item--active')
                              if (selectedItem) {
                                // 滚动到选中项
                                selectedItem.scrollIntoView()
                              } else {
                                $ele.querySelector('.v-list-item')?.scrollTo({ top: 0 })
                              }
                              setTimeout(() => {
                                onScroll($ele, i)
                              }, 200)
                              break
                            }
                          }
                        }
                      }
                    ]
                  ]
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
                    size='small'
                    variant='text'
                    disabled={ cascadeDisplayItems.value[i].length <= defaultMenuProps.displayItemCount || scrollBottom.value[i] }
                    // @ts-ignore
                    onClick={ () => listScrollDown(`.auto-hide-scrollbar-${i}`) }
                  >
                    {/* <VIcon
                      class={[ 'no-bg-color-icon' ]}
                    >{ isScrollBottom(i) ? 'mdi-blank' : 'mdi-chevron-down' }</VIcon> */}
                    <VIcon class={[ 'no-bg-color-icon' ]}>mdi-chevron-down</VIcon>
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
          // onBlur={ onBlur }
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
                  // maxHeight={ 310 }
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
                        class={[ 'd-flex', 'flex-nowrap', 'py-0', 'pl-0', 'pr-2' ]}
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