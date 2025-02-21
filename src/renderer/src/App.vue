<template>
  <router-view></router-view>
  <FooterDialog />
</template>

<script setup lang="ts">
import { useScreenController } from './composables/useScreenController'
import FooterDialog from './components/Footer/FooterDIalog.vue'
import { useTaskStore } from './stores/task_store'
import { onMounted } from 'vue'



// 在应用启动时执行一次下载任务
onMounted(() => {
  const taskStore = useTaskStore()
  taskStore.initialize()
})
</script>

<style></style>
