<!-- eslint-disable no-undef -->
<!-- eslint-disable no-unused-vars -->
<script setup>
import { ref, onMounted } from 'vue'
import {
  getTradeListService,
  getTradeDetailService,
  updateTradeStatusService,
} from '@/api/admin/trade'
import { ElDialog } from 'element-plus'
import { Edit, RefreshLeft } from '@element-plus/icons-vue'
import { formatTime } from '@/utils/format'

const loading = ref(true)
const tradeList = ref([])
const total = ref(0)
const params = ref({
  pagenum: 1,
  pagesize: 10,
  status: '',
})
const dialogVisible = ref(false)
const currentTrade = ref({})

const getTradeList = async () => {
  loading.value = true
  try {
    const res = await getTradeListService(params.value)
    tradeList.value = res.data
    total.value = res.total
  } catch (error) {
    ElMessage.error('获取交易列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  params.value.pagenum = 1
  getTradeList()
}

const handleReset = () => {
  params.value = {
    pagenum: 1,
    pagesize: 10,
    status: '',
  }
  getTradeList()
}

const handleStatusChange = async (row) => {
  try {
    await updateTradeStatusService({ id: row.id, trade_status: row.trade_status })
    ElMessage.success('交易状态已更新')
  } catch (error) {
    ElMessage.error('操作失败')
    // 恢复原状态
    row.trade_status = row.trade_status === 1 ? 0 : 1
  }
}

const handleDetail = async (row) => {
  try {
    const res = await getTradeDetailService(row.id)
    currentTrade.value = res.data
    dialogVisible.value = true
  } catch (error) {
    ElMessage.error('获取交易详情失败')
  }
}

const getStatusText = (status) => {
  const statusMap = {
    0: '待处理',
    1: '已同意',
    2: '已拒绝',
    3: '已完成',
    4: '已取消',
    5: '已售罄',
  }
  return statusMap[status] || '未知状态'
}

const getTradeTypeText = (type) => {
  return type === 1 ? '购买' : '交换'
}

onMounted(() => {
  getTradeList()
})
</script>

<template>
  <page-container title="交易列表">
    <template #extra>
      <el-button type="primary" @click="handleSearch">
        <el-icon><RefreshLeft /></el-icon>
        刷新
      </el-button>
    </template>

    <!-- 搜索表单 -->
    <el-form :inline="true" class="search-form">
      <el-form-item label="交易状态">
        <el-select v-model="params.status" placeholder="请选择状态" style="width: 150px">
          <el-option label="全部" value="" />
          <el-option label="待处理" value="0" />
          <el-option label="已同意" value="1" />
          <el-option label="已拒绝" value="2" />
          <el-option label="已完成" value="3" />
          <el-option label="已取消" value="4" />
          <el-option label="已售罄" value="5" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 交易列表 -->
    <el-table :data="tradeList" style="width: 100%" v-loading="loading">
      <el-table-column prop="id" label="交易ID" width="80" />
      <el-table-column prop="applicant_id" label="申请人" width="100" />
      <el-table-column prop="owner_id" label="物主" width="100" />
      <el-table-column prop="goods_id" label="商品" width="150">
        <template #default="{ row }">
          <el-link type="primary" :underline="false" @click="handleDetail(row)">{{
            row.goods_name
          }}</el-link>
        </template>
      </el-table-column>
      <el-table-column prop="trade_type" label="交易类型" width="100">
        <template #default="{ row }">
          {{ getTradeTypeText(row.trade_type) }}
        </template>
      </el-table-column>
      <el-table-column prop="trade_status" label="状态" width="100">
        <template #default="{ row }">
          <el-select
            v-model="row.trade_status"
            @change="handleStatusChange(row)"
            style="width: 100%"
          >
            <el-option label="待处理" value="0" />
            <el-option label="已同意" value="1" />
            <el-option label="已拒绝" value="2" />
            <el-option label="已完成" value="3" />
            <el-option label="已取消" value="4" />
            <el-option label="已售罄" value="5" />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="申请时间" width="180">
        <template #default="{ row }">
          {{ formatTime(row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column prop="updated_at" label="处理时间" width="180">
        <template #default="{ row }">
          {{ row.updated_at ? formatTime(row.updated_at) : '-' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100">
        <template #default="{ row }">
          <el-button plain size="small" type="primary" :icon="Edit" @click="handleDetail(row)">
            详情
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <el-pagination
      v-model:current-page="params.pagenum"
      v-model:page-size="params.pagesize"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
      @size-change="getTradeList"
      @current-change="getTradeList"
      style="margin-top: 20px; text-align: right"
    />

    <!-- 交易详情对话框 -->
    <el-dialog v-model="dialogVisible" title="交易详情" width="600px">
      <el-form :model="currentTrade" label-width="100px">
        <el-form-item label="交易ID">
          <span>{{ currentTrade.id }}</span>
        </el-form-item>
        <el-form-item label="申请人">
          <span>{{ currentTrade.applicant_id }}</span>
        </el-form-item>
        <el-form-item label="物主">
          <span>{{ currentTrade.owner_id }}</span>
        </el-form-item>
        <el-form-item label="商品名称">
          <span>{{ currentTrade.goods_name }}</span>
        </el-form-item>
        <el-form-item label="交易类型">
          <span>{{ getTradeTypeText(currentTrade.trade_type) }}</span>
        </el-form-item>
        <el-form-item label="交易状态">
          <span>{{ getStatusText(currentTrade.trade_status) }}</span>
        </el-form-item>
        <el-form-item label="申请时间">
          <span>{{ formatTime(currentTrade.created_at) }}</span>
        </el-form-item>
        <el-form-item label="处理时间">
          <span>{{ currentTrade.updated_at ? formatTime(currentTrade.updated_at) : '-' }}</span>
        </el-form-item>
        <el-form-item label="交易金额">
          <span>{{
            currentTrade.trade_type === 1 ? `￥${currentTrade.trade_amount}` : '交换'
          }}</span>
        </el-form-item>
        <el-form-item label="交易备注">
          <span>{{ currentTrade.remark || '-' }}</span>
        </el-form-item>
      </el-form>
    </el-dialog>
  </page-container>
</template>

<style lang="scss" scoped>
.search-form {
  margin-bottom: 20px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
}
</style>
