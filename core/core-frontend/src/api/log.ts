import request from '@/config/axios'

export const sdarDashboardLogApi = (data) => {
  return request.post({
    url: `/sdar/rest/dashboard/log/${data.dvId}/add?logType=0&hasPermission=1`
  })
}
