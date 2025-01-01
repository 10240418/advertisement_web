import { ref } from 'vue'

export function useVideoPlayer() {
  const videoElement = ref<HTMLVideoElement | null>(null)
  
  const playVideo = async () => {
    if (!videoElement.value) return
    
    try {
      videoElement.value.currentTime = 0
      await videoElement.value.play()
    } catch (err) {
      console.warn('Video playback failed:', err)
    }
  }

  const stopVideo = () => {
    if (videoElement.value) {
      videoElement.value.pause()
    }
  }

  return {
    videoElement,
    playVideo,
    stopVideo
  }
} 