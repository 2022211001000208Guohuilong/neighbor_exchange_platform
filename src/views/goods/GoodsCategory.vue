<!-- eslint-disable no-unused-vars -->
<script setup>
import { ref, onMounted } from 'vue'
import {
  getGoodsCategoryService,
  addGoodsCategoryService,
  editGoodsCategoryService,
  deleteGoodsCategoryService,
} from '@/api/goods'
import { ElMessage, ElMessageBox, ElDialog } from 'element-plus'
import { Edit, Delete, Plus, RefreshLeft } from '@element-plus/icons-vue'

const loading = ref(true)
const list = ref([])
const categoryList = ref([])
const dialogVisible = ref(false)
const currentCategory = ref({})
const formModel = ref({
  cate_name: '',
})
const params = ref({
  pagenum: 1,
  pagesize: 10,
})

const total = ref(0)

const getCategoryList = async () => {
  loading.value = true
  try {
    const res = await getGoodsCategoryService()
    list.value = res.data
    total.value = list.value.length || 0
    //分页处理
    categoryList.value = list.value.slice(
      (params.value.pagenum - 1) * params.value.pagesize,
      params.value.pagenum * params.value.pagesize,
    )
  } catch (error) {
    ElMessage.error('获取商品分类失败')
  } finally {
    loading.value = false
  }
}

const handleAddCategory = () => {
  currentCategory.value = {}
  formModel.value = {
    cate_name: '',
  }
  dialogVisible.value = true
}

const handleEditCategory = (row) => {
  currentCategory.value = { ...row }
  formModel.value = {
    cate_name: row.cate_name,
  }
  dialogVisible.value = true
}

const handleDeleteCategory = (row) => {
  ElMessageBox.confirm('确定要删除该分类吗？', '温馨提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'danger',
  })
    .then(async () => {
      try {
        await deleteGoodsCategoryService(row.cate_id)
        ElMessage.success('分类删除成功')
        getCategoryList()
      } catch (error) {
        ElMessage.error('分类删除失败')
      }
    })
    .catch(() => {})
}

const handleSaveCategory = async () => {
  if (!formModel.value.cate_name) {
    ElMessage.error('分类名称不能为空')
    return
  }

  try {
    if (currentCategory.value.cate_id) {
      // 编辑分类
      await editGoodsCategoryService({ ...currentCategory.value, ...formModel.value })
      ElMessage.success('分类编辑成功')
    } else {
      // 添加分类
      await addGoodsCategoryService(formModel.value)
      ElMessage.success('分类添加成功')
    }
    dialogVisible.value = false
    getCategoryList()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

onMounted(() => {
  getCategoryList()
})
</script>

<template>
  <page-container title="商品分类管理">
    <template #extra>
      <el-button type="primary" @click="handleAddCategory">
        <el-icon><Plus /></el-icon>
        添加分类
      </el-button>
      <el-button type="info" @click="getCategoryList">
        <el-icon><RefreshLeft /></el-icon>
        刷新
      </el-button>
    </template>

    <!-- 分类列表 -->
    <el-table :data="categoryList" style="width: 100%" v-loading="loading">
      <el-table-column prop="cate_id" label="分类ID" width="100" align="center" />
      <el-table-column prop="cate_name" label="分类名称" width="450" />
      <el-table-column prop="cate_name" label="分类描述" width="450" />
      <el-table-column label="操作" min-width="150">
        <template #default="{ row }">
          <el-button
            plain
            size="small"
            type="primary"
            :icon="Edit"
            @click="handleEditCategory(row)"
          >
            编辑
          </el-button>
          <el-button
            plain
            size="small"
            type="danger"
            :icon="Delete"
            @click="handleDeleteCategory(row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分类编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="currentCategory.cate_id ? '编辑分类' : '添加分类'"
      width="500px"
    >
      <el-form :model="formModel" label-width="80px">
        <el-form-item label="分类名称">
          <el-input v-model="formModel.cate_name" placeholder="请输入分类名称" />
        </el-form-item>
        <!-- <el-form-item label="分类描述">
          <el-input
            v-model="formModel.cate_desc"
            placeholder="请输入分类描述"
            type="textarea"
            :rows="3"
          />
        </el-form-item> -->
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSaveCategory">保存</el-button>
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
      @size-change="getCategoryList"
      @current-change="getCategoryList"
      style="margin-top: 20px; display: flex; justify-content: flex-end"
    />
  </page-container>
</template>

<style lang="scss" scoped></style>
