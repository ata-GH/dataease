<!-- eslint-disable -->
<script lang="ts" setup>
/* eslint-disable */
import { type DateModelType } from 'element-plus-secondary'
import { ref } from 'vue'
const selectValue = ref<[DateModelType, DateModelType]>([new Date(), new Date()])
</script>

<template>
  <div>
    <el-date-picker v-model="selectValue" type="yearrange" format="YYYY" />
  </div>
</template>

<style lang="less" scoped></style>
