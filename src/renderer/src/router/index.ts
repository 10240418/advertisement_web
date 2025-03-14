import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import HomeLayout from '../layouts/HomeLayout.vue'
import ArrearageFind from '../views/arrearage/ArrearageFind.vue'
import ArrearageTable from '../components/Table/ArrangeTable.vue'
// 定义路由的类型
const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    component: HomeLayout,
    children: [
      { path: '', component: () => import('../views/menu/HomeMenu.vue') },
      { path: 'setting', component: () => import('../views/setting/BuildingDetail.vue') },
      { path: '/arrearage-find', name: 'ArrearageFind', component: ArrearageFind },
      { path: '/arrearage-table', name: 'ArrearageTable', component: ArrearageTable },
      { path: '/pdfPreview', name: 'PdfPreview', component: () => import('../views/pdf/PdfPreview.vue') }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes: routes
})

export default router
