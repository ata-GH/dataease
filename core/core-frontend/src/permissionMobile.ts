import router from './router/mobile'
import { useUserStoreWithOut } from '@/store/modules/user'
import { useNProgress } from '@/hooks/web/useNProgress'
import { usePageLoading } from '@/hooks/web/usePageLoading'
import { useCache } from '@/hooks/web/useCache'
import { getRoleRouters } from '@/api/common'
import { usePermissionStoreWithOut } from '@/store/modules/permission'
import { interactiveStoreWithOut } from '@/store/modules/interactive'
import { useAppearanceStoreWithOut } from '@/store/modules/appearance'
import { useLinkStoreWithOut } from '@/store/modules/link'
import { sdarLoginApi } from '@/api/auth'
import { ElMessage, ElLoading } from 'element-plus-secondary'

const appearanceStore = useAppearanceStoreWithOut()
const permissionStore = usePermissionStoreWithOut()
const { wsCache } = useCache()
const userStore = useUserStoreWithOut()
const linkStore = useLinkStoreWithOut()

const { start, done } = useNProgress()
const interactiveStore = interactiveStoreWithOut()

const { loadStart, loadDone } = usePageLoading()
const whiteList = ['/login', '/panel', '/DashboardEmpty', '/preview'] // 不重定向白名单

const handleTokenLogin = async (to, next) => {
  // 支持通过 URL 携带 token 直接访问并登录
  const getParam = (key: string) => {
    const val = to.query?.[key]
    return Array.isArray(val) ? (val as string[])[0] : (val as string | undefined)
  }
  const tokenParam = getParam('token')
  const dvIdParam = getParam('dvId')
  const usernameParam = getParam('username')
  const loginTypeParam = getParam('loginType')

  if (tokenParam) {
    const loadingInstance = ElLoading.service({
      lock: true,
      text: '登录中...'
    })
    try {
      const res = await sdarLoginApi({
        id: dvIdParam,
        token: tokenParam,
        username: usernameParam,
        loginType: loginTypeParam,
        resourceType: 2
      })
      const result = res.data
      if (result.rspcode === '200') {
        const dataeaseToken = result.data?.dataeaseToken
        if (dataeaseToken) {
          userStore.setToken(dataeaseToken)
          userStore.setTime(Date.now())
          const { token, dvId, username, loginType, ...restQuery } = to.query as Record<string, any>
          next({ path: to.path, query: { dvId, ...restQuery }, replace: true })
        }
      } else {
        ElMessage.error(result.desc || '登录失败')
        next({ path: '/login', replace: true })
      }
    } catch (e) {
      console.error(e)
    } finally {
      loadingInstance.close()
    }
  }
  return false
}

router.beforeEach(async (to, _, next) => {
  start()
  loadStart()
  if (await handleTokenLogin(to, next)) return
  await appearanceStore.setAppearance()
  if (to.name === 'link') {
    next()
  } else if (wsCache.get('user.token')) {
    linkStore.setLinkToken('')
    if (!userStore.getUid) {
      await userStore.setUser()
    }
    if (to.path === '/login') {
      // next({ path: '/index' })
      next()
    } else {
      const roleRouters = (await getRoleRouters()) || []
      const routers: any[] = roleRouters as AppCustomRouteRecordRaw[]
      routers.forEach(item => (item['top'] = true))
      await permissionStore.generateRoutes(routers as AppCustomRouteRecordRaw[])
      permissionStore.setIsAddRouters(true)
      await interactiveStore.initInteractive(true)
      next()
    }
  } else {
    if (whiteList.includes(to.path) || to.name === 'link') {
      next()
    } else {
      linkStore.setLinkToken('')
      next('/login') // 否则全部重定向到登录页
    }
  }
})

router.afterEach(() => {
  done()
  loadDone()
})
