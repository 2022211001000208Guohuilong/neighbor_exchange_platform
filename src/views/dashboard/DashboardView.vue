<!-- eslint-disable no-unused-vars -->
<script setup>
import { ref, onMounted } from 'vue'
import { getOverviewStatisticsService, getTrendStatisticsService } from '@/api/admin/statistics'
import { ElMessage } from 'element-plus'

const loading = ref(true)
const overviewData = ref({
  user: {
    total: 0,
    today: 0,
    active: 0,
  },
  goods: {
    total: 0,
    pending: 0,
    online: 0,
    offline: 0,
  },
  trade: {
    total: 0,
    today: 0,
    successRate: 0,
  },
  interaction: {
    collect: 0,
    message: 0,
  },
})

const userTrend = ref([])
const goodsTrend = ref([])
const tradeTrend = ref([])

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
    userTrend.value = res.data.userTrend
    goodsTrend.value = res.data.goodsTrend
    tradeTrend.value = res.data.tradeTrend
  } catch (error) {
    ElMessage.error('获取趋势数据失败')
  }
}

onMounted(async () => {
  await Promise.all([loadOverviewData(), loadTrendData()])
  loading.value = false
})
</script>

<template>
  <page-container title="数据看板">
    <div class="dashboard-container" v-loading="loading">
      <!-- 核心指标卡片 -->
      <div class="stats-grid">
        <!-- 用户数据 -->
        <el-card shadow="hover" class="stat-card">
          <div class="stat-header">
            <span class="stat-title">总用户数</span>
            <el-icon class="stat-icon"><UserFilled /></el-icon>
          </div>
          <div class="stat-value">{{ overviewData.user.total }}</div>
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
          <div class="stat-value">{{ overviewData.goods.total }}</div>
          <div class="stat-info">
            <span class="stat-desc">待审核: {{ overviewData.goods.pending }}</span>
            <span class="stat-desc">上架: {{ overviewData.goods.online }}</span>
          </div>
        </el-card>

        <!-- 交易数据 -->
        <el-card shadow="hover" class="stat-card">
          <div class="stat-header">
            <span class="stat-title">总交易数</span>
            <el-icon class="stat-icon"><Trades /></el-icon>
          </div>
          <div class="stat-value">{{ overviewData.trade.total }}</div>
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
          <div class="stat-value">{{ overviewData.interaction.collect }}</div>
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
            <el-empty v-if="userTrend.length === 0" description="暂无数据" />
            <div v-else>
              <!-- 这里将使用ECharts实现图表 -->
              <div class="chart-placeholder">用户增长趋势图表</div>
            </div>
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
            <el-empty v-if="goodsTrend.length === 0" description="暂无数据" />
            <div v-else>
              <!-- 这里将使用ECharts实现图表 -->
              <div class="chart-placeholder">商品发布趋势图表</div>
            </div>
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
            <el-empty v-if="tradeTrend.length === 0" description="暂无数据" />
            <div v-else>
              <!-- 这里将使用ECharts实现图表 -->
              <div class="chart-placeholder">交易趋势图表</div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 最近动态 -->
      <div class="recent-activity">
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
      </div>
    </div>
  </page-container>
</template>

<style lang="scss" scoped>
.dashboard-container {
  padding: 20px 0;

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 30px;

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
        color: #333;
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
