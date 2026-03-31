<!-- eslint-disable no-unused-vars -->
<script setup>
import { ref, onMounted } from 'vue'
import { getPendingGoodsService, auditGoodsService } from '@/api/admin/goods'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Check, Close, RefreshLeft } from '@element-plus/icons-vue'
import { formatTime } from '@/utils/format'

const loading = ref(true)
const pendingGoodsList = ref([])
const total = ref(0)

const getPendingGoods = async () => {
  loading.value = true
  try {
    const res = await getPendingGoodsService()
    pendingGoodsList.value = res.data
    total.value = res.total
  } catch (error) {
    ElMessage.error('获取待审核商品失败')
  } finally {
    loading.value = false
  }
}

const handleAuditPass = (row) => {
  ElMessageBox.confirm('确定要审核通过该商品吗？', '温馨提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'success',
  })
    .then(async () => {
      try {
        await auditGoodsService({ id: row.id, status: 1 })
        ElMessage.success('商品审核通过')
        getPendingGoods()
      } catch (error) {
        ElMessage.error('审核操作失败')
      }
    })
    .catch(() => {})
}

const handleAuditReject = (row) => {
  ElMessageBox.prompt('请输入拒绝原因', '审核拒绝', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPlaceholder: '请输入拒绝原因',
  })
    .then(async ({ value }) => {
      try {
        await auditGoodsService({ id: row.id, status: 4, reason: value })
        ElMessage.success('商品审核拒绝')
        getPendingGoods()
      } catch (error) {
        ElMessage.error('审核操作失败')
      }
    })
    .catch(() => {})
}

const handleDetail = (row) => {
  // 查看商品详情
  ElMessage.info('详情功能开发中')
}

onMounted(() => {
  getPendingGoods()
})
</script>

<template>
  <page-container title="商品审核">
    <template #extra>
      <el-button type="primary" @click="getPendingGoods">
        <el-icon><RefreshLeft /></el-icon>
        刷新
      </el-button>
    </template>

    <!-- 待审核商品列表 -->
    <el-table :data="pendingGoodsList" style="width: 100%" v-loading="loading">
      <el-table-column prop="id" label="商品ID" width="80" />
      <el-table-column prop="goods_name" label="商品名称" min-width="200">
        <template #default="{ row }">
          <el-link type="primary" :underline="false" @click="handleDetail(row)">{{
            row.goods_name
          }}</el-link>
        </template>
      </el-table-column>
      <el-table-column prop="cate_name" label="分类" width="120" />
      <el-table-column prop="user_id" label="发布者" width="100" />
      <el-table-column prop="goods_price" label="价格/交换" width="120">
        <template #default="{ row }">
          {{ row.goods_type === 1 ? `￥${row.goods_price}` : '交换' }}
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="180">
        <template #default="{ row }">
          {{ formatTime(row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button plain size="small" type="success" :icon="Check" @click="handleAuditPass(row)">
            审核通过
          </el-button>
          <el-button plain size="small" type="danger" :icon="Close" @click="handleAuditReject(row)">
            审核拒绝
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <!-- <el-pagination
      v-model:current-page="1"
      v-model:page-size="10"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
      style="margin-top: 20px; text-align: right"
    /> -->
  </page-container>
</template>

<style lang="scss" scoped></style>
