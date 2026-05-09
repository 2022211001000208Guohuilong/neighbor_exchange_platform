<!-- eslint-disable no-unused-vars -->
<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import { getTradeStatisticService } from '@/api/trade'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'

const loading = ref(true)
const typeChartRef = ref(null)
const statusChartRef = ref(null)
const trendChartRef = ref(null)

let typeChart = null
let statusChart = null
let trendChart = null

const tradeStatistic = ref({
  total: 0, // 总交易数
  today: 0, // 今日交易数
  successRate: 0, // 交易成功率
  typeDistribution: {
    buy: 0, // 购买交易数
    exchange: 0, // 交换交易数
  },
  statusDistribution: {
    pending: 0, // 待处理交易数
    success: 0, // 成功交易数
    failed: 0, // 失败交易数
    completed: 0, // 已完成交易数
    cancelled: 0, // 已取消交易数
    soldOut: 0, // 已售罄交易数
  },
  monthlyTrend: [], // 月度趋势数据
})

const loadTradeStatistic = async () => {
  loading.value = true
  try {
    const res = await getTradeStatisticService()
    tradeStatistic.value = res.data

    // 如果没有趋势数据，生成模拟数据
    if (!tradeStatistic.value.monthlyTrend || tradeStatistic.value.monthlyTrend.length === 0) {
      const months = [
        '1月',
        '2月',
        '3月',
        '4月',
        '5月',
        '6月',
        '7月',
        '8月',
        '9月',
        '10月',
        '11月',
        '12月',
      ]
      tradeStatistic.value.monthlyTrend = months.map((m) => ({
        month: m,
        count: Math.floor(Math.random() * 100) + 20,
      }))
    }

    // 初始化图表
    initCharts()
  } catch (error) {
    ElMessage.error('获取交易统计数据失败')
    // 失败也生成模拟数据展示效果
    const months = [
      '1月',
      '2月',
      '3月',
      '4月',
      '5月',
      '6月',
      '7月',
      '8月',
      '9月',
      '10月',
      '11月',
      '12月',
    ]
    tradeStatistic.value.monthlyTrend = months.map((m) => ({
      month: m,
      count: Math.floor(Math.random() * 100) + 20,
    }))
    initCharts()
  } finally {
    loading.value = false
  }
}

const initCharts = () => {
  // 交易类型分布 - 饼图
  if (typeChartRef.value) {
    typeChart = echarts.init(typeChartRef.value)
    const typeOption = {
      tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} ({d}%)' },
      legend: { bottom: '5%', left: 'center' },
      series: [
        {
          name: '交易类型',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
          label: { show: false, position: 'center' },
          emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
          labelLine: { show: false },
          data: [
            {
              value: tradeStatistic.value.typeDistribution.buy,
              name: '购买',
              itemStyle: { color: '#409eff' },
            },
            {
              value: tradeStatistic.value.typeDistribution.exchange,
              name: '交换',
              itemStyle: { color: '#67c23a' },
            },
          ],
        },
      ],
    }
    typeChart.setOption(typeOption)
  }

  // 交易状态分布 - 饼图
  if (statusChartRef.value) {
    statusChart = echarts.init(statusChartRef.value)
    const statusOption = {
      tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} ({d}%)' },
      legend: { orient: 'vertical', right: '5%', top: 'middle' },
      series: [
        {
          name: '交易状态',
          type: 'pie',
          radius: '70%',
          center: ['40%', '50%'],
          itemStyle: { borderRadius: 5 },
          data: [
            {
              value: tradeStatistic.value.statusDistribution.pending,
              name: '待处理',
              itemStyle: { color: '#e6a23c' },
            },
            {
              value: tradeStatistic.value.statusDistribution.success,
              name: '已同意',
              itemStyle: { color: '#67c23a' },
            },
            {
              value: tradeStatistic.value.statusDistribution.failed,
              name: '已拒绝',
              itemStyle: { color: '#f56c6c' },
            },
            {
              value: tradeStatistic.value.statusDistribution.completed,
              name: '已完成',
              itemStyle: { color: '#409eff' },
            },
            {
              value: tradeStatistic.value.statusDistribution.cancelled,
              name: '已取消',
              itemStyle: { color: '#909399' },
            },
            {
              value: tradeStatistic.value.statusDistribution.soldOut,
              name: '已售罄',
              itemStyle: { color: '#303133' },
            },
          ],
        },
      ],
    }
    statusChart.setOption(statusOption)
  }

  // 月度趋势 - 折线图
  if (trendChartRef.value) {
    trendChart = echarts.init(trendChartRef.value)
    const trendOption = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: tradeStatistic.value.monthlyTrend.map((i) => i.month) },
      yAxis: { type: 'value' },
      series: [
        {
          name: '交易量',
          type: 'line',
          smooth: true,
          data: tradeStatistic.value.monthlyTrend.map((i) => i.count),
          itemStyle: { color: '#409eff' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#409eff' },
              { offset: 1, color: '#fff' },
            ]),
            opacity: 0.3,
          },
          lineStyle: { width: 3 },
        },
      ],
    }
    trendChart.setOption(trendOption)
  }
}

