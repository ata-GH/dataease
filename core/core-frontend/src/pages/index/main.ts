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
  const data = event?.data
  const { path, params } = data || {}
  try {
    if (data?.type === 'navigate' && path) {
      router.push({ path, query: params })
      return
    }
    // 当父页面通知 iframe 已关闭时，跳转到 Loading 页
    if (data?.type === 'iframeClosed') {
      router.push({ path: '/loading' })
      return
    }
  } catch (e) {
    console.error('[postMessage navigate] failed', e)
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
