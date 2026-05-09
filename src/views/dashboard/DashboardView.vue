<!-- eslint-disable no-unused-vars -->
<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import { getOverviewStatisticsService, getTrendStatisticsService } from '@/api/statistics'
import { ElMessage } from 'element-plus'
import { UserFilled, Goods, Sell, ChatDotRound } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

const loading = ref(true)
const userTrendRef = ref(null)
const goodsTrendRef = ref(null)
const tradeTrendRef = ref(null)

let userChart = null
let goodsChart = null
let tradeChart = null

const overviewData = ref({
  user: {
    total: 0,
    today: 0, //今日新增
    active: 0, //活跃用户
  },
  goods: {
    total: 0,
    pending: 0, //待审核
    online: 0, //已上架
    offline: 0, //已下架
  },
  trade: {
    total: 0,
    today: 0, //今日交易
    successRate: 0, //成功率
  },
  interaction: {
    collect: 0, //收藏数
    message: 0, //消息数
  },
})

// 用于展示动画效果的响应式数据
const displayData = ref({
  userTotal: 0,
  goodsTotal: 0,
  tradeTotal: 0,
  collectTotal: 0,
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
  () => overviewData.value,
  (newVal) => {
    animateNumber('userTotal', newVal.user.total)
    animateNumber('goodsTotal', newVal.goods.total)
    animateNumber('tradeTotal', newVal.trade.total)
    animateNumber('collectTotal', newVal.interaction.collect)
  },
  { deep: true },
)

const userTrend = ref([])
const goodsTrend = ref([])
const tradeTrend = ref([])

const initCharts = () => {
  if (userTrendRef.value) {
    userChart = echarts.init(userTrendRef.value)
    renderTrendChart(userChart, '用户增长', userTrend.value, '#409eff')
  }
  if (goodsTrendRef.value) {
    goodsChart = echarts.init(goodsTrendRef.value)
    renderTrendChart(goodsChart, '商品发布', goodsTrend.value, '#67c23a')
  }
  if (tradeTrendRef.value) {
    tradeChart = echarts.init(tradeTrendRef.value)
    renderTrendChart(tradeChart, '交易量', tradeTrend.value, '#e6a23c')
  }
}

const renderTrendChart = (chart, name, data, color) => {
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.map((item) => item.date),
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: name,
        type: 'line',
        smooth: true,
        data: data.map((item) => item.count),
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: color },
            { offset: 1, color: '#fff' },
          ]),
          opacity: 0.3,
        },
        itemStyle: { color: color },
        lineStyle: { width: 3 },
      },
    ],
  }
  chart.setOption(option)
}

const handleResize = () => {
  userChart?.resize()
  goodsChart?.resize()
  tradeChart?.resize()
}

const loadOverviewData = async () => {
  try {
    const res = await getOverviewStatisticsService()
    overviewData.value = res.data
  } catch (error) {
    ElMessage.error('获取总览数据失败')
  }
}

const loadTrendData = async () => {
  try {
    const res = await getTrendStatisticsService({ days: 7 })
    userTrend.value = res.data.userTrend || []
    goodsTrend.value = res.data.goodsTrend || []
    tradeTrend.value = res.data.tradeTrend || []

    // 如果没有数据，提供一些模拟数据展示效果
    if (userTrend.value.length === 0) {
      const dates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (6 - i))
        return d.toLocaleDateString().split('/').slice(1).join('-')
      })
      userTrend.value = dates.map((d) => ({ date: d, count: Math.floor(Math.random() * 50) + 10 }))
      goodsTrend.value = dates.map((d) => ({ date: d, count: Math.floor(Math.random() * 30) + 5 }))
      tradeTrend.value = dates.map((d) => ({ date: d, count: Math.floor(Math.random() * 20) + 2 }))
    }

    initCharts()
  } catch (error) {
    console.error('获取趋势数据失败:', error)
    // ElMessage.error('获取趋势数据失败')
    // 失败也初始化模拟数据
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      return d.toLocaleDateString().split('/').slice(1).join('-')
    })
    userTrend.value = dates.map((d) => ({ date: d, count: Math.floor(Math.random() * 50) + 10 }))
    goodsTrend.value = dates.map((d) => ({ date: d, count: Math.floor(Math.random() * 30) + 5 }))
    tradeTrend.value = dates.map((d) => ({ date: d, count: Math.floor(Math.random() * 20) + 2 }))
    initCharts()
  }
}

