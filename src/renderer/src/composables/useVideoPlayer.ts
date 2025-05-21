import { ref } from "vue";

export function useVideoPlayer() {
  const videoElement = ref<HTMLVideoElement | null>(null);
  const videoError = ref<string | null>(null);

  const playVideo = async () => {
    if (!videoElement.value) {
      console.warn("视频元素未初始化");
      return;
    }

    videoError.value = null;

    try {
      // 检查视频元素状态
      console.log("视频元素状态:", {
        src: videoElement.value.src,
        networkState: videoElement.value.networkState,
        readyState: videoElement.value.readyState,
        paused: videoElement.value.paused,
        ended: videoElement.value.ended,
        error: videoElement.value.error,
      });

      videoElement.value.currentTime = 0;
      await videoElement.value.play();
    } catch (err) {
      videoError.value = err instanceof Error ? err.message : String(err);
      console.warn("Video playback failed:", err);

      // 检查常见的视频播放错误
      if (videoElement.value.error) {
        const errorCode = videoElement.value.error.code;
        const errorMessage =
          {
            1: "视频加载中断",
            2: "网络错误",
            3: "视频解码错误",
            4: "视频资源不可用",
          }[errorCode] || "未知错误";

        console.error(`视频播放错误(${errorCode}): ${errorMessage}`);
      }
    }
  };

  const stopVideo = () => {
    if (videoElement.value) {
      videoElement.value.pause();
    }
  };

  return {
    videoElement,
    videoError,
    playVideo,
    stopVideo,
  };
}
