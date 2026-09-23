import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '@/views/HomeView.vue'
import SolarView from '@/views/SolarView.vue'
import IndustrialView from '@/views/IndustrialView.vue'
import MedidoresView from '@/views/MedidoresView.vue'
import AlarmasView from '@/views/AlarmasView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),

  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/solar',
      name: 'solar',
      component: SolarView,
    },
    {
      path: '/industrial',
      name: 'industrial',
      component: IndustrialView,
    },
    {
      path: '/medidores',
      name: 'medidores',
      component: MedidoresView,
    },
    {
      path: '/alarmas',
      name: 'alarmas',
      component: AlarmasView,
    },
  ],
})

export default router