onMounted(async () => {
  await Promise.all([loadOverviewData(), loadTrendData()])
  loading.value = false
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  userChart?.dispose()
  goodsChart?.dispose()
  tradeChart?.dispose()
})
</script>

<template>
  <page-container title="数据面板">
    <div class="dashboard-container" v-loading="loading">
      <!-- 核心指标卡片 -->
      <div class="stats-grid">
        <!-- 用户数据 -->
        <el-card shadow="hover" class="stat-card">
          <div class="stat-header">
            <span class="stat-title">总用户数</span>
            <el-icon class="stat-icon"><UserFilled /></el-icon>
          </div>
          <div class="stat-value">{{ displayData.userTotal }}</div>
          <div class="stat-info">
            <span class="stat-desc">今日新增: {{ overviewData.user.today }}</span>
            <span class="stat-desc">活跃用户: {{ overviewData.user.active }}</span>
          </div>
        </el-card>

        <!-- 商品数据 -->
        <el-card shadow="hover" class="stat-card">
          <div class="stat-header">
            <span class="stat-title">总商品数</span>
            <el-icon class="stat-icon"><Goods /></el-icon>
          </div>
          <div class="stat-value">{{ displayData.goodsTotal }}</div>
          <div class="stat-info">
            <span class="stat-desc">待审核: {{ overviewData.goods.pending }}</span>
            <span class="stat-desc">上架: {{ overviewData.goods.online }}</span>
          </div>
        </el-card>

        <!-- 交易数据 -->
        <el-card shadow="hover" class="stat-card">
          <div class="stat-header">
            <span class="stat-title">总交易数</span>
            <el-icon class="stat-icon"><Sell /></el-icon>
          </div>
          <div class="stat-value">{{ displayData.tradeTotal }}</div>
          <div class="stat-info">
            <span class="stat-desc">今日交易: {{ overviewData.trade.today }}</span>
            <span class="stat-desc">成功率: {{ overviewData.trade.successRate }}%</span>
          </div>
        </el-card>

        <!-- 互动数据 -->
        <el-card shadow="hover" class="stat-card">
          <div class="stat-header">
            <span class="stat-title">互动数据</span>
            <el-icon class="stat-icon"><ChatDotRound /></el-icon>
          </div>
          <div class="stat-value">{{ displayData.collectTotal }}</div>
          <div class="stat-info">
            <span class="stat-desc">总收藏数</span>
            <span class="stat-desc">总消息数: {{ overviewData.interaction.message }}</span>
          </div>
        </el-card>
      </div>

      <!-- 趋势图表 -->
      <div class="charts-grid">
        <!-- 用户增长趋势 -->
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="chart-header">
              <span>用户增长趋势</span>
            </div>
          </template>
          <div class="chart-container">
            <div ref="userTrendRef" style="width: 100%; height: 100%"></div>
          </div>
        </el-card>

        <!-- 商品发布趋势 -->
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="chart-header">
              <span>商品发布趋势</span>
            </div>
          </template>
          <div class="chart-container">
            <div ref="goodsTrendRef" style="width: 100%; height: 100%"></div>
          </div>
        </el-card>

        <!-- 交易趋势 -->
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="chart-header">
              <span>交易趋势</span>
            </div>
          </template>
          <div class="chart-container">
            <div ref="tradeTrendRef" style="width: 100%; height: 100%"></div>
          </div>
        </el-card>
      </div>

      <!-- 最近动态 -->
      <!-- <div class="recent-activity">
        <el-card shadow="hover">
          <template #header>
            <div class="activity-header">
              <span>最近动态</span>
            </div>
          </template>
          <div class="activity-content">
            <el-empty description="暂无数据" />
          </div>
        </el-card>
      </div> -->
    </div>
  </page-container>
</template>

<style lang="scss" scoped>
.dashboard-container {
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 20px;

    .stat-card {
      .stat-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;

        .stat-title {
          font-size: 14px;
          color: #666;
        }

        .stat-icon {
          font-size: 20px;
          color: #409eff;
        }
      }

      .stat-value {
        font-size: 32px;
        font-weight: bold;
        color: #00aeff;
        margin-bottom: 10px;
      }

      .stat-info {
        display: flex;
        justify-content: space-between;

        .stat-desc {
          font-size: 12px;
          color: #999;
        }
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

        .chart-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f5f7fa;
          border-radius: 4px;
          color: #999;
        }
      }
    }
  }

  .recent-activity {
    .activity-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .activity-content {
      min-height: 200px;
    }
  }
}
</style>
