import { createRouter, createWebHashHistory } from 'vue-router'
import GooseEditor from './pages/GooseEditor.vue'

const routes = [
  { path: '/', name: 'goose', component: GooseEditor },
  {
    path: '/canvas',
    name: 'canvas',
    // 懒加载：无限画布依赖较大，按需加载
    component: () => import('./pages/FlowCanvas.vue')
  }
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes
})