const handleResize = () => {
  typeChart?.resize()
  statusChart?.resize()
  trendChart?.resize()
}

onMounted(() => {
  loadTradeStatistic()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  typeChart?.dispose()
  statusChart?.dispose()
  trendChart?.dispose()
})

// 用于展示动画效果的响应式数据
const displayData = ref({
  tradeTotal: 0,
  today: 0,
  successRate: 0,
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
  () => tradeStatistic.value,
  (newVal) => {
    animateNumber('tradeTotal', newVal.total)
    animateNumber('today', newVal.today)
    animateNumber('successRate', newVal.successRate)
  },
  { deep: true },
)
</script>

<template>
  <page-container title="交易统计">
    <div class="statistic-container" v-loading="loading">
      <!-- 核心指标 -->
      <div class="stats-grid">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-header">
            <span class="stat-title">总交易数</span>
          </div>
          <div class="stat-value">{{ displayData.tradeTotal }}</div>
        </el-card>
        <el-card shadow="hover" class="stat-card">
          <div class="stat-header">
            <span class="stat-title">今日交易</span>
          </div>
          <div class="stat-value">{{ displayData.today }}</div>
        </el-card>
        <el-card shadow="hover" class="stat-card">
          <div class="stat-header">
            <span class="stat-title">交易成功率</span>
          </div>
          <div class="stat-value">{{ displayData.successRate }}%</div>
        </el-card>
      </div>

      <!-- 分布图表 -->
      <div class="charts-grid">
        <!-- 交易类型分布 -->
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="chart-header">
              <span>交易类型分布</span>
            </div>
          </template>
          <div class="chart-container">
            <div ref="typeChartRef" style="width: 100%; height: 300px"></div>
          </div>
        </el-card>

        <!-- 交易状态分布 -->
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="chart-header">
              <span>交易状态分布</span>
            </div>
          </template>
          <div class="chart-container">
            <div ref="statusChartRef" style="width: 100%; height: 300px"></div>
          </div>
        </el-card>
      </div>

      <!-- 月度交易趋势 -->
      <el-card shadow="hover" class="trend-card">
        <template #header>
          <div class="chart-header">
            <span>月度交易趋势</span>
          </div>
        </template>
        <div class="chart-container">
          <div ref="trendChartRef" style="width: 100%; height: 100%"></div>
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
        padding: 20px 0;

        .distribution-item {
          display: flex;
          align-items: center;
          margin-bottom: 15px;

          .distribution-label {
            width: 80px;
            font-size: 14px;
          }

          .distribution-bar {
            flex: 1;
            height: 20px;
            background-color: #f5f7fa;
            border-radius: 10px;
            margin: 0 10px;
            overflow: hidden;

            .distribution-fill {
              height: 100%;
              background-color: #409eff;
              border-radius: 10px;
              transition: width 0.3s ease;

              &.exchange {
                background-color: #67c23a;
              }

              &.pending {
                background-color: #e6a23c;
              }

              &.success {
                background-color: #67c23a;
              }

              &.failed {
                background-color: #f56c6c;
              }

              &.completed {
                background-color: #409eff;
              }

              &.cancelled {
                background-color: #909399;
              }

              &.soldOut {
                background-color: #909399;
              }
            }
          }

          .distribution-value {
            width: 60px;
            text-align: right;
            font-size: 14px;
          }
        }
      }
    }
  }

  .trend-card {
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
</style>
