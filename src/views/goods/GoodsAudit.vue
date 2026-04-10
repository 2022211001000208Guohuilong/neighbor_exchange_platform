<!-- eslint-disable no-unused-vars -->
<script setup>
import { ref, onMounted } from 'vue'
import {
  getPendingGoodsService,
  auditGoodsService,
  getGoodsCategoryService,
  getGoodsDetailService,
} from '@/api/goods'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Check, Close, RefreshLeft } from '@element-plus/icons-vue'
import { formatTime } from '@/utils/format'
import { useUserListStore } from '@/stores/modules/userList'
import { sendSystemMessageService } from '@/api/message'

const userListStore = useUserListStore()

const loading = ref(true)
const list = ref([])
const pendingGoodsList = ref([])
const total = ref(0)
const categoryList = ref([])
const detailDialogVisible = ref(false)
const detailLoading = ref(false)
const currentGoods = ref({})
const params = ref({
  pagenum: 1,
  pagesize: 10,
  name: '',
  user_id: '',
  status: '',
  cate_id: '',
})

const getPendingGoods = async () => {
  loading.value = true
  try {
    const res = await getPendingGoodsService()
    list.value = res.data
    total.value = list.value.length || 0
    //分页处理
    pendingGoodsList.value = list.value.slice(
      (params.value.pagenum - 1) * params.value.pagesize,
      params.value.pagenum * params.value.pagesize,
    )
    getCategoryList()
  } catch (error) {
    ElMessage.error('获取待审核商品失败')
  } finally {
    loading.value = false
  }
}

const getCategoryList = async () => {
  await getGoodsCategoryService()
    .then((res) => {
      categoryList.value = res.data
    })
    .catch(() => {
      ElMessage.error('获取商品分类失败')
    })
}

const handleAuditPass = (row) => {
  ElMessageBox.confirm('确定要审核通过该商品吗？', '温馨提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'success',
  })
    .then(async () => {
      try {
        await auditGoodsService({ goods_id: row.goods_id, audit_status: 2 })
        await sendSystemMessageService({
          user_id: Number(row.user_id),
          msg_content: `您发布的商品${row.goods_name}已通过审核并上架`,
          msg_type: 1,
        })
        ElMessage.success('商品审核通过')
        getPendingGoods()
      } catch (error) {
        ElMessage.error('审核操作失败')
      }
    })
    .catch(() => {})
}

const handleAuditReject = (row) => {
  ElMessageBox.prompt('请输入驳回原因', '审核驳回', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPlaceholder: '请输入驳回原因',
  })
    .then(async ({ value }) => {
      try {
        if (!value) {
          ElMessage.error('请输入驳回原因')
          return
        }
        await auditGoodsService({ goods_id: row.goods_id, audit_status: 3, reject_reason: value })
        await sendSystemMessageService({
          user_id: Number(row.user_id),
          msg_content: `您发布的商品${row.goods_name}已驳回，驳回原因：${value}`,
          msg_type: 1,
        })
        ElMessage.success('商品审核驳回')
        getPendingGoods()
      } catch (error) {
        ElMessage.error('审核操作失败')
      }
    })
    .catch(() => {})
}

const getGoodsTypeText = (goods_type) => {
  if (goods_type === 1) return '只换'
  if (goods_type === 2) return '只卖'
  if (goods_type === 3) return '可换可卖'
  return '-'
}

const getGoodsStatusText = (goods_status) => {
  if (goods_status === 1) return '已上架'
  if (goods_status === 2) return '已成交'
  if (goods_status === 3) return '审核中'
  if (goods_status === 4) return '已取消'
  if (goods_status === 5) return '审核不通过'
  return '-'
}

