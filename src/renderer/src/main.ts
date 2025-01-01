import './assets/main.css'
import './assets/tailwind.css'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index'
import { createPinia } from 'pinia'
import * as pdfjslib from 'pdfjs-dist'
import piniaPersistedState from 'pinia-plugin-persistedstate'
import { Icon } from '@iconify/vue'
pdfjslib.GlobalWorkerOptions.workerSrc = 'node_modules/pdfjs-dist/build/pdf.worker.js'
const pinia = createPinia()
pinia.use(piniaPersistedState)

const app = createApp(App).use(router).use(ElementPlus).use(pinia)
app.component('Icon', Icon)
app.mount('#app')
