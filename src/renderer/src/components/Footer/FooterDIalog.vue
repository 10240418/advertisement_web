<template>
  <!-- 添加一个测试按钮以便直接触发通知 -->
  <div class="test-container"></div>
</template>

<script setup lang="ts">
import { useToast } from "vue-toastification";
import { POSITION } from "vue-toastification";
import { onMounted, onUnmounted, watch, ref } from "vue";
import { useNotificationStore } from "../../stores/noticefication_store";
import "vue-toastification/dist/index.css";

const toast = useToast();
const notificationStore = useNotificationStore();

// 存储上一次的通知列表长度，用于检测新通知
const prevNotificationsLength = ref(0);

// 测试通知函数
const testNotification = () => {
  toast.success("这是一个测试成功通知", toastOptions);
  console.log("测试通知已触发");
};

// 测试系统通知（通过store）
const testSystemNotification = () => {
  notificationStore.addNotification("这是通过store添加的系统通知", "info");
  console.log("系统通知已添加到store");
};

// 存储计时器ID - 修改类型为NodeJS.Timeout|null
let checkNotificationsInterval: ReturnType<typeof setInterval> | null = null;

// 在组件挂载后立即显示一个通知，用于测试
onMounted(() => {
  console.log("FooterDialog 组件已挂载");
  console.log("当前store中的通知:", notificationStore.notifications);

  // 初始化prevNotificationsLength
  prevNotificationsLength.value = notificationStore.notifications.length;

  setTimeout(() => {
    console.log("初始通知已触发");
  }, 1000);

  // 设置定期检查通知的计时器
  checkNotificationsInterval = setInterval(checkForNewNotifications, 2000);
});

// 卸载组件时清除计时器
onUnmounted(() => {
  if (checkNotificationsInterval) {
    clearInterval(checkNotificationsInterval);
  }
});

// 主动检查是否有新通知
const checkForNewNotifications = () => {
  const currentNotifications = notificationStore.notifications;
  console.log(
    "检查通知 - 当前通知数:",
    currentNotifications.length,
    "之前通知数:",
    prevNotificationsLength.value,
  );

  if (currentNotifications.length > prevNotificationsLength.value) {
    // 有新通知
    const newNotifications = currentNotifications.slice(
      prevNotificationsLength.value,
    );
    console.log("发现新通知:", newNotifications);

    // 显示新通知
    newNotifications.forEach((notification) => {
      displayNotification(notification);
    });

    // 更新长度
    prevNotificationsLength.value = currentNotifications.length;
  }
};

// 显示单个通知
const displayNotification = (notification: any) => {
  console.log("显示通知:", notification.type, notification.message);

  switch (notification.type) {
    case "success":
      toast.success(notification.message, toastOptions);
      break;
    case "error":
      toast.error(notification.message, toastOptions);
      break;
    case "info":
      toast.info(notification.message, toastOptions);
      break;
    case "warning":
      toast.warning(notification.message, toastOptions);
      break;
    default:
      toast.info(notification.message, toastOptions);
  }
};

// 监听通知变化并使用toast显示
watch(
  () => notificationStore.notifications,
  (newNotifications, oldNotifications) => {
    console.log("通知变化:", newNotifications, oldNotifications);

    // 处理oldNotifications可能为undefined的情况
    const safeOldNotifications = oldNotifications || [];

    // 找出新添加的通知
    const newlyAdded = newNotifications.filter(
      (newNotif) =>
        !safeOldNotifications.some((oldNotif) => oldNotif.id === newNotif.id),
    );

    console.log("新增通知:", newlyAdded);

    // 为每个新添加的通知显示toast
    newlyAdded.forEach((notification) => {
      displayNotification(notification);
    });
  },
  { deep: true, immediate: true },
);

// 自定义toast选项
const toastOptions = {
  position: POSITION.BOTTOM_CENTER,
  timeout: 5000, // 增加显示时间以便于观察
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  draggablePercent: 0.6,
  showCloseButtonOnHover: false,
  hideProgressBar: false,
  closeButton: "button",
  icon: true,
  rtl: false,
};
</script>

<style>
/* 测试按钮样式 */
.test-container {
  padding: 10px;
  display: flex;
  justify-content: center;
}

.test-button {
  padding: 8px 16px;
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.test-button:hover {
  background-color: #0d8aee;
}

.ml-2 {
  margin-left: 8px;
}

/* 覆盖vue-toastification默认样式以匹配原有样式 */
:root {
  --toastify-color-success: #4caf50;
  --toastify-color-error: #ff0000;
  --toastify-color-info: #2196f3;
  --toastify-color-warning: #ff9800;
  --toastify-toast-width: 741px;
  --toastify-font-family: "Adelle Sans Devanagari", sans-serif;
}

.Vue-Toastification__toast {
  padding: 18px 25px;
  border-radius: 5px;
  height: 63px;
  font-size: 24px;
  font-style: normal;
  font-weight: 400;
  line-height: 28px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  filter: drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.25));
  z-index: 9999 !important;
}

.Vue-Toastification__toast-body {
  display: flex;
  align-items: center;
}

.Vue-Toastification__toast--bottom-center {
  bottom: 100px;
}

.Vue-Toastification__container {
  z-index: 9999 !important;
}
</style>