const getGoodsPicList = (goods_pic) => {
  if (!goods_pic) return []
  if (Array.isArray(goods_pic)) return goods_pic.filter(Boolean)
  return String(goods_pic)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

const getPriceOrExchangeText = (goods) => {
  if (!goods) return '-'
  if (goods.goods_type === 1) return goods.exchange_want || '无'
  if (goods.goods_type === 2) return `￥${goods.goods_price ?? 0}`
  if (goods.goods_type === 3) return `￥${goods.goods_price ?? 0}/${goods.exchange_want || '无'}`
  return '-'
}

const handleDetail = async (row) => {
  detailDialogVisible.value = true
  detailLoading.value = true
  try {
    const res = await getGoodsDetailService(row.goods_id)
    currentGoods.value = res.data.goods || {}
  } catch (error) {
    ElMessage.error('获取商品详情失败')
    currentGoods.value = { ...row }
  } finally {
    detailLoading.value = false
  }
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
      <el-table-column prop="goods_id" label="商品ID" min-width="30" align="center" />
      <el-table-column prop="goods_name" label="商品名称" min-width="80">
        <template #default="{ row }">
          <el-link type="primary" :underline="false" @click="handleDetail(row)">{{
            row.goods_name
          }}</el-link>
        </template>
      </el-table-column>
      <el-table-column prop="cate_id" label="分类" min-width="50">
        <template #default="{ row }">
          {{ categoryList.find((item) => item.cate_id === row.cate_id)?.cate_name || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="user_id" label="发布者" min-width="40" align="center">
        <template #default="{ row }">
          {{
            userListStore.userList.find((user) => user.user_id === row.user_id)?.user_nickname ||
            '-'
          }}
        </template>
      </el-table-column>
      <el-table-column prop="goods_price" label="价格/交换" min-width="150">
        <template #default="{ row }">
          <!-- 流转类型：1-只换，2-只卖，3-可换可卖 -->
          {{
            row.goods_type === 1
              ? row.exchange_want || '无'
              : row.goods_type === 2
                ? `￥${row.goods_price}`
                : row.goods_type === 3
                  ? `￥${row.goods_price}/${row.exchange_want || '无'}`
                  : `￥${row.goods_price}`
          }}
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" min-width="60">
        <template #default="{ row }">
          {{ formatTime(row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" min-width="50" align="center">
        <template #default="{ row }">
          <el-button plain size="small" type="success" @click="handleAuditPass(row)">
            通过
          </el-button>
          <el-button plain size="small" type="danger" @click="handleAuditReject(row)">
            驳回
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="detailDialogVisible" title="商品详情" width="700px">
      <div v-loading="detailLoading">
        <el-form :model="currentGoods" label-width="100px">
          <el-form-item label="商品ID：">
            <span>{{ currentGoods.goods_id }}</span>
          </el-form-item>
          <el-form-item label="发布者：">
            <span>{{
              userListStore.userList.find((user) => user.user_id === currentGoods.user_id)
                ?.user_nickname || '-'
            }}</span>
          </el-form-item>
          <el-form-item label="商品名称：">
            <span>{{ currentGoods.goods_name || '-' }}</span>
          </el-form-item>
          <el-form-item label="商品描述：">
            <span>{{ currentGoods.goods_desc || '-' }}</span>
          </el-form-item>
          <el-form-item label="商品图片：">
            <div style="display: flex; gap: 8px; flex-wrap: wrap">
              <el-image
                v-for="(url, idx) in getGoodsPicList(currentGoods.goods_pic)"
                :key="`${url}-${idx}`"
                :src="url"
                style="width: 80px; height: 80px"
                fit="cover"
                :preview-src-list="getGoodsPicList(currentGoods.goods_pic)"
                :initial-index="idx"
                preview-teleported
              />
              <span v-if="getGoodsPicList(currentGoods.goods_pic).length === 0">-</span>
            </div>
          </el-form-item>
          <el-form-item label="分类：">
            <span>{{
              categoryList.find((item) => item.cate_id === currentGoods.cate_id)?.cate_name || '-'
            }}</span>
          </el-form-item>
          <el-form-item label="新旧程度：">
            <span>{{ currentGoods.goods_new_level || '-' }}</span>
          </el-form-item>
          <el-form-item label="类型：">
            <span>{{ getGoodsTypeText(currentGoods.goods_type) }}</span>
          </el-form-item>
          <el-form-item label="价格/交换：">
            <span>{{ getPriceOrExchangeText(currentGoods) }}</span>
          </el-form-item>
          <el-form-item label="经纬度：">
            <span>{{ currentGoods.goods_lng || '-' }}, {{ currentGoods.goods_lat || '-' }}</span>
          </el-form-item>
          <el-form-item label="浏览量：">
            <span>{{ currentGoods.browse_count ?? '-' }}</span>
          </el-form-item>
          <el-form-item label="状态：">
            <span>{{ getGoodsStatusText(currentGoods.goods_status) }}</span>
          </el-form-item>
          <el-form-item label="创建时间：">
            <span>{{ currentGoods.create_time ? formatTime(currentGoods.created_at) : '-' }}</span>
          </el-form-item>
          <el-form-item label="更新时间：">
            <span>{{ currentGoods.update_time ? formatTime(currentGoods.updated_at) : '-' }}</span>
          </el-form-item>
        </el-form>
      </div>
    </el-dialog>

    <!-- 分页 -->
    <el-pagination
      v-model:current-page="params.pagenum"
      v-model:page-size="params.pagesize"
      :page-sizes="[10, 20, 50, 100]"
      :background="true"
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
      @size-change="getPendingGoods"
      @current-change="getPendingGoods"
      class="pagination"
    />
  </page-container>
</template>

<style lang="scss" scoped>
.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
