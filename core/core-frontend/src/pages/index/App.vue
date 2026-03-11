<!-- eslint-disable -->
<script setup lang="ts">
/* eslint-disable */
import { ref } from 'vue'
import { useEmitt } from '@/hooks/web/useEmitt'
import configGlobal from '@/components/config-global/src/ConfigGlobal.vue'
import ExportExcel from '@/views/visualized/data/dataset/ExportExcel.vue'
const exportExcelRef = ref()
const exportExcelCenter = params => {
  exportExcelRef.value.init(params)
}
useEmitt({
  name: 'data-export-center',
  callback: exportExcelCenter
})
</script>
<template>
  <config-global>
    <router-view v-slot="{ Component }">
      <component :is="Component" />
    </router-view>
    <ExportExcel ref="exportExcelRef"></ExportExcel>
  </config-global>
</template>
