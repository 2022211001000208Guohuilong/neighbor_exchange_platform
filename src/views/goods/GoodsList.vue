<!-- eslint-disable no-unused-vars -->
<script setup>
import { ref, onMounted } from 'vue'
import {
  getGoodsListService,
  editGoodsService,
  deleteGoodsService,
  getGoodsCategoryService,
} from '@/api/goods'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Edit, Delete, RefreshLeft } from '@element-plus/icons-vue'
import { formatTime } from '@/utils/format'
import { useUserListStore } from '@/stores/modules/userList'

const userListStore = useUserListStore()

const loading = ref(true)
const list = ref([])
const goodsList = ref([])
const total = ref(0)
const categoryList = ref([])
const editDialogVisible = ref(false)
const editFormRef = ref(null)
const editForm = ref({
  goods_id: null,
  user_id: null,
  cate_id: null,
  goods_name: '',
  goods_desc: '',
  goods_pic: '',
  goods_new_level: 1,
  goods_type: 1,
  goods_price: 0,
  exchange_want: '',
  goods_lng: '',
  goods_lat: '',
  goods_status: 3,
})
const editRules = {
  user_id: [{ required: true, message: '请输入用户ID', trigger: 'blur' }],
  cate_id: [{ required: true, message: '请选择分类', trigger: 'change' }],
  goods_name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  goods_type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  goods_status: [{ required: true, message: '请选择状态', trigger: 'change' }],
}
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
  await getGoodsListService(params.value)
    .then((res) => {
      list.value = res.data
      total.value = list.value.length || 0
      //分页处理
      goodsList.value = list.value.slice(
        (params.value.pagenum - 1) * params.value.pagesize,
        params.value.pagenum * params.value.pagesize,
      )
    })
    .catch(() => {
      ElMessage.error('获取商品列表失败')
    })
    .finally(() => {
      loading.value = false
    })
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
    await editGoodsService({
      goods_id: row.goods_id,
      user_id: row.user_id,
      cate_id: row.cate_id,
      goods_name: row.goods_name,
      goods_desc: row.goods_desc,
      goods_pic: row.goods_pic,
      goods_new_level: row.goods_new_level,
      goods_type: row.goods_type,
      goods_price: row.goods_price,
      exchange_want: row.exchange_want,
      goods_lng: row.goods_lng,
      goods_lat: row.goods_lat,
      goods_status: row.goods_status,
    })
    ElMessage.success('商品状态已更新')
  } catch (error) {
    ElMessage.error('操作失败')
    // 恢复原状态
    row.goods_status = row.goods_status === 1 ? 0 : 1
  }
}

const handleEdit = (row) => {
  editForm.value = {
    goods_id: row.goods_id,
    user_id: row.user_id,
    cate_id: row.cate_id,
    goods_name: row.goods_name,
    goods_desc: row.goods_desc,
    goods_pic: row.goods_pic,
    goods_new_level: row.goods_new_level,
    goods_type: row.goods_type,
    goods_price: row.goods_price,
    exchange_want: row.exchange_want,
    goods_lng: row.goods_lng,
    goods_lat: row.goods_lat,
    goods_status: row.goods_status,
  }
  editDialogVisible.value = true
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除该商品吗？', '温馨提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'danger',
  })
    .then(async () => {
      try {
        await deleteGoodsService(row.goods_id, row.user_id)
        ElMessage.success('商品删除成功')
        getGoodsList()
      } catch (error) {
        ElMessage.error('商品删除失败')
      }
    })
    .catch(() => {})
}

