<!-- eslint-disable no-undef -->
<!-- eslint-disable no-unused-vars -->
<script setup>
import { ref, onMounted } from 'vue'
import { getTradeListService, getTradeDetailService, updateTradeStatusService } from '@/api/trade'
import { getGoodsDetailService } from '@/api/goods'
import { ElDialog } from 'element-plus'
import { Edit, RefreshLeft } from '@element-plus/icons-vue'
import { formatTime } from '@/utils/format'
import { useUserListStore } from '@/stores/modules/userList'

const userListStore = useUserListStore()

const loading = ref(true)
const tradeList = ref([])
const list = ref([])
const total = ref(0)
const params = ref({
  pagenum: 1,
  pagesize: 10,
  status: '',
})
const dialogVisible = ref(false)
const goodsDialogVisible = ref(false)
const currentTrade = ref({})
const currentGoods = ref({})

const getTradeList = async () => {
  loading.value = true
  try {
    const res = await getTradeListService(params.value)
    list.value = res.data
    total.value = list.value.length || 0
    tradeList.value = list.value.slice(
      (params.value.pagenum - 1) * params.value.pagesize,
      params.value.pagenum * params.value.pagesize,
    )
    params.value.pagenum = 1
  } catch (error) {
    ElMessage.error('获取交易列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  if (params.value.status === 0) {
    params.value.status = ''
    getTradeList()
    return
  }
  params.value.pagenum = 1
  tradeList.value = list.value.filter((item) => item.trade_status === params.value.status)
  total.value = tradeList.value.length
}

const handleReset = () => {
  params.value = {
    pagenum: 1,
    pagesize: 10,
    status: '',
  }
  getTradeList()
}

const handlePage = () => {
  tradeList.value = list.value.slice(
    (params.value.pagenum - 1) * params.value.pagesize,
    params.value.pagenum * params.value.pagesize,
  )
}

const handleStatusChange = async (row) => {
  try {
    await updateTradeStatusService({
      trade_id: row.trade_id,
      to_user_id: row.to_user_id,
      trade_status: row.trade_status,
    })
    ElMessage.success('交易状态已更新')
  } catch (error) {
    ElMessage.error('操作失败')
    // 恢复原状态
    row.trade_status = row.trade_status === 1 ? 0 : 1
  }
}

const handleTradeDetail = async (row) => {
  try {
    const res = await getTradeDetailService(row.trade_id)
    currentTrade.value = res.data
    dialogVisible.value = true
  } catch (error) {
    ElMessage.error('获取交易详情失败')
  }
}

const handleGoodsDetail = async (row) => {
  try {
    const res = await getGoodsDetailService(row.goods_id)
    currentGoods.value = res.data.goods
    goodsDialogVisible.value = true
  } catch (error) {
    ElMessage.error('获取商品详情失败')
  }
}

const getStatusText = (status) => {
  const statusMap = {
    1: '待处理',
    2: '已同意',
    3: '已拒绝',
    4: '已完成',
    5: '已取消',
    6: '已售罄',
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
      <el-button type="primary" @click="getTradeList">
        <el-icon><RefreshLeft /></el-icon>
        刷新
      </el-button>
    </template>

    <!-- 搜索表单 -->
    <el-form :inline="true" class="search-form">
      <el-form-item label="交易状态">
        <el-select v-model="params.status" placeholder="请选择状态" style="width: 150px">
          <el-option label="全部" :value="0" />
          <el-option label="待处理" :value="1" />
          <el-option label="已同意" :value="2" />
          <el-option label="已拒绝" :value="3" />
          <el-option label="已完成" :value="4" />
          <el-option label="已取消" :value="5" />
          <el-option label="已售罄" :value="6" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 交易列表 -->
    <el-table :data="tradeList" style="width: 100%" v-loading="loading">
      <el-table-column prop="trade_id" label="交易ID" width="80" align="center" />
      <el-table-column prop="from_user_id" label="申请人" min-width="100" align="center">
        <template #default="{ row }">
          {{
            userListStore.userList.find((user) => user.user_id === row.from_user_id)
              ?.user_nickname || '-'
          }}
        </template>
      </el-table-column>
      <el-table-column prop="to_user_id" label="物主" min-width="100" align="center">
        <template #default="{ row }">
          {{
            userListStore.userList.find((user) => user.user_id === row.to_user_id)?.user_nickname ||
            '-'
          }}
        </template>
      </el-table-column>
      <el-table-column prop="goods_id" label="商品ID" width="80" align="center">
        <template #default="{ row }">
          <el-link type="primary" :underline="false" @click="handleGoodsDetail(row)">{{
            row.goods_id
          }}</el-link>
        </template>
      </el-table-column>
      <el-table-column prop="trade_type" label="交易类型" width="100" align="center">
        <template #default="{ row }">
          {{ getTradeTypeText(row.trade_type) }}
        </template>
      </el-table-column>
      <el-table-column prop="trade_status" label="状态" width="110" align="center">
        <template #default="{ row }">
          <el-select
            v-model="row.trade_status"
            @change="handleStatusChange(row)"
            style="width: 100%"
          >
            <el-option label="待处理" :value="1" />
            <el-option label="已同意" :value="2" />
            <el-option label="已拒绝" :value="3" />
            <el-option label="已完成" :value="4" />
            <el-option label="已取消" :value="5" />
            <el-option label="已售罄" :value="6" />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="申请时间" width="180" align="center">
        <template #default="{ row }">
          {{ formatTime(row.create_time) }}
        </template>
      </el-table-column>
      <el-table-column prop="updated_at" label="处理时间" width="180" align="center">
        <template #default="{ row }">
          {{ row.handle_time !== row.create_time ? formatTime(row.handle_time) : '-' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100" align="center">
        <template #default="{ row }">
          <el-button plain size="small" type="primary" :icon="Edit" @click="handleTradeDetail(row)">
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
      :background="true"
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
      @size-change="handlePage"
      @current-change="handlePage"
      style="margin-top: 20px; display: flex; justify-content: flex-end"
    />

    <!-- 交易详情对话框 -->
    <el-dialog v-model="dialogVisible" title="交易详情" width="600px">
      <el-form :model="currentTrade" label-width="100px">
        <el-form-item label="交易ID：">
          <span>{{ currentTrade.trade_id }}</span>
        </el-form-item>
        <el-form-item label="申请人：">
          <span>{{
            userListStore.userList.find((user) => user.user_id === currentTrade.from_user_id)
              ?.user_nickname || '-'
          }}</span>
        </el-form-item>
        <el-form-item label="物主：">
          <span>{{
            userListStore.userList.find((user) => user.user_id === currentTrade.to_user_id)
              ?.user_nickname || '-'
          }}</span>
        </el-form-item>
        <el-form-item label="商品ID：">
          <span>{{ currentTrade.goods_id }}</span>
        </el-form-item>
        <el-form-item label="交易类型：">
          <span>{{ getTradeTypeText(currentTrade.trade_type) }}</span>
        </el-form-item>
        <el-form-item label="交易状态：">
          <span>{{ getStatusText(currentTrade.trade_status) }}</span>
        </el-form-item>
        <el-form-item label="申请时间：">
          <span>{{ formatTime(currentTrade.created_at) }}</span>
        </el-form-item>
        <el-form-item label="处理时间：">
          <span>{{
            currentTrade.updated_at ? formatTime(currentTrade.updated_at) : '未处理'
          }}</span>
        </el-form-item>
        <el-form-item :label="currentTrade.trade_type === 1 ? '交易金额：' : '交换商品：'">
          <span>{{
            currentTrade.trade_type === 1
              ? `￥${currentTrade.apply_price}`
              : currentTrade.apply_item || '-'
          }}</span>
        </el-form-item>
        <el-form-item label="交易备注：">
          <span>{{ currentTrade.apply_desc || '-' }}</span>
        </el-form-item>
      </el-form>
    </el-dialog>
    <!-- 商品详情对话框 -->
    <el-dialog v-model="goodsDialogVisible" title="商品详情" width="600px">
      <el-form :model="currentTrade" label-width="100px">
        <el-form-item label="商品ID：">
          <span>{{ currentGoods.goods_id }}</span>
        </el-form-item>
        <el-form-item label="商品名称：">
          <span>{{ currentGoods.goods_name }}</span>
        </el-form-item>
        <el-form-item label="商品描述：">
          <span>{{ currentGoods.goods_desc || '-' }}</span>
        </el-form-item>
        <el-form-item label="商品分类：">
          <span>{{ currentGoods.cate_id }}</span>
        </el-form-item>
        <el-form-item label="价格/交换：">
          <!-- 流转类型：1-只换，2-只卖，3-可换可卖 -->
          <span>{{
            currentGoods.goods_type < 3
              ? currentGoods.goods_type === 2
                ? '￥' + currentGoods.goods_price
                : currentGoods.exchange_want
              : '￥' + currentGoods.goods_price + ' / ' + currentGoods.exchange_want
          }}</span>
        </el-form-item>
        <el-form-item label="商品状态：">
          <span>{{ currentGoods.goods_status === 1 ? '正常' : '停用' }}</span>
        </el-form-item>
        <el-form-item label="创建时间：">
          <span>{{ formatTime(currentGoods.created_at) }}</span>
        </el-form-item>
        <el-form-item label="更新时间：">
          <span>{{
            currentGoods.updated_at ? formatTime(currentGoods.updated_at) : '未更新'
          }}</span>
        </el-form-item>
      </el-form>
    </el-dialog>
  </page-container>
</template>

<style lang="scss" scoped>
.search-form {
  margin-bottom: 10px;
  // padding: 20px;
  // background-color: #f5f7fa;
  // border-radius: 4px;
}
</style>
