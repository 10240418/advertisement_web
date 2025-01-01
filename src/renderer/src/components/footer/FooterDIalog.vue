<template>
  <div class="notification-container">
    <transition-group name="fade" tag="div">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="notification"
        :class="`notification-${notification.type}`"
      >
        {{ notification.message }}
        <!-- <span class="close-btn" @click="remove(notification.id)">&times;</span> -->
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useNotificationStore } from '../../stores/noticefication_store'

const notificationStore = useNotificationStore()
const notifications = computed(() => notificationStore.notifications)

// 可选：如果你想启用关闭按钮，可以取消注释并实现 `remove` 方法
// const remove = (id: number) => {
//   notificationStore.removeNotification(id)
// }
</script>

<style scoped>
.notification-container {
  position: fixed;
  bottom: 100px;
  width: 100%;
  height: 20px;
  flex-shrink: 0;
  filter: drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.25));
  z-index: 9999;
  display: flex;
  flex-direction: column-reverse;
  align-items: center;
  gap: 10px;
  padding: 10px;
}

.notification {
  bottom: 10px;
  background-color: #fff;
  padding: 18px 25px;
  border-radius: 5px;
  width: 741px;
  height: 63px;

  font-family: 'Adelle Sans Devanagari';
  font-size: 24px;
  font-style: normal;
  font-weight: 400;
  line-height: 28px; /* 116.667% */

  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  filter: drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.25));
  display: flex;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.5s;
}

/* 成功通知 */
.notification-success {
  color: #4caf50; /* 绿色 */
}

/* 错误通知 */
.notification-error {
  color: #ff0000; /* 红色 */
}

/* 信息通知 */
.notification-info {
  color: #2196f3; /* 蓝色 */
}

/* 警告通知 */
.notification-warning {
  color: #ff9800; /* 橙色 */
}

/* 可选的关闭按钮样式 */
/*
.close-btn {
  cursor: pointer;
  font-weight: bold;
  margin-left: 10px;
}
*/
</style>
