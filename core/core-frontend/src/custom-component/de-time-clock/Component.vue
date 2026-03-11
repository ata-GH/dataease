<!-- eslint-disable -->
<template>
  <div style="height: 100%">
    <time-default :ref="element.id" :element="element" />
  </div>
</template>

<script setup lang="ts">
/* eslint-disable */
import TimeDefault from '@/custom-component/de-time-clock/TimeDefault.vue'
defineProps({
  element: {
    type: Object
  }
})
</script>
