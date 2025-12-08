import { createApp } from 'vue'
import '@/style/index.less'
import 'normalize.css/normalize.css'
import '@antv/s2/dist/style.min.css'
import 'vxe-table/lib/style.css'
import App from './App.vue'
import { setupI18n } from '@/plugins/vue-i18n'
import { setupStore } from '@/store'
import { setupRouter } from '@/router'
import router from '@/router'
import { setupElementPlus, setupElementPlusIcons } from '@/plugins/element-plus'
// 注册数据大屏组件
import { setupCustomComponent } from '@/custom-component'
import { installDirective } from '@/directive'
import '@/utils/DateUtil'
import '@/permission'
import WebSocketPlugin from '../../websocket'

// 支持父页面通过 postMessage 控制子页面路由跳转
window.addEventListener('message', (event: MessageEvent<any>) => {
  const isTab = window.location.href.includes('mode=tab')
  const data = event?.data
  if (!isTab && data?.type === 'navigate') {
    const { path, params } = data
    try {
      router.push({
        path,
        query: params
      })
    } catch (e) {
      console.error('[postMessage navigate] failed', e)
    }
  }
})
const setupAll = async () => {
  const app = createApp(App)
  installDirective(app)
  setupStore(app)
  await setupI18n(app)
  setupRouter(app)
  setupElementPlus(app)
  setupCustomComponent(app)
  setupElementPlusIcons(app)
  app.use(WebSocketPlugin)
  app.mount('#app')
}

setupAll()
