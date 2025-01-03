<template>
  <div 
    class="w-screen aspect-video bg-gray-100 flex justify-center items-center relative overflow-hidden transition-all duration-300"
    :class="{ 
      'fixed top-0 left-0 w-screen h-screen z-[9999] bg-black/75 backdrop-blur-md': isFullscreen,
      'h-[30vh]': !isFullscreen // 非全屏时的高度
    }"
  >
    <div v-if="currentAd">
      <img
        v-if="currentAd.type === 'image' && isImageVisible"
        ref="imageElement"
        :src="currentAd.path ? currentAd.path : currentAd.file.path"
        :alt="currentAd.title || 'Advertisement Image'"
        class="block rounded-lg max-h-full object-contain"
        :class="{ 'w-screen h-screen object-contain drop-shadow-lg': isFullscreen }"
        :width="isFullscreen ? '100%' : mediaWidth"
        @error="nextAd"
      />

      <video
        v-if="currentAd.type === 'video' && isVideoVisible"
        ref="videoElement"
        :width="isFullscreen ? '100%' : mediaWidth"
        :src="currentAd.path ? currentAd.path : currentAd.file.path"
        class="block rounded-lg aspect-video object-contain"
        :class="{ 'w-screen h-screen object-contain drop-shadow-lg': isFullscreen }"
        muted
        autoplay
        loop
        @error="nextAd"
        @ended="handleVideoEnd"
      ></video>

      <div class="absolute bottom-2.5 right-2.5 bg-black/50 text-white px-2.5 py-1.5 rounded text-sm">
        {{ remainingTime }}秒
      </div>
    </div>
    <div v-else>
        出错了呜呜呜
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  ref,
  watch,
} from 'vue';

import { useAdsStore } from '@renderer/stores/ads_store';
import type { Advertisement } from '@renderer/apis';
import { useAdCycle } from '@renderer/composables/useAdCycle';
import { useVideoPlayer } from '@renderer/composables/useVideoPlayer';
import { useScreenController } from '@renderer/composables/useScreenController'
import { useFlowStore } from '@renderer/stores/flow_store'

const screenController = useScreenController({
  idleTimeout: 10000,
  displayDuration: 30000,
  noticeDuration: 10000,
  fullscreenTimeout: 10000
})

// 计算是否应该全屏显示
const isFullscreen = computed(() => 
  screenController.currentState.value === 'fullscreen-ad' || 
  screenController.isFullscreen.value
)

// isImageVisible isVideoVisible
const isImageVisible = ref(true)
const isVideoVisible = ref(false)
const { 
  adTimer,
  remainingTime,
  clearAdTimer,
  clearCountdownTimer,
  startCountdown 
} = useAdCycle()

const {
  videoElement,
  playVideo,
  stopVideo
} = useVideoPlayer()

// ads store
const adsStore = useAdsStore()

const flowStore = useFlowStore()

const ads = computed(() => 
  isFullscreen.value ? flowStore.fullscreenAds : flowStore.topAds
)

const ads_hasDownload = computed(() =>
  adsStore.getDownloadedAds
)

// currentAd
const currentAdIndex = ref(0)
interface CurrentAd extends Advertisement {
  path?: string
}

const currentAd = ref<CurrentAd | null>(null)
const adsHasDownloadMap = computed(() => {
  const map = new Map<number, any>()
  if (ads_hasDownload.value) {
    ads_hasDownload.value.forEach((ad) => {
      const path = ad.downloadPath?.startsWith('file://') 
        ? ad.downloadPath 
        : `file://${ad.downloadPath}`
      
      map.set(ad.advertisement.id, {
        ...ad.advertisement,
        path: path
      })
    })
  }
  return map
})

// 优化广告资源获取逻辑
const getAdPath = (ad: CurrentAd | null): string => {
  if (!ad) return ''
  
  // 如果是已下载的广告，优先使用下载路径
  if (ad.path) {
    return ad.path
  }
  
  // 如果有 file 属性且包含 path
  if (ad.file?.path) {
    return ad.file.path
  }
  
  return ''
}

