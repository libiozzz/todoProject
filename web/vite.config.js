import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path' //做文件路径补全
//import { fileURLToPath, URL } from 'node:url'



// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {  //alias别名最终做的一个事情就是字符串替换
      "@": resolve(__dirname, "./src"),  //配置别名 resolve拼接路径
      "@assets": resolve(__dirname, "./src/assets")
    }
  },
  // resolve: {
  //   alias: {
  //     '@': fileURLToPath(new URL('./src', import.meta.url))
  //   }
  // }
})
