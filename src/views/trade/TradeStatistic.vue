<!-- eslint-disable no-unused-vars -->
<script setup>
import { ref, onMounted } from 'vue'
import { getTradeStatisticService } from '@/api/admin/trade'
import { ElMessage } from 'element-plus'

const loading = ref(true)
const tradeStatistic = ref({
  total: 0,
  today: 0,
  successRate: 0,
  typeDistribution: {
    buy: 0,
    exchange: 0,
  },
  statusDistribution: {
    pending: 0,
    success: 0,
    failed: 0,
    completed: 0,
    cancelled: 0,
    soldOut: 0,
  },
  monthlyTrend: [],
})

const loadTradeStatistic = async () => {
  loading.value = true
  try {
    const res = await getTradeStatisticService()
    tradeStatistic.value = res.data
  } catch (error) {
    ElMessage.error('获取交易统计数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadTradeStatistic()
})
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
          <div class="stat-value">{{ tradeStatistic.total }}</div>
        </el-card>
        <el-card shadow="hover" class="stat-card">
          <div class="stat-header">
            <span class="stat-title">今日交易</span>
          </div>
          <div class="stat-value">{{ tradeStatistic.today }}</div>
        </el-card>
        <el-card shadow="hover" class="stat-card">
          <div class="stat-header">
            <span class="stat-title">交易成功率</span>
          </div>
          <div class="stat-value">{{ tradeStatistic.successRate }}%</div>
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
            <div class="distribution-item">
              <span class="distribution-label">购买</span>
              <div class="distribution-bar">
                <div
                  class="distribution-fill"
                  :style="{
                    width: `${(tradeStatistic.typeDistribution.buy / (tradeStatistic.typeDistribution.buy + tradeStatistic.typeDistribution.exchange) || 0) * 100}%`,
                  }"
                ></div>
              </div>
              <span class="distribution-value">{{ tradeStatistic.typeDistribution.buy }}</span>
            </div>
            <div class="distribution-item">
              <span class="distribution-label">交换</span>
              <div class="distribution-bar">
                <div
                  class="distribution-fill exchange"
                  :style="{
                    width: `${(tradeStatistic.typeDistribution.exchange / (tradeStatistic.typeDistribution.buy + tradeStatistic.typeDistribution.exchange) || 0) * 100}%`,
                  }"
                ></div>
              </div>
              <span class="distribution-value">{{ tradeStatistic.typeDistribution.exchange }}</span>
            </div>
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
            <div class="distribution-item">
              <span class="distribution-label">待处理</span>
              <div class="distribution-bar">
                <div
                  class="distribution-fill pending"
                  :style="{
                    width: `${(tradeStatistic.statusDistribution.pending / tradeStatistic.total || 0) * 100}%`,
                  }"
                ></div>
              </div>
              <span class="distribution-value">{{
                tradeStatistic.statusDistribution.pending
              }}</span>
            </div>
            <div class="distribution-item">
              <span class="distribution-label">已同意</span>
              <div class="distribution-bar">
                <div
                  class="distribution-fill success"
                  :style="{
                    width: `${(tradeStatistic.statusDistribution.success / tradeStatistic.total || 0) * 100}%`,
                  }"
                ></div>
              </div>
              <span class="distribution-value">{{
                tradeStatistic.statusDistribution.success
              }}</span>
            </div>
            <div class="distribution-item">
              <span class="distribution-label">已拒绝</span>
              <div class="distribution-bar">
                <div
                  class="distribution-fill failed"
                  :style="{
                    width: `${(tradeStatistic.statusDistribution.failed / tradeStatistic.total || 0) * 100}%`,
                  }"
                ></div>
              </div>
              <span class="distribution-value">{{ tradeStatistic.statusDistribution.failed }}</span>
            </div>
            <div class="distribution-item">
              <span class="distribution-label">已完成</span>
              <div class="distribution-bar">
                <div
                  class="distribution-fill completed"
                  :style="{
                    width: `${(tradeStatistic.statusDistribution.completed / tradeStatistic.total || 0) * 100}%`,
                  }"
                ></div>
              </div>
              <span class="distribution-value">{{
                tradeStatistic.statusDistribution.completed
              }}</span>
            </div>
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
          <el-empty v-if="tradeStatistic.monthlyTrend.length === 0" description="暂无数据" />
          <div v-else>
            <!-- 这里将使用ECharts实现图表 -->
            <div class="chart-placeholder">月度交易趋势图表</div>
          </div>
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
        color: #333;
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
