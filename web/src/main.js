import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import '@assets/base/main.scss'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import '@assets/main.css'
import '@/assets/base/main.scss'
import { createPinia } from "pinia";
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'



const app = createApp(App)
app.use(router)
app.use(ElementPlus)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate);
app.use(pinia)

app.mount('#app')

