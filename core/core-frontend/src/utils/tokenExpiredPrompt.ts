/* eslint-disable */
import { ElMessageBox } from 'element-plus-secondary'

let showing = false

/**
 * 显示全局不可关闭的“登录过期”弹窗。
 * - 不允许点击遮罩/ESC/关闭按钮关闭
 * - 不显示任何按钮，仅提示用户“关闭页面重新登录”
 */
export const showTokenExpiredPrompt = () => {
  if (showing) return
  showing = true

  ElMessageBox({
    title: '登录过期',
    message: '登录信息已过期，请关闭页面重新登录。',
    type: 'warning',
    showConfirmButton: false,
    showCancelButton: false,
    showClose: false,
    closeOnClickModal: false,
    closeOnPressEscape: false,
    autofocus: false
  }).catch(() => {
    // MessageBox 的 Promise reject 不影响展示；不做处理
  })
}

/**
 * 主动关闭“登录过期”弹窗（供宿主或后续集成调用）。
 */
export const closeTokenExpiredPrompt = () => {
  try {
    ;(ElMessageBox as any).close()
  } finally {
    showing = false
  }
}
