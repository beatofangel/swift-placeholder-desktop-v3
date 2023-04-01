import { computed, mergeProps, ref } from 'vue'
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

// @ts-ignore
import { makeVTextFieldProps } from 'vuetify/lib/components/VTextField/VTextField.mjs'
import { VDialogTransition } from 'vuetify/lib/components/transitions/index'
import { VList, VListItem } from 'vuetify/lib/components/VList/index'
import { VChip } from 'vuetify/lib/components/VChip/index'
import { VMenu } from 'vuetify/lib/components/VMenu/index'
import { VTextField } from 'vuetify/lib/components/VTextField/index'
import { VCheckboxBtn } from 'vuetify/lib/components/VCheckbox/index'
import { VDefaultsProvider } from 'vuetify/lib/components/VDefaultsProvider/index'
// import VCascadeSelectList from "./VCascadeSelectList"; // Extensions

// @ts-ignore
import type { MakeSlots, SlotsToProps } from 'vuetify/lib/util/index.mjs'
// @ts-ignore
import type { VInputSlots } from 'vuetify/lib/components/VInput/VInput.mjs'
// @ts-ignore
import type { VFieldSlots } from 'vuetify/lib/components/VField/VField.mjs'
// @ts-ignore
import type { InternalItem } from 'vuetify/lib/composables/items.mjs'
import type { PropType } from 'vue'

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

  ...makeItemsProps({ itemChildren: false }),
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
    const selections = computed(() => {
      return model.value.map((v: any) => {
        return items.value.find((item: { value: any }) => props.valueComparator(item.value, v.value)) || v
      })
    })
    const selected = computed(() => selections.value.map((selection: { props: { value: any } }) => selection.props.value))

    const displayItems = computed(() => {
      if (props.hideSelected) {
        return items.value.filter((item: any) => !selections.value.some((s: any) => s === item))
      }
      return items.value
    })

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
    function select (item: InternalItem) {
      if (props.multiple) {
        const index = selected.value.findIndex((selection: any) => props.valueComparator(selection, item.value))

        if (index === -1) {
          model.value = [...model.value, item]
        } else {
          const value = [...model.value]
          value.splice(index, 1)
          model.value = value
        }
      } else {
        model.value = [item]
        menu.value = false
      }
    }
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

    useRender(() => {
      const hasChips = !!(props.chips || slots.chip)
      const hasList = !!((!props.hideNoData || displayItems.value.length) || slots.prepend || slots.append || slots['no-data'])
      const [textFieldProps] = VTextField.filterProps(props)

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
                    <VList
                      ref={ listRef }
                      selected={ selected.value }
                      selectStrategy={ props.multiple ? 'independent' : 'single-independent' }
                      // @ts-ignore
                      onMousedown={ (e: MouseEvent) => e.preventDefault() }
                      onFocusout={ onFocusout }
                    >
                      { !displayItems.value.length && !props.hideNoData && (slots['no-data']?.() ?? (
                        <VListItem title={ t(props.noDataText) } />
                      ))}

                      { slots['prepend-item']?.() }

                      { displayItems.value.map((item: any, index: any) => {
                        if (slots.item) {
                          return slots.item?.({
                            item,
                            index,
                            props: mergeProps(item.props, { onClick: () => select(item) }),
                          })
                        }

                        return (
                          <VListItem
                            key={ index }
                            { ...item.props }
                            onClick={ () => select(item) }
                          >
                            {{
                              prepend: ({ isSelected }) => props.multiple && !props.hideSelected ? (
                                <VCheckboxBtn modelValue={ isSelected } ripple={ false } />
                              ) : undefined,
                            }}
                          </VListItem>
                        )
                      })}

                      { slots['append-item']?.() }
                    </VList>
                  )}
                </VMenu>

                { selections.value.map((item: any, index: any) => {
                  function onChipClose (e: Event) {
                    e.stopPropagation()
                    e.preventDefault()

                    select(item)
                  }

                  const slotProps = {
                    'onClick:close': onChipClose,
                    modelValue: true,
                    'onUpdate:modelValue': undefined,
                  }

                  return (
                    <div key={ item.value } class="v-select__selection">
                      { hasChips ? (
                        !slots.chip ? (
                          <VChip
                            key="chip"
                            closable={ props.closableChips }
                            size="small"
                            text={ item.title }
                            { ...slotProps }
                          />
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
                            { props.multiple && (index < selections.value.length - 1) && (
                              <span class="v-select__selection-comma">,</span>
                            )}
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
      select,
    }, vTextFieldRef)
  },
})

export type VCascadeSelect = InstanceType<typeof VCascadeSelect>