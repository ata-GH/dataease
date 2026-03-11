<!-- eslint-disable -->
<script setup lang="ts">
/* eslint-disable */
// 可选：接收 query 参数以显示自定义提示
// import { useRoute } from 'vue-router_2'
// const route = useRoute()
// const tip = computed(() => route.query?.tip as string || '正在加载，请稍候…')
// 关闭加载页：通知父窗口
const closeLoading = () => {
  try {
    // 按需调用父窗口方法
    parent.window.postMessage({ type: 'closeBoard', data: {} }, '*')
  } catch (e) {
    // 兼容处理：非 iframe 环境或异常时回退
    window.parent?.postMessage({ type: 'closeBoard', data: {} }, '*')
  }
}
</script>

<template>
  <div class="loading-page">
    <div class="loader">
      <div class="spinner" />
      <div class="text">正在加载，请稍候…</div>
      <button class="close-btn" @click="closeLoading" aria-label="关闭加载">关闭</button>
    </div>
  </div>
</template>

<style lang="less" scoped>
.loading-page {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--de-bg-color, #f5f7fa);
}
.loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.spinner {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 4px solid rgba(0,0,0,0.1);
  border-top-color: #409eff; /* Element Plus primary color */
  animation: spin 0.9s linear infinite;
}
.text {
  color: #606266;
  font-size: 14px;
}
.close-btn {
  padding: 6px 12px;
  font-size: 14px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fff;
  color: #606266;
  cursor: pointer;
}
.close-btn:hover {
  border-color: #c0c4cc;
  color: #409eff;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>

