<!-- eslint-disable -->
<script lang="ts" setup>
/* eslint-disable */
import { useRoute } from 'vue-router_2'
const route = useRoute()
</script>
<template>
  <router-view :key="route.path" />
</template>
