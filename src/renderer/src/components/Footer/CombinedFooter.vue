<template>
  <div class="w-full h-full bg-white">
    <div class="w-full h-full flex justify-between gap-4 p-4">
      <!-- Left Section - Today's Weather -->
      <div class="w-1/4 flex flex-col bg-white rounded-xl border border-grey p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        <div class="grid grid-cols-2 grid-rows-2 gap-3 h-full">
          <div class="flex flex-col justify-center items-center">
            <p class="text-2xl font-semibold text-primary">
              {{
                new Date(weatherData_today?.temperature?.recordTime || new Date()).toLocaleDateString(
                  'zh-CN',
                  { month: '2-digit', day: '2-digit' }
                )
              }}
            </p>
            <p class="text-sm font-medium text-neutral/80">
              {{
                new Date(weatherData_today?.temperature?.recordTime || new Date()).toLocaleDateString(
                  'zh-CN',
                  { weekday: 'long' }
                )
              }}
            </p>
          </div>

          <div class="flex flex-col justify-center items-center">
            <p class="text-3xl font-semibold text-primary">
              {{
                weatherData_today?.temperature?.data.find((item) => item.place === '九龍城')?.value
              }}°C
            </p>
            <p class="text-xs font-medium text-neutral/80">九龍城</p>
          </div>

          <div class="flex justify-center items-center">
            <img :src="getWeatherIcon(weatherData_today?.icon[0] || 50)" alt="Weather Icon"
              class="w-16 h-16 object-contain filter-primary" />
          </div>

          <div class="flex flex-col justify-center gap-1.5 overflow-auto">
            <div v-if="Object.keys(weatherData_warning || {}).length > 0" 
              v-for="(warning, key) in weatherData_warning" 
              :key="key"
              class="px-2 py-1 bg-accent/5 rounded-lg border border-accent/10">
              <p class="text-[10px] font-medium text-accent/90 text-center truncate">
                {{ warning?.name?.trim() || '無' }}
              </p>
            </div>
            <div v-else class="px-2 py-1 ">
              <p class="text-[20px] font-medium text-center text-primary truncate">
                無
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Section - Rotating Content -->
      <Transition name="fade" mode="out-in">
        <div v-if="showWeather"
          class="flex-1 bg-white rounded-xl p-4 border border-grey shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          <div class="grid grid-cols-5 gap-3 h-full">
            <div v-for="(forecast, index) in weatherData_forecast?.weatherForecast?.slice(0, 5)" :key="index"
              class="flex flex-col items-center justify-between py-1.5">
              <div :class="[
                'px-3 py-1 rounded-lg text-xs font-medium w-full text-center',
                index === 0
                  ? 'bg-primary/10 text-primary/90'
                  : 'bg-neutral/5 text-neutral/80'
              ]">
                {{ index === 0 ? 'Tomorrow' : forecast?.week?.slice(0, 3) }}
              </div>

              <div class="flex-1 flex items-center">
                <img :src="getWeatherIcon(forecast?.ForecastIcon || 50)" alt="Forecast Icon"
                  class="w-14 h-14 object-contain filter-primary" />
              </div>

              <div class="flex flex-col items-center gap-0.5">
                <p class="text-base font-semibold text-primary/90">
                  {{ forecast?.forecastMaxtemp?.value }}°
                </p>
                <p class="text-xs text-neutral/70">
                  {{ forecast?.forecastMintemp?.value }}°
                </p>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="flex-1 flex gap-4">
          <div class="w-1/2 bg-white rounded-xl border border-grey p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <div class="h-full flex items-center gap-4">
              <div class="flex-shrink-0">
                <div class="w-32 h-32 bg-neutral/5 rounded-lg flex items-center justify-center">
                  <img src="@renderer/assets/qr-app.png" alt="" class="w-28 h-28 object-contain" />
                </div>
              </div>
              <div class="flex-1">
                <p class="text-sm font-medium text-primary mb-1">移動應用</p>
                <p class="text-xs text-neutral/70">掃QRCode下載APP</p>
              </div>
            </div>
          </div>

          <div class="w-1/2 bg-white rounded-xl border border-grey p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <div class="h-full flex items-center gap-4">
              <div class="flex-shrink-0">
                <div class="w-32 h-32 bg-neutral/5 rounded-lg flex items-center justify-center">
                  <img src="@renderer/assets/qr-wechat.png" alt="微信公众号二维码" class="w-28 h-28 object-contain" />
                </div>
              </div>
              <div class="flex-1">
                <p class="text-sm font-medium text-primary mb-1">微信公眾號</p>
                <p class="text-xs text-neutral/70">掃QRCode追蹤最新訊息</p>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
    <div v-if="isLoading" class="absolute top-2 right-2">
      <div class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-r-transparent"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import axios from 'axios'
