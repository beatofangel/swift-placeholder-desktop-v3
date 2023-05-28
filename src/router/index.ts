// Composables
import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('@/layouts/default/Default.vue'),
    children: [
      {
        path: '',
        name: 'Home',
        meta: {
          icon: 'mdi-file-replace',
        },
        // route level code-splitting
        // this generates a separate chunk (about.[hash].js) for this route
        // which is lazy-loaded when the route is visited.
        component: () => import(/* webpackChunkName: "home" */ '@/views/Home.vue'),
      },
      // {
      //   path: '/',
      //   name: '替换',
      //   icon: 'mdi-file-replace',
      //   component: () => import('@/views/ReplaceView.vue')
      // },
      // {
      //   path: '/workshop',
      //   name: '模板工坊',
      //   icon: 'mdi-file-document-edit',
      //   component: () => import('@/views/WorkshopView.vue')
      // },
      // {
      //   path: '/about',
      //   name: 'About',
      //   icon: 'mdi-help-circle',
      //   component: () => import('@/views/AboutView.vue')
      // }
    ],
  },
]

const router = createRouter({
  // history: createWebHistory(process.env.BASE_URL),
  history: createWebHashHistory(),
  routes,
})

export default router
