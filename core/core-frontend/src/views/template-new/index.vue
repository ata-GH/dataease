<!-- eslint-disable -->
<template>
  <div class="template-new-container">
    <template-market ref="templateMarketRef" @close="close"></template-market>
  </div>
</template>

<script setup lang="ts">
/* eslint-disable */
import TemplateMarket from '@/views/template-market/index.vue'
import { nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router_2'

const router = useRouter()
const templateMarketRef = ref(null)

const close = () => {
  router.replace({
    path: '/loading'
  })
  // 等待路由切换完成后关闭加载页
  nextTick(() => {
    parent.window.postMessage({ type: 'closeBoard', data: {} }, '*')
  })
}

onMounted(() => {
  const param = {
    curPosition: 'branchCreate',
    templateType: 'all',
    pid: null
  }
  nextTick(() => {
    templateMarketRef.value?.optInit(param)
  })
})
</script>

<style lang="less" scoped>
.template-new-container {
  width: 100vw;
  height: 100vh;
  background-color: var(--ed-background-color-primary);
  overflow: hidden;
  :deep(.template-outer-body) {
    height: 100%;
    width: 100%;
    .template-area {
      height: calc(100% - 60px) !important;
    }
  }
}
</style>