/* video and image show loop */
const startAdCycle = async () => {
  clearAdTimer()
  clearCountdownTimer()

  if (!ads.value?.length) {
    console.warn('没有可用的广告')
    currentAd.value = null
    return
  }

  try {
    if (currentAdIndex.value >= ads.value.length) {
      currentAdIndex.value = 0
    }

    const ad = ads.value[currentAdIndex.value]
    if (!ad) {
      console.warn('当前索引的广告不存在')
      nextAd()
      return
    }

    // 输出当前广告信息
    console.log('[Advertisement]', {
      id: ad.id,
      title: ad.title,
      type: ad.type,
      display: ad.display,
      duration: ad.duration,
      isFullscreen: isFullscreen.value,
      currentIndex: currentAdIndex.value,
      totalAds: ads.value.length
    })

    // 检查广告显示位置是否符合当前状态
    const isValidDisplay = isFullscreen.value 
      ? (ad.display === 'full' || ad.display === 'topfull')
      : (ad.display === 'top' || ad.display === 'topfull')

    if (!isValidDisplay) {
      console.warn('广告显示位置不匹配当前状态')
      nextAd()
      return
    }

    const downloadedAd = adsHasDownloadMap.value?.get(ad.id)
    currentAd.value = downloadedAd || ad

    // 验证广告资源是否存在
    const adPath = getAdPath(currentAd.value)
    if (!adPath) {
      console.warn('广告资源路径无效，跳转到下一个广告')
      nextAd()
      return
    }

    const playDuration = currentAd.value?.duration || 5

    startCountdown(playDuration, nextAd)

    const isVideo = currentAd.value?.type === 'video'
    
    if (isVideo) {
      showVideo()
      await playVideo()
    } else {
      showImage()
    }

    adTimer.value = window.setTimeout(nextAd, playDuration * 1000)
  } catch (error) {
    console.error('广告循环出错:', error)
    nextAd()
  }
}

const showImage = () => {
  isImageVisible.value = true
  isVideoVisible.value = false
}

const showVideo = () => {
  isImageVisible.value = false
  isVideoVisible.value = true

  if (videoElement.value) {
    const handleLoadedMetadata = () => {
      videoElement.value!.currentTime = 0
      const playPromise = videoElement.value!.play()
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // console.log('视频播放成功')
          })
          .catch((err) => {
            // console.log('播放时间', videoElement.value!.currentTime)
            console.warn('视频播放切换到下一个广告:', err)
          })
      }
    }

    // 检查元数据是否已经加载
    if (videoElement.value!.readyState >= 1) {
      // HAVE_METADATA
      handleLoadedMetadata()
    } else {
      videoElement.value!.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true })
    }
  }
}

const handleVideoEnd = () => {
  // 视频循环播放，不做额外处理
}

// next ad
const nextAd = () => {
  if (!ads.value?.length) {
    currentAdIndex.value = 0
    currentAd.value = null
    return
  }
  
  currentAdIndex.value = (currentAdIndex.value + 1) % ads.value.length
  startAdCycle()
}

// watch ads change
watch(
  [ads, isFullscreen],
  ([newAds, newIsFullscreen], [oldAds, oldIsFullscreen]) => {
    // 当切换到全屏状态时，重置广告索引并立即开始新的广告循环
    if (newIsFullscreen !== oldIsFullscreen) {
      currentAdIndex.value = 0
      clearAdTimer()
      clearCountdownTimer()
      startAdCycle()
      return
    }

    // 处理广告列表变化
    if (newAds.length < currentAdIndex.value) {
      currentAdIndex.value = 0
    }
    else if (newAds.length === 0) {
      if (videoElement.value) {
        videoElement.value.pause()
        clearAdTimer()
        clearCountdownTimer()
      }
    }
    
    // 处理剩余时间
    if (remainingTime.value > 0) {
      setTimeout(() => {
        startAdCycle()
      }, remainingTime.value * 1000)
    } else {
      startAdCycle()
    }
  },
  { immediate: true, deep: true }
)

/*
 * image video width
 **/
const mediaWidth = ref(1094)

const updateMediaWidth = (size: { width: number; height: number }) => {
  const maxWidth = 2576
  mediaWidth.value = size.width > maxWidth ? maxWidth : size.width
}

// 获取初始窗口大小
window.api.getWindowSize().then((size) => {
  updateMediaWidth(size)
})

// 处理窗口大小变化
const handleResize = (size: { width: number; height: number }) => {
  if (size.width && size.height) {
    updateMediaWidth(size)
  } else {
    console.error('Invalid size received:', size)
  }
}

// 注册窗口大小变化监听器
window.api.onWindowResize(handleResize)

onBeforeUnmount(() => {
  clearAdTimer()
  clearCountdownTimer()
  stopVideo()
})

</script>
