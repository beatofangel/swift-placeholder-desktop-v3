/**
 * plugins/vuetify.ts
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// Composables
import { createVuetify } from 'vuetify'

// @ts-ignore
import colors from 'vuetify/lib/util/colors'

import { zhHans } from 'vuetify/locale'

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  theme: {
    themes: {
      light: {
        dark: false,
        colors: {
          primary: '#F37984',
          secondary: '#F3BDB0',
          'secondary-lighten-1': '#FFF0ED',
        },
        variables: {
          scrollbarTrack: colors.grey.lighten4,
          scrollbarThumb: colors.grey.lighten1,
          scrollbarThumbHover: colors.grey.darken1
        }
      },
      dark: {
        dark: true,
        colors: {
          primary: '1B262C',
          secondary: '0F4C75',
        },
        variables: {
          scrollbarTrack: colors.grey.darken1,
          scrollbarThumb: colors.grey.lighten1,
          scrollbarThumbHover: colors.grey.lighten4
        }
      },
    },
  },
  locale: {
    locale: 'zhHans',
    messages: { zhHans },
  }
})
