<!-- eslint-disable no-unused-vars -->
<script setup>
import { ref, onMounted } from 'vue'
import {
  getGoodsListService,
  editGoodsService,
  deleteGoodsService,
  getGoodsCategoryService,
} from '@/api/admin/goods'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Edit, Delete, RefreshLeft } from '@element-plus/icons-vue'
import { formatTime } from '@/utils/format'

const loading = ref(true)
const goodsList = ref([])
const total = ref(0)
const categoryList = ref([])
const params = ref({
  pagenum: 1,
  pagesize: 10,
  name: '',
  user_id: '',
  status: '',
  cate_id: '',
})

const getGoodsList = async () => {
  loading.value = true
  try {
    const res = await getGoodsListService(params.value)
    goodsList.value = res.data
    total.value = res.total
  } catch (error) {
    ElMessage.error('获取商品列表失败')
  } finally {
    loading.value = false
  }
}

const getCategoryList = async () => {
  try {
    const res = await getGoodsCategoryService()
    categoryList.value = res.data
  } catch (error) {
    ElMessage.error('获取商品分类失败')
  }
}

const handleSearch = () => {
  params.value.pagenum = 1
  getGoodsList()
}

const handleReset = () => {
  params.value = {
    pagenum: 1,
    pagesize: 10,
    name: '',
    user_id: '',
    status: '',
    cate_id: '',
  }
  getGoodsList()
}

const handleStatusChange = async (row) => {
  try {
    await editGoodsService({ id: row.id, goods_status: row.goods_status })
    ElMessage.success('商品状态已更新')
  } catch (error) {
    ElMessage.error('操作失败')
    // 恢复原状态
    row.goods_status = row.goods_status === 1 ? 0 : 1
  }
}

const handleEdit = (row) => {
  // 编辑商品信息，这里可以跳转到详情页或弹出编辑对话框
  ElMessage.info('编辑功能开发中')
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除该商品吗？', '温馨提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'danger',
  })
    .then(async () => {
      try {
        await deleteGoodsService(row.id)
        ElMessage.success('商品删除成功')
        getGoodsList()
      } catch (error) {
        ElMessage.error('商品删除失败')
      }
    })
    .catch(() => {})
}

const handleDetail = (row) => {
  // 查看商品详情
  ElMessage.info('详情功能开发中')
}

onMounted(async () => {
  await Promise.all([getGoodsList(), getCategoryList()])
})
</script>

<template>
  <page-container title="商品列表">
    <template #extra>
      <el-button type="primary" @click="handleSearch">
        <el-icon><RefreshLeft /></el-icon>
        刷新
      </el-button>
    </template>

    <!-- 搜索表单 -->
    <el-form :inline="true" class="search-form">
      <el-form-item label="商品名称">
        <el-input v-model="params.name" placeholder="请输入商品名称" style="width: 200px" />
      </el-form-item>
      <el-form-item label="分类">
        <el-select v-model="params.cate_id" placeholder="请选择分类" style="width: 150px">
          <el-option label="全部" value="" />
          <el-option
            v-for="item in categoryList"
            :key="item.id"
            :label="item.cate_name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="params.status" placeholder="请选择状态" style="width: 120px">
          <el-option label="全部" value="" />
          <el-option label="上架" value="1" />
          <el-option label="下架" value="0" />
          <el-option label="待审核" value="3" />
          <el-option label="审核拒绝" value="4" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 商品列表 -->
    <el-table :data="goodsList" style="width: 100%" v-loading="loading">
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
      <el-table-column prop="goods_status" label="状态" width="100">
        <template #default="{ row }">
          <el-switch
            v-model="row.goods_status"
            :active-value="1"
            :inactive-value="0"
            @change="handleStatusChange(row)"
            :disabled="row.goods_status === 3 || row.goods_status === 4"
          />
        </template>
      </el-table-column>
      <el-table-column prop="goods_view" label="浏览量" width="80" />
      <el-table-column prop="created_at" label="创建时间" width="180">
        <template #default="{ row }">
          {{ formatTime(row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150">
        <template #default="{ row }">
          <el-button plain size="small" type="primary" :icon="Edit" @click="handleEdit(row)">
            编辑
          </el-button>
          <el-button plain size="small" type="danger" :icon="Delete" @click="handleDelete(row)">
            删除
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
      @size-change="getGoodsList"
      @current-change="getGoodsList"
      style="margin-top: 20px; text-align: right"
    />
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