const handleEditSubmit = () => {
  if (editForm.value.goods_type !== 2) {
    editForm.value.goods_price = 0
  }
  editFormRef.value?.validate(async (valid) => {
    if (!valid) return
    try {
      await editGoodsService({ ...editForm.value })
      ElMessage.success('保存成功')
      editDialogVisible.value = false
      await getGoodsList()
    } catch {
      ElMessage.error('保存失败')
    }
  })
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
            :key="item.cate_id"
            :label="item.cate_name"
            :value="item.cate_id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="params.status" placeholder="请选择状态" style="width: 120px">
          <!-- 物品状态：1-上架，2-已成交，3-审核中，4-已取消，5-审核不通过 -->
          <el-option label="全部" :value="''" />
          <el-option label="上架" :value="1" />
          <el-option label="下架" :value="0" />
          <el-option label="已成交" :value="2" />
          <el-option label="待审核" :value="3" />
          <el-option label="已取消" :value="4" />
          <el-option label="审核不通过" :value="5" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 商品列表 -->
    <el-table :data="goodsList" style="width: 100%" v-loading="loading">
      <el-table-column prop="goods_id" label="商品ID" width="80" align="center" />
      <el-table-column prop="goods_name" label="商品名称" min-width="200" show-overflow-tooltip />
      <el-table-column prop="cate_id" label="分类" width="120">
        <template #default="{ row }">
          {{ categoryList.find((item) => item.cate_id === row.cate_id)?.cate_name || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="user_id" label="发布者" width="100">
        <template #default="{ row }">
          {{
            userListStore.userList.find((user) => user.user_id === row.user_id)?.user_nickname ||
            '-'
          }}
        </template>
      </el-table-column>
      <el-table-column prop="goods_price" label="价格/交换" width="120">
        <template #default="{ row }">
          {{ row.goods_type === 1 ? `￥${row.goods_price}` : '交换' }}
        </template>
      </el-table-column>
      <el-table-column prop="goods_status" label="状态" width="100">
        <template #default="{ row }">
          <div
            class="state"
            v-if="row.goods_status === 0"
            style="background-color: #ccc; color: #fff"
          >
            已下架
          </div>
          <div
            class="state"
            v-if="row.goods_status === 1"
            style="background-color: #409eff; color: #fff"
          >
            已上架
          </div>
          <div
            class="state"
            v-else-if="row.goods_status === 2"
            style="background-color: #67c23a; color: #fff"
          >
            已成交
          </div>
          <div
            class="state"
            v-else-if="row.goods_status === 3"
            style="background-color: #e6a23c; color: #fff"
          >
            审核中
          </div>
          <div
            class="state"
            v-else-if="row.goods_status === 4"
            style="background-color: #f56c6c; color: #fff"
          >
            已取消
          </div>
          <div class="state" v-else style="background-color: #ff0808; color: #fff">已驳回</div>
        </template>
      </el-table-column>
      <el-table-column prop="browse_count" label="浏览量" width="80" align="center" />
      <el-table-column prop="created_at" label="创建时间" width="180">
        <template #default="{ row }">
          {{ formatTime(row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="170" align="center">
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

    <el-dialog v-model="editDialogVisible" title="编辑商品" width="700px">
      <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="100px">
        <el-form-item label="商品ID">
          <el-input v-model="editForm.goods_id" disabled />
        </el-form-item>
        <el-form-item label="用户ID" prop="user_id">
          <el-input v-model="editForm.user_id" type="number" />
        </el-form-item>
        <el-form-item label="分类" prop="cate_id">
          <el-select v-model="editForm.cate_id" placeholder="请选择分类" style="width: 240px">
            <el-option
              v-for="item in categoryList"
              :key="item.cate_id"
              :label="item.cate_name"
              :value="item.cate_id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="名称" prop="goods_name">
          <el-input v-model="editForm.goods_name" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="editForm.goods_desc" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="图片">
          <el-input v-model="editForm.goods_pic" placeholder="多个图片用逗号分隔" />
        </el-form-item>
        <el-form-item label="新旧程度">
          <el-select v-model="editForm.goods_new_level" style="width: 240px">
            <el-option v-for="n in 6" :key="n" :label="n" :value="n" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型" prop="goods_type">
          <el-select v-model="editForm.goods_type" style="width: 240px">
            <el-option label="只换" :value="1" />
            <el-option label="只卖" :value="2" />
            <el-option label="可换可卖" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="价格">
          <el-input
            v-model="editForm.goods_price"
            type="number"
            :disabled="editForm.goods_type === 1"
          />
        </el-form-item>
        <el-form-item label="期望交换">
          <el-input v-model="editForm.exchange_want" />
        </el-form-item>
        <el-form-item label="经度">
          <el-input v-model="editForm.goods_lng" />
        </el-form-item>
        <el-form-item label="纬度">
          <el-input v-model="editForm.goods_lat" />
        </el-form-item>
        <el-form-item label="状态" prop="goods_status">
          <el-select v-model="editForm.goods_status" style="width: 240px">
            <el-option label="已下架" :value="0" />
            <el-option label="已上架" :value="1" />
            <el-option label="已成交" :value="2" />
            <el-option label="审核中" :value="3" />
            <el-option label="已取消" :value="4" />
            <el-option label="已驳回" :value="5" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleEditSubmit">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 分页 -->
    <el-pagination
      v-model:current-page="params.pagenum"
      v-model:page-size="params.pagesize"
      :page-sizes="[10, 20, 50, 100]"
      :background="true"
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
      @size-change="getGoodsList"
      @current-change="getGoodsList"
      class="pagination"
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

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.state {
  width: fit-content;
  height: fit-content;
  text-align: center;
  padding: 0px 4px;
  border-radius: 4px;
  font-size: 12px;
}
</style>
