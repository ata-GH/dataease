/* eslint-disable */
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
// import WebSocketPlugin from '../../websocket'

// 支持父页面通过 postMessage 控制子页面路由跳转
window.addEventListener('message', (event: MessageEvent<any>) => {
  const data = event?.data
  if (data?.type === 'navigate') {
    const { path, params } = data?.data
    console.log('dataeaseIframe', path, params)
    function extractPathFromUrl(url) {
      if (!url) return '';
      // 如果包含 #
      if (url.includes('#')) {
        const hashPart = url.split('#')[1] || '';
        return hashPart.startsWith('/') ? hashPart : '/' + hashPart;
      }
      // 如果没有 #，直接返回
      //（例如父应用已经传的是 /xxx/yyy）
      return url.startsWith('/') ? url : '/' + url;
    }
    try {
      router.push({
        path: extractPathFromUrl(path),
        query: params
      })
    } catch (e) {
      console.error('[postMessage navigate] failed', e)
    }
  }
})
router.isReady().then(() => {
  // 明确通知父窗口iframe加载完毕
  console.log('IFRAME_READY')
  window.parent.postMessage(
    {
      type: 'IFRAME_READY'
    },
    '*'
  )
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
  // app.use(WebSocketPlugin)
  app.mount('#app')
}

setupAll()
