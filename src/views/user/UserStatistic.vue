<!-- eslint-disable no-unused-vars -->
<script setup>
import { ref, onMounted } from 'vue'
import { getUserStatisticService } from '@/api/admin/user'
import { ElMessage } from 'element-plus'

const loading = ref(true)
const userStatistic = ref({
  total: 0,
  today: 0,
  active: 0,
  trend: [],
  activeTrend: [],
})

const loadUserStatistic = async () => {
  loading.value = true
  try {
    const res = await getUserStatisticService()
    userStatistic.value = res.data
  } catch (error) {
    ElMessage.error('获取用户统计数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadUserStatistic()
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
          <div class="stat-value">{{ userStatistic.total }}</div>
        </el-card>
        <el-card shadow="hover" class="stat-card">
          <div class="stat-header">
            <span class="stat-title">今日新增</span>
          </div>
          <div class="stat-value">{{ userStatistic.today }}</div>
        </el-card>
        <el-card shadow="hover" class="stat-card">
          <div class="stat-header">
            <span class="stat-title">活跃用户</span>
          </div>
          <div class="stat-value">{{ userStatistic.active }}</div>
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
            <el-empty v-if="userStatistic.trend.length === 0" description="暂无数据" />
            <div v-else>
              <!-- 这里将使用ECharts实现图表 -->
              <div class="chart-placeholder">每日新增用户趋势图表</div>
            </div>
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
            <el-empty v-if="userStatistic.activeTrend.length === 0" description="暂无数据" />
            <div v-else>
              <!-- 这里将使用ECharts实现图表 -->
              <div class="chart-placeholder">活跃用户趋势图表</div>
            </div>
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
          <el-empty description="暂无数据" />
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
