import "./assets/main.css";
import "./assets/tailwind.css";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import { createApp } from "vue";
import App from "./App.vue";
import router from "./router/index";
import Toast from "vue-toastification";
import "vue-toastification/dist/index.css";

import { createPinia } from "pinia";
import * as pdfjslib from "pdfjs-dist";
import piniaPersistedState from "pinia-plugin-persistedstate";
import { Icon } from "@iconify/vue";
pdfjslib.GlobalWorkerOptions.workerSrc =
  "node_modules/pdfjs-dist/build/pdf.worker.js";
const pinia = createPinia();
pinia.use(piniaPersistedState);
// 配置Toast选项
const toastOptions = {
  position: "bottom-center",
  timeout: 5000,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  draggablePercent: 0.6,
  showCloseButtonOnHover: false,
  hideProgressBar: false,
  closeButton: "button",
  icon: true,
  rtl: false,
};
const app = createApp(App)
  .use(router)
  .use(ElementPlus)
  .use(pinia)
  .use(Toast, toastOptions);
app.component("Icon", Icon);
app.mount("#app");
