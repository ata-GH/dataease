<!-- eslint-disable -->
<script lang="ts" setup>
/* eslint-disable */
import { ElMain } from 'element-plus-secondary'
import { useRoute } from 'vue-router_2'
const route = useRoute()
</script>

<template>
  <el-main>
    <RouterView v-slot="{ Component, route }">
      <!-- 仅缓存 dashboard-new 页面，其他页面正常渲染 -->
      <keep-alive v-if="route.name === 'dashboard-new'">
        <component :is="Component" />
      </keep-alive>
      <component v-else :is="Component" />
    </RouterView>
  </el-main>
</template>
