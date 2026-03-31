<!-- eslint-disable no-unused-vars -->
<script setup>
import { ref, onMounted } from 'vue'
import {
  getNoticeListService,
  addNoticeService,
  editNoticeService,
  deleteNoticeService,
  topNoticeService,
} from '@/api/admin/notice'
import { ElMessage, ElMessageBox, ElDialog } from 'element-plus'
import { Edit, Delete, Plus, RefreshLeft, Star } from '@element-plus/icons-vue'
import { formatTime } from '@/utils/format'

const loading = ref(true)
const noticeList = ref([])
const total = ref(0)
const params = ref({
  pagenum: 1,
  pagesize: 10,
})
const dialogVisible = ref(false)
const currentNotice = ref({})
const formModel = ref({
  title: '',
  content: '',
  top: 0,
})

const getNoticeList = async () => {
  loading.value = true
  try {
    const res = await getNoticeListService(params.value)
    noticeList.value = res.data
    total.value = res.total
  } catch (error) {
    ElMessage.error('获取公告列表失败')
  } finally {
    loading.value = false
  }
}

const handleAddNotice = () => {
  currentNotice.value = {}
  formModel.value = {
    title: '',
    content: '',
    top: 0,
  }
  dialogVisible.value = true
}

const handleEditNotice = (row) => {
  currentNotice.value = { ...row }
  formModel.value = {
    title: row.title,
    content: row.content,
    top: row.top,
  }
  dialogVisible.value = true
}

const handleDeleteNotice = (row) => {
  ElMessageBox.confirm('确定要删除该公告吗？', '温馨提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'danger',
  })
    .then(async () => {
      try {
        await deleteNoticeService(row.id)
        ElMessage.success('公告删除成功')
        getNoticeList()
      } catch (error) {
        ElMessage.error('公告删除失败')
      }
    })
    .catch(() => {})
}

const handleTopNotice = async (row) => {
  try {
    await topNoticeService(row.id)
    ElMessage.success('公告置顶成功')
    getNoticeList()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const handleSaveNotice = async () => {
  if (!formModel.value.title) {
    ElMessage.error('公告标题不能为空')
    return
  }
  if (!formModel.value.content) {
    ElMessage.error('公告内容不能为空')
    return
  }

  try {
    if (currentNotice.value.id) {
      // 编辑公告
      await editNoticeService({ ...currentNotice.value, ...formModel.value })
      ElMessage.success('公告编辑成功')
    } else {
      // 添加公告
      await addNoticeService(formModel.value)
      ElMessage.success('公告添加成功')
    }
    dialogVisible.value = false
    getNoticeList()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

onMounted(() => {
  getNoticeList()
})
</script>

<template>
  <page-container title="公告管理">
    <template #extra>
      <el-button type="primary" @click="handleAddNotice">
        <el-icon><Plus /></el-icon>
        发布公告
      </el-button>
      <el-button type="info" @click="getNoticeList">
        <el-icon><RefreshLeft /></el-icon>
        刷新
      </el-button>
    </template>

    <!-- 公告列表 -->
    <el-table :data="noticeList" style="width: 100%" v-loading="loading">
      <el-table-column prop="id" label="公告ID" width="80" />
      <el-table-column prop="title" label="公告标题" min-width="200">
        <template #default="{ row }">
          <span v-if="row.top === 1" style="color: #f56c6c; font-weight: bold">
            [置顶] {{ row.title }}
          </span>
          <span v-else>{{ row.title }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="content" label="公告内容" min-width="300">
        <template #default="{ row }">
          <span>{{ row.content.substring(0, 100) }}...</span>
        </template>
      </el-table-column>
      <el-table-column prop="created_by" label="发布人" width="120" />
      <el-table-column prop="created_at" label="发布时间" width="180">
        <template #default="{ row }">
          {{ formatTime(row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button plain size="small" type="primary" :icon="Edit" @click="handleEditNotice(row)">
            编辑
          </el-button>
          <el-button plain size="small" type="warning" :icon="Star" @click="handleTopNotice(row)">
            置顶
          </el-button>
          <el-button
            plain
            size="small"
            type="danger"
            :icon="Delete"
            @click="handleDeleteNotice(row)"
          >
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
      @size-change="getNoticeList"
      @current-change="getNoticeList"
      style="margin-top: 20px; text-align: right"
    />

    <!-- 公告编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="currentNotice.id ? '编辑公告' : '发布公告'"
      width="600px"
    >
      <el-form :model="formModel" label-width="80px">
        <el-form-item label="公告标题">
          <el-input v-model="formModel.title" placeholder="请输入公告标题" />
        </el-form-item>
        <el-form-item label="公告内容">
          <el-input
            v-model="formModel.content"
            placeholder="请输入公告内容"
            type="textarea"
            :rows="6"
          />
        </el-form-item>
        <el-form-item label="是否置顶">
          <el-switch v-model="formModel.top" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSaveNotice">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </page-container>
</template>

<style lang="scss" scoped></style>
