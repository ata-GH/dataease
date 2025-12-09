<script setup lang="ts">
// 可选：接收 query 参数以显示自定义提示
// import { useRoute } from 'vue-router_2'
// const route = useRoute()
// const tip = computed(() => route.query?.tip as string || '正在加载，请稍候…')
</script>

<template>
  <div class="loading-page">
    <div class="loader">
      <div class="spinner" />
      <div class="text">正在加载，请稍候…</div>
    </div>
  </div>
  
</template>

<style scoped>
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
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>

