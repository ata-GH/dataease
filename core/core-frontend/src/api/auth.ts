import request from '@/config/axios'
import qs from 'qs'

export const queryUserApi = data => request.post({ url: '/user/byCurOrg', data })
export const queryUserOptionsApi = () => request.get({ url: '/user/org/option' })
export const queryRoleApi = data => request.post({ url: '/role/byCurOrg', data })

export const fetchOperatorListApi = (params = { numberPerPage: 999999, currentPage: 1 }) =>
  request.get({ url: '/sdar/rest/auth/operator/list', params })

export const sdarLoginApi = (data) => {
  return request.post({
    url: '/sdar/rest/login',
    data: qs.stringify(data),
    headersType: 'application/x-www-form-urlencoded;charset=UTF-8'
  })
}

export const fetchGroupListApi = (
  params = { state: 1, numberPerPage: 999999, currentPage: 1 }
) => request.get({ url: '/sdar/rest/auth/group/list', params })

export const resourceTreeApi = (flag: string) => request.get({ url: '/auth/busiResource/' + flag })

export const menuTreeApi = () => request.get({ url: '/auth/menuResource' })

export const resourcePerApi = data => request.post({ url: '/auth/busiPermission', data })

export const menuPerApi = data => request.post({ url: '/auth/menuPermission', data })

export const busiPerSaveApi = data => request.post({ url: '/auth/saveBusiPer', data })
export const menuPerSaveApi = data => request.post({ url: '/auth/saveMenuPer', data })

export const resourceTargetPerApi = data =>
  request.post({ url: '/auth/busiTargetPermission', data })

export const menuTargetPerApi = data => request.post({ url: '/auth/menuTargetPermission', data })

export const busiTargetPerSaveApi = data => request.post({ url: '/auth/saveBusiTargetPer', data })
export const menuTargetPerSaveApi = data => request.post({ url: '/auth/saveMenuTargetPer', data })
