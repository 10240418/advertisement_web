import { defineStore } from 'pinia'
import { ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useNoticeStore } from './notice_store'
import { useAdsStore } from './ads_store'

// 定义可能的屏幕状态类型
// menu: 菜单界面
// fullscreen-ad: 全屏广告
// arrearage-table: 欠费表格
// notice: 通知公告
export type ScreenState = 'menu' | 'fullscreen-ad' | 'arrearage-table' | 'notice'

// 定义各种计时器的时间配置接口
interface TimerConfig {
  idle: number      // 空闲超时时间
  display: number   // 显示持续时间
  notice: number    // 通知显示时间
  fullscreen: number // 全屏模式超时时间
  pdfPage: number   // PDF 每页停留时间，新增
}

// 定义错误处理接口
interface ErrorHandler {
  message: string   // 错误信息
  retry?: () => void     // 重试函数
  fallback?: () => void  // 降级处理函数
}

export const useFlowStore = defineStore('flow', () => {
  const router = useRouter()
  const noticeStore = useNoticeStore()
  const adsStore = useAdsStore()

  // === 核心状态管理 ===
  const currentScreenState = ref<ScreenState>('menu')  // 当前屏幕状态
  const isUserActive = ref(true)      // 用户是否活跃
  const isFullscreen = ref(false)     // 是否全屏模式
  const isError = ref(false)          // 是否存在错误
  const errorMessage = ref('')        // 错误信息
  const lastArrearageTablePage = ref(1)  // 添加这一行来存储欠费表的最后页码

  // === 计时器配置（毫秒） ===
  const timeoutConfig: TimerConfig = {
    idle: 5000,        // 5秒空闲
    display: 30000,     // 30秒显示
    notice: 10000,      // 10秒通知
    fullscreen: 10000,  // 10秒全屏
    pdfPage: 5000      // 每页停留5秒，可以根据需要调整
  }

  // === 计时器存储对象 ===
  const timers = {
    idle: null as NodeJS.Timeout | null,      // 空闲计时器
    state: null as NodeJS.Timeout | null,     // 状态计时器
    fullscreen: null as NodeJS.Timeout | null // 全屏计时器
  }

  // === 媒体播放状态管理 ===
  const currentAdIndex = ref(0)           // 当前广告索引
  const adRemainingTime = ref(0)          // 广告剩余时间
  const isAdPlaying = ref(false)          // 是否正在播放广告
  const currentNoticeIndex = ref(0)       // 当前通知索引
  const currentNoticePage = ref(1)        // 当前页码
  const totalNoticePages = ref(1)         // 总页数
  const isNoticeRotating = ref(false)     // 是否正在轮播通知

  // === 计算属性 ===
  // 获取活跃的广告列表
  const activeAds = computed(() => adsStore.getActiveAds)
  // 获取已下载的广告
  const downloadedAds = computed(() => adsStore.getDownloadedAds)
  // 获取所有可显示的通知（已下载且有效的）
  const activeNotices = computed(() => {
    // 合并所有类型的通知
    const allNotices = [
      ...noticeStore.urgentNotices,       // 紧急通知
      ...noticeStore.commonNotices,       // 普通通知
      ...noticeStore.governmentNotices,   // 政府通知
      ...noticeStore.systemNotices        // 系统通知
    ]
    
    // 过滤出已下载或有本地路径的通知
    return allNotices.filter(notice => {
      const downloadedNotice = noticeStore.getDownloadedNotices.find(
        item => item.notice.id === notice.id
      )
      return downloadedNotice?.downloadPath || notice.file?.path
    })
  })

  // === 错误处理函数 ===
  const handleError = ({ message, retry, fallback }: ErrorHandler) => {
    console.error(message)
    isError.value = true
    errorMessage.value = message

    // 3秒后重试，或执行降级处理
    if (retry) {
      setTimeout(retry, 3000)
    } else if (fallback) {
      fallback()
    }
  }

  // === 计时器管理函数 ===
  // 清除指定计时器
  const clearTimer = (timerKey: keyof typeof timers) => {
    if (timers[timerKey]) {
      clearTimeout(timers[timerKey]!)
      timers[timerKey] = null
    }
  }

  // 清除所有计时器
  const clearAllTimers = () => {
    Object.keys(timers).forEach((key) => {
      clearTimer(key as keyof typeof timers)
    })
  }

  // === 状态转换管理 ===
  const transitionTo = (newState: ScreenState) => {
    try {
      console.log(`[Flow] 状态转换: ${currentScreenState.value} -> ${newState}`)
      currentScreenState.value = newState
      
      switch (newState) {
        case 'menu':
          console.log('[Flow] 导航到主菜单')
          router.push('/')
          break
        case 'arrearage-table':
          console.log('[Flow] 导航到欠费表格')
          router.push('/arrearage-table')
          break
        case 'notice':
          console.log('[Flow] 开始通知轮播')
          currentNoticeIndex.value = 0 // 重置通知索引
          startNoticeRotation()
          break
        case 'fullscreen-ad':
          console.log('[Flow] 进入全屏广告模式')
          isAdPlaying.value = true
          currentAdIndex.value = 0 // 重置广告索引
          // 移除 router.push('/fullscreen-ad')，改为触发广告播放状态
          break
      }
    } catch (error) {
      console.error('[Flow] 状态转换失败:', error)
      handleError({
        message: `状态转换失败: ${error}`,
        fallback: () => transitionTo('menu')
      })
    }
  }

  // === 用户活动处理 ===
  const handleUserActivity = () => {
    console.log('[Flow] 检测到用户活动')
    isUserActive.value = true
    isError.value = false
    
    if (isFullscreen.value) {
      console.log('[Flow] 退出全屏模式')
      isFullscreen.value = false
    }

    clearTimer('fullscreen')
    console.log('[Flow] 重置全屏计时器:', timeoutConfig.fullscreen, 'ms')
    timers.fullscreen = setTimeout(() => {
      console.log('[Flow] 触发全屏模式')
      isFullscreen.value = true
    }, timeoutConfig.fullscreen)

    if (currentScreenState.value === 'fullscreen-ad') {
      console.log('[Flow] 从全屏广告返回菜单')
      transitionTo('menu')
    }

    clearAllTimers()
    startIdleTimer()
  }

  // === 空闲计时器管理 ===
  const startIdleTimer = () => {
    console.log('[Flow] 启动空闲计时器:', timeoutConfig.idle, 'ms')
    clearTimer('idle')
    timers.idle = setTimeout(() => {
      console.log('[Flow] 空闲超时，用户变为非活跃')
      isUserActive.value = false
      startScreenSequence()
    }, timeoutConfig.idle)
  }

  // === 屏幕序列控制 ===
  const startScreenSequence = () => {
    console.log('[Flow] 开始屏幕序列')
    clearTimer('state')
    
    // 将startNewCycle提取为独立函数
    startNewCycle()
  }

  // 新增：将循环逻辑提取为独立函数
  const startNewCycle = () => {
    console.log('[Flow] 开始新的轮播循环')
    transitionTo('fullscreen-ad')

    console.log('[Flow] 设置广告->欠费表计时器:', timeoutConfig.display, 'ms')
    timers.state = setTimeout(() => {
      if (!isUserActive.value) {
        console.log('[Flow] 切换到欠费表')
        transitionTo('arrearage-table')

        console.log('[Flow] 设置欠费表->通知计时器:', timeoutConfig.display, 'ms')
        timers.state = setTimeout(() => {
          if (!isUserActive.value) {
            console.log('[Flow] 切换到通知轮播')
            transitionTo('notice')
          }
        }, timeoutConfig.display)
      }
    }, timeoutConfig.display)
  }

  // === 通知轮播控制 ===
  const startNoticeRotation = () => {
    console.log('[Flow] 尝试开始通知轮播')
    console.log('[Flow] 活跃通知列表:', activeNotices.value)
    
    if (!activeNotices.value || activeNotices.value.length === 0) {
      console.log('[Flow] 没有可显示的通知，返回菜单')
      transitionTo('menu')
      return
    }

    // 确保索引在有效范围内
    if (currentNoticeIndex.value >= activeNotices.value.length) {
      console.log('[Flow] 重置通知索引')
      currentNoticeIndex.value = 0
    }

    console.log('[Flow] 开始通知轮播，共', activeNotices.value.length, '条通知')
    isNoticeRotating.value = true
    rotateNotice()
  }

  // 轮播单个通知
  const rotateNotice = async () => {
    console.log('[Flow] 开始轮播通知, 用户状态:', isUserActive.value)
    
    if (!isUserActive.value && activeNotices.value && activeNotices.value.length > 0) {
      try {
        const notice = activeNotices.value[currentNoticeIndex.value]
        if (!notice) {
          console.error('[Flow] 无法获取当前通知')
          return
        }

        const downloadedNotice = noticeStore.getDownloadedNotices.find(
          item => item.notice.id === notice.id
        )
        
        const pdfPath = downloadedNotice?.downloadPath || notice.file?.path
        
        if (!pdfPath) {
          console.error('[Flow] 通知文件路径无效')
          handleError({
            message: '通知文件路径无效',
            retry: () => {
              currentNoticeIndex.value = (currentNoticeIndex.value + 1) % activeNotices.value.length
              rotateNotice()
            }
          })
          return
        }

        // 如果是新的通知，重置页码
        if (currentNoticePage.value === 1) {
          await router.push('/')
          await nextTick()
        }

        await router.replace({ 
          path: '/pdfPreview',
          query: { 
            pdfSource: pdfPath,
            title: notice.title,
            noticeId: notice.id,
            currentPage: currentNoticePage.value.toString(),
            _t: Date.now()
          }
        })
        
        await nextTick()
        
        clearTimer('state')
        timers.state = setTimeout(() => {
          if (currentNoticePage.value < totalNoticePages.value) {
            // 还有下一页，继续显示当前PDF的下一页
            currentNoticePage.value++
            rotateNotice()
          } else {
            // 当前PDF已经显示完所有页面，切换到下一个通知
            currentNoticePage.value = 1
            currentNoticeIndex.value++
            
            if (currentNoticeIndex.value >= activeNotices.value.length) {
              // 所有通知都显示完毕，重新开始新的循环
              currentNoticeIndex.value = 0
              isNoticeRotating.value = false
              clearAllTimers() // 清除所有现有计时器
              startNewCycle() // 开始新的循环
            } else {
              // 显示下一个通知
              rotateNotice()
            }
          }
        }, timeoutConfig.pdfPage)

      } catch (error) {
        console.error('[Flow] 通知轮播失败:', error)
        handleError({
          message: `通知轮播失败: ${error}`,
          retry: rotateNotice
        })
      }
    }
  }

  // 停止通知轮播
  const stopNoticeRotation = () => {
    isNoticeRotating.value = false
    clearTimer('state')
  }

  // === 清理函数 ===
  const cleanup = () => {
    clearAllTimers()
    stopNoticeRotation()
    isAdPlaying.value = false
    isError.value = false
  }

  // === 返回store的公共接口 ===
  return {
    // 状态
    currentScreenState,
    isUserActive,
    isFullscreen,
    isError,
    errorMessage,
    
    // 媒体状态
    currentAdIndex,
    adRemainingTime,
    isAdPlaying,
    currentNoticeIndex,
    currentNoticePage,
    totalNoticePages,
    isNoticeRotating,
    
    // 计算属性
    activeAds,
    downloadedAds,
    activeNotices,
    
    // 方法
    handleUserActivity,
    startIdleTimer,
    startScreenSequence,
    startNoticeRotation,
    stopNoticeRotation,
    clearAllTimers,
    cleanup,
    transitionTo,
    
    // 配置
    timeoutConfig,
    
    // 欠费表页码相关
    lastArrearageTablePage,
    setLastArrearageTablePage: (page: number) => {
      lastArrearageTablePage.value = page;
    }
  }
})
