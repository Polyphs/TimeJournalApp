import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', name: 'week', component: () => import('pages/WeeklyPage.vue') },
      { path: 'log', name: 'log', component: () => import('pages/LogPage.vue') },
      { path: 'summary', name: 'summary', component: () => import('pages/SummaryPage.vue') },
      { path: 'blocks', name: 'blocks', component: () => import('pages/BlocksPage.vue') },
      { path: 'settings', name: 'settings', component: () => import('pages/SettingsPage.vue') }
    ]
  }
]

export default function () {
  return createRouter({ scrollBehavior: () => ({ left: 0, top: 0 }), routes, history: createWebHashHistory() })
}