import img50 from '@renderer/assets/weatherIcons/pic50.png'
import img51 from '@renderer/assets/weatherIcons/pic51.png'
import img52 from '@renderer/assets/weatherIcons/pic52.png'
import img53 from '@renderer/assets/weatherIcons/pic53.png'
import img54 from '@renderer/assets/weatherIcons/pic54.png'
import img60 from '@renderer/assets/weatherIcons/pic60.png'
import img61 from '@renderer/assets/weatherIcons/pic61.png'
import img62 from '@renderer/assets/weatherIcons/pic62.png'
import img63 from '@renderer/assets/weatherIcons/pic63.png'
import img64 from '@renderer/assets/weatherIcons/pic64.png'
import img65 from '@renderer/assets/weatherIcons/pic65.png'
import img70 from '@renderer/assets/weatherIcons/pic70.png'
import img71 from '@renderer/assets/weatherIcons/pic71.png'
import img72 from '@renderer/assets/weatherIcons/pic72.png'
import img73 from '@renderer/assets/weatherIcons/pic73.png'
import img74 from '@renderer/assets/weatherIcons/pic74.png'
import img75 from '@renderer/assets/weatherIcons/pic75.png'
import img76 from '@renderer/assets/weatherIcons/pic76.png'
import img77 from '@renderer/assets/weatherIcons/pic77.png'
import img80 from '@renderer/assets/weatherIcons/pic80.png'
import img81 from '@renderer/assets/weatherIcons/pic81.png'
import img82 from '@renderer/assets/weatherIcons/pic82.png'
import img83 from '@renderer/assets/weatherIcons/pic83.png'
import img84 from '@renderer/assets/weatherIcons/pic84.png'
import img85 from '@renderer/assets/weatherIcons/pic85.png'
import img90 from '@renderer/assets/weatherIcons/pic90.png'
import img91 from '@renderer/assets/weatherIcons/pic91.png'
import img92 from '@renderer/assets/weatherIcons/pic92.png'
import img93 from '@renderer/assets/weatherIcons/pic93.png'

// 类型定义
interface WeatherData_forecast {
  weatherForecast?: {
    forecastDate?: string
    week?: string
    forecastWeather?: string
    forecastWind?: string
    forecastMaxtemp?: {
      value?: string
    }
    forecastMintemp?: {
      value?: string
    }
    ForecastIcon?: number
  }[]
}

interface WeatherData_today {
  rainfall: {
    data: RainfallItem[]
    startTime: string
    endTime: string
  }
  warningMessage: string
  icon: number[]
  iconUpdateTime: string
  uvindex: string
  updateTime: string
  temperature: {
    data: TemperatureItem[]
    recordTime: string
  }
  humidity: {
    recordTime: string
    data: HumidityItem[]
  }
}

interface RainfallItem {
  unit: string
  place: string
  max: number
  main: string
}

interface TemperatureItem {
  place: string
  value: number
  unit: string
}

interface HumidityItem {
  unit: string
  value: number
  place: string
}

// 状态管理
const showWeather = ref(true)
const weatherData_forecast = ref<WeatherData_forecast>()
const weatherData_today = ref<WeatherData_today>()
const weatherData_warning = ref<Record<string, { name: string }>>({})
let rotationInterval: ReturnType<typeof setInterval> | null = null

// 在 script setup 部分添加新的状态和常量
const RETRY_DELAY = 30000 // 重试间隔 30 秒
const UPDATE_INTERVAL = 1800000 // 更新间隔 30 分钟
const MAX_RETRIES = 3 // 最大重试次数

const isLoading = ref(false)
const retryCount = ref(0)
let updateInterval: ReturnType<typeof setInterval> | null = null

// 获取天气图标
const getWeatherIcon = (icon: number) => {
  const icons: Record<number, string> = {
    50: img50, 51: img51, 52: img52, 53: img53, 54: img54,
    60: img60, 61: img61, 62: img62, 63: img63, 64: img64, 65: img65,
    70: img70, 71: img71, 72: img72, 73: img73, 74: img74, 75: img75, 76: img76, 77: img77,
    80: img80, 81: img81, 82: img82, 83: img83, 84: img84, 85: img85,
    90: img90, 91: img91, 92: img92, 93: img93
  }
  return icons[icon] || img50
}

// 轮播控制
const startRotation = () => {
  rotationInterval = setInterval(() => {
    showWeather.value = !showWeather.value
  }, 5000)
}

// 修改获取天气数据的函数
const fetchWeatherData = async (isRetry = false) => {
  if (isLoading.value) return
  
  try {
    isLoading.value = true
    const [forecastRes, todayRes, warningRes] = await Promise.all([
      axios.get('https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=fnd&lang=en'),
      axios.get('https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=tc'),
      axios.get('https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=warnsum&lang=tc')
    ])

    weatherData_forecast.value = forecastRes.data
    weatherData_today.value = todayRes.data
    weatherData_warning.value = warningRes.data
    
    // 重置重试计数
    retryCount.value = 0
  } catch (error) {
    console.error('获取天气数据失败:', error)
    
    // 重试逻辑
    if (isRetry && retryCount.value < MAX_RETRIES) {
      retryCount.value++
      setTimeout(() => {
        fetchWeatherData(true)
      }, RETRY_DELAY)
    }
  } finally {
    isLoading.value = false
  }
}

// 修改生命周期钩子
onMounted(() => {
  // 初始获取数据
  fetchWeatherData(true)
  startRotation()

  // 设置定期更新
  updateInterval = setInterval(() => {
    fetchWeatherData(true)
    console.log('更新天气数据')
  }, UPDATE_INTERVAL)

  // 添加样式
  const style = document.createElement('style')
  style.textContent = `
    .filter-primary {
      filter: brightness(0) saturate(100%) invert(40%) sepia(75%) saturate(1500%) hue-rotate(198deg) brightness(98%) contrast(98%);
    }
  `
  document.head.appendChild(style)
})

onUnmounted(() => {
  if (rotationInterval) {
    clearInterval(rotationInterval)
  }
  if (updateInterval) {
    clearInterval(updateInterval)
  }
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>