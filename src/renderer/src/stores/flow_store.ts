import { defineStore } from 'pinia'
import { ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useNoticeStore } from './notice_store'
import { useAdsStore } from './ads_store'
import { timeTask } from '@renderer/utils/time-task'

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

  // === 新增状态 ===
  const rotationRetryCount = ref(0)  // 轮播重试次数
  const maxRetryAttempts = 3         // 最大重试次数
  const isRecovering = ref(false)    // 是否正在恢复
  const lastSuccessfulState = ref<{  // 记录最后一次成功的状态
    noticeIndex: number
    noticePage: number
    screenState: ScreenState
  } | null>(null)

  // === 计算属性 ===
  // 获取活跃的广告列表
  const activeAds = computed(() => adsStore.getActiveAds)
  // 获取已下载的广告
  const downloadedAds = computed(() => adsStore.getDownloadedAds)
  // 获取所有可显示的通知（已下载且有效的）
  const activeNotices = computed(() => {
    // 合并所有类型的通知
    const allNotices = noticeStore.notices
    console.log('allNotices',allNotices,noticeStore.getDownloadedNotices)
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
    
    // 重置所有状态
    rotationRetryCount.value = 0
    currentNoticeIndex.value = 0
    currentNoticePage.value = 1
    lastSuccessfulState.value = null
    
    clearAllTimers()
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
    
    if (isUserActive.value) {
      console.log('[Flow] 用户活跃，停止轮播')
      return
    }

    try {
      // 验证通知数据
      if (!activeNotices.value || activeNotices.value.length === 0) {
        console.warn('[Flow] 没有可用的通知，尝试重新获取数据')
        await recoverFromError()
        return
      }

      // 验证当前索引
      if (currentNoticeIndex.value >= activeNotices.value.length) {
        console.warn('[Flow] 通知索引越界，重置索引')
        currentNoticeIndex.value = 0
      }

      const notice = activeNotices.value[currentNoticeIndex.value]
      if (!notice) {
        throw new Error('无效的通知数据')
      }

      // 保存当前状态
      lastSuccessfulState.value = {
        noticeIndex: currentNoticeIndex.value,
        noticePage: currentNoticePage.value,
        screenState: currentScreenState.value
      }

      const downloadedNotice = noticeStore.getDownloadedNotices.find(
        item => item.notice.id === notice.id
      )
      
      const pdfPath = downloadedNotice?.downloadPath || notice.file?.path
      
      if (!pdfPath) {
        throw new Error('通知文件路径无效')
      }

      // 路由导航
      try {
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
            _t: Date.now()  // 添加时间戳防止缓存
          }
        })
        
        await nextTick()
        rotationRetryCount.value = 0  // 重置重试计数
        
        // 设置状态切换计时器
        clearTimer('state')
        timers.state = setTimeout(() => {
          if (!isUserActive.value) {
            handleNoticePageChange()
          }
        }, timeoutConfig.pdfPage)

      } catch (routerError) {
        console.error('[Flow] 路由导航失败:', routerError)
        throw routerError
      }

    } catch (error) {
      console.error('[Flow] 通知轮播失败:', error)
      await handleRotationError(error)
    }
  }

  // === 新增：处理通知页面变化 ===
  const handleNoticePageChange = () => {
    if (currentNoticePage.value < totalNoticePages.value) {
      currentNoticePage.value++
      rotateNotice()
    } else {
      currentNoticePage.value = 1
      currentNoticeIndex.value++
      
      if (currentNoticeIndex.value >= activeNotices.value.length) {
        currentNoticeIndex.value = 0
        isNoticeRotating.value = false
        clearAllTimers()
        startNewCycle()
      } else {
        rotateNotice()
      }
    }
  }

  // === 新增：错误处理函数 ===
  const handleRotationError = async (error: any) => {
    console.error('[Flow] 轮播错误:', error)
    
    if (rotationRetryCount.value < maxRetryAttempts) {
      rotationRetryCount.value++
      console.log(`[Flow] 尝试恢复轮播 (${rotationRetryCount.value}/${maxRetryAttempts})`)
      await recoverFromError()
    } else {
      console.error('[Flow] 达到最大重试次数，重新开始循环')
      rotationRetryCount.value = 0
      clearAllTimers()
      startNewCycle()
    }
  }

  // === 新增：恢复函数 ===
  const recoverFromError = async () => {
    if (isRecovering.value) return
    
    try {
      isRecovering.value = true
      console.log('[Flow] 开始恢复流程')

      // 重新获取通知数据
      await timeTask('pdf')
      
      // 恢复到最后一个成功的状态，或重新开始
      if (lastSuccessfulState.value) {
        currentNoticeIndex.value = lastSuccessfulState.value.noticeIndex
        currentNoticePage.value = lastSuccessfulState.value.noticePage
        currentScreenState.value = lastSuccessfulState.value.screenState
      } else {
        currentNoticeIndex.value = 0
        currentNoticePage.value = 1
      }

      // 重新开始轮播
      await rotateNotice()

    } catch (error) {
      console.error('[Flow] 恢复失败:', error)
      startNewCycle()
    } finally {
      isRecovering.value = false
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
