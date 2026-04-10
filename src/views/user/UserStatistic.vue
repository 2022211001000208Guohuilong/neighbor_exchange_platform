<!-- eslint-disable no-unused-vars -->
<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import { getUserStatisticService } from '@/api/user'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'

const loading = ref(true)
const trendChartRef = ref(null)
const activeTrendChartRef = ref(null)
const distributionChartRef = ref(null)

let trendChart = null
let activeTrendChart = null
let distributionChart = null

const userStatistic = ref({
  total: 0, // 总用户数
  today: 0, // 今日新增用户数
  active: 0, // 活跃用户数
  trend: [], // 每日新增用户趋势
  activeTrend: [], // 活跃用户趋势
})

const getLastNDays = (n) => {
  const dates = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const label = d.toLocaleDateString().split('/').slice(1).join('-')
    dates.push(label)
  }
  return dates
}

const normalizeTrend = (data, fallbackDays = 7) => {
  if (Array.isArray(data) && data.length > 0) {
    return data.map((item) => {
      const date = item?.date ?? item?.day ?? item?.label ?? item?.time ?? ''
      const count = Number(item?.count ?? item?.value ?? item?.num ?? 0)
      return { date, count }
    })
  }
  const labels = getLastNDays(fallbackDays)
  return labels.map((d) => ({ date: d, count: Math.floor(Math.random() * 30) + 5 }))
}

const initCharts = () => {
  if (trendChartRef.value) {
    trendChart?.dispose()
    trendChart = echarts.init(trendChartRef.value)
    renderLineChart(trendChart, '每日新增', normalizeTrend(userStatistic.value.trend), '#409eff')
  }

  if (activeTrendChartRef.value) {
    activeTrendChart?.dispose()
    activeTrendChart = echarts.init(activeTrendChartRef.value)
    renderLineChart(
      activeTrendChart,
      '活跃用户',
      normalizeTrend(userStatistic.value.activeTrend),
      '#67c23a',
    )
  }

  if (distributionChartRef.value) {
    distributionChart?.dispose()
    distributionChart = echarts.init(distributionChartRef.value)
    renderDistributionChart(distributionChart)
  }
}

const renderLineChart = (chart, name, data, color) => {
  const option = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: data.map((i) => i.date) },
    yAxis: { type: 'value' },
    series: [
      {
        name,
        type: 'line',
        smooth: true,
        data: data.map((i) => i.count),
        itemStyle: { color },
        lineStyle: { width: 3 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color },
            { offset: 1, color: '#fff' },
          ]),
          opacity: 0.25,
        },
      },
    ],
  }
  chart.setOption(option)
}

const renderDistributionChart = (chart) => {
  const total = Number(userStatistic.value.total || 0)
  const active = Math.min(Number(userStatistic.value.active || 0), total)
  const inactive = Math.max(total - active, 0)

  const option = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: '4%', left: 'center' },
    series: [
      {
        name: '用户分布',
        type: 'pie',
        radius: ['35%', '70%'],
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
        labelLine: { show: false },
        data: [
          { value: active, name: '活跃用户', itemStyle: { color: '#67c23a' } },
          { value: inactive, name: '非活跃用户', itemStyle: { color: '#909399' } },
        ],
      },
    ],
  }
  chart.setOption(option)
}

const handleResize = () => {
  trendChart?.resize()
  activeTrendChart?.resize()
  distributionChart?.resize()
}

const loadUserStatistic = async () => {
  loading.value = true
  try {
    const res = await getUserStatisticService()
    userStatistic.value = res.data
    initCharts()
  } catch (error) {
    ElMessage.error('获取用户统计数据失败')
    initCharts()
  } finally {
    loading.value = false
  }
}

// 用于展示动画效果的响应式数据
const displayData = ref({
  total: 0,
  today: 0,
  active: 0,
})

/**
 * 数字增长动画函数
 * @param {string} key - displayData 中的键名
 * @param {number} target - 目标数值
 * @param {number} duration - 动画持续时间(ms)
 */
const animateNumber = (key, target, duration = 1500) => {
  const startValue = displayData.value[key]
  const startTime = performance.now()

  const update = (currentTime) => {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)

    // 使用 easeOutExpo 缓动函数让动画更自然
    const easeOutExpo = (x) => (x === 1 ? 1 : 1 - Math.pow(2, -10 * x))
    const currentProgress = easeOutExpo(progress)

    displayData.value[key] = Math.floor(startValue + (target - startValue) * currentProgress)

    if (progress < 1) {
      requestAnimationFrame(update)
    }
  }

  requestAnimationFrame(update)
}

// 监听数据变化并触发动画
watch(
  () => userStatistic.value,
  (newVal) => {
    animateNumber('total', newVal.total)
    animateNumber('today', newVal.today)
    animateNumber('active', newVal.active)
  },
  { deep: true },
)

onMounted(() => {
  loadUserStatistic()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  trendChart?.dispose()
  activeTrendChart?.dispose()
  distributionChart?.dispose()
})
</script>

<template>
  <page-container title="用户统计">
    <div class="statistic-container" v-loading="loading">
      <!-- 核心指标 -->
      <div class="stats-grid">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-header">
            <span class="stat-title">总用户数</span>
          </div>
          <div class="stat-value">{{ displayData.total }}</div>
        </el-card>
        <el-card shadow="hover" class="stat-card">
          <div class="stat-header">
            <span class="stat-title">今日新增</span>
          </div>
          <div class="stat-value">{{ displayData.today }}</div>
        </el-card>
        <el-card shadow="hover" class="stat-card">
          <div class="stat-header">
            <span class="stat-title">活跃用户</span>
          </div>
          <div class="stat-value">{{ displayData.active }}</div>
        </el-card>
      </div>

      <!-- 趋势图表 -->
      <div class="charts-grid">
        <!-- 每日新增用户趋势 -->
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="chart-header">
              <span>每日新增用户趋势</span>
            </div>
          </template>
          <div class="chart-container">
            <div ref="trendChartRef" style="width: 100%; height: 100%"></div>
          </div>
        </el-card>

        <!-- 活跃用户趋势 -->
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="chart-header">
              <span>活跃用户趋势</span>
            </div>
          </template>
          <div class="chart-container">
            <div ref="activeTrendChartRef" style="width: 100%; height: 100%"></div>
          </div>
        </el-card>
      </div>

      <!-- 用户分布 -->
      <el-card shadow="hover" class="distribution-card">
        <template #header>
          <div class="chart-header">
            <span>用户分布</span>
          </div>
        </template>
        <div class="chart-container">
          <div ref="distributionChartRef" style="width: 100%; height: 100%"></div>
        </div>
      </el-card>
    </div>
  </page-container>
</template>

<style lang="scss" scoped>
.statistic-container {
  padding: 20px 0;

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 30px;

    .stat-card {
      .stat-header {
        margin-bottom: 15px;

        .stat-title {
          font-size: 14px;
          color: #666;
        }
      }

      .stat-value {
        font-size: 32px;
        font-weight: bold;
        color: #409eff;
      }
    }
  }

  .charts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 20px;
    margin-bottom: 30px;

    .chart-card {
      .chart-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .chart-container {
        height: 300px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
  }

  .distribution-card {
    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .chart-container {
      height: 400px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}
</style>
