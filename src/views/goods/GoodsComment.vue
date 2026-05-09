<!-- eslint-disable no-unused-vars -->
<script setup>
import { ref, onMounted } from 'vue'
import { getAdminCommentListService, hideCommentService, deleteCommentService } from '@/api/comment'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, View, Hide } from '@element-plus/icons-vue'
import { formatTime } from '@/utils/format'
import { useUserListStore } from '@/stores/modules/userList'

const userListStore = useUserListStore()
const loading = ref(true)
const commentList = ref([])
const params = ref({
  keyword: '',
  status: '',
})

const getCommentList = async () => {
  loading.value = true
  try {
    const res = await getAdminCommentListService(params.value)
    commentList.value = res.data
  } catch (error) {
    ElMessage.error('获取评论列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  getCommentList()
}

const handleReset = () => {
  params.value = {
    keyword: '',
    status: '',
  }
  getCommentList()
}

const handleToggleStatus = async (row) => {
  const newStatus = row.status === 1 ? 2 : 1
  const actionText = newStatus === 2 ? '隐藏' : '显示'

  try {
    await hideCommentService({
      comment_id: row.comment_id,
      status: newStatus,
    })
    ElMessage.success(`评论已${actionText}`)
    row.status = newStatus
  } catch (error) {
    ElMessage.error(`${actionText}失败`)
  }
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确定要永久删除该评论及其所有回复吗？', '严重警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'danger',
  })
    .then(async () => {
      try {
        await deleteCommentService(row.comment_id, row.user_id)
        ElMessage.success('评论删除成功')
        getCommentList()
      } catch (error) {
        ElMessage.error('评论删除失败')
      }
    })
    .catch(() => {})
}

onMounted(() => {
  getCommentList()
})
</script>

<template>
  <page-container title="评价管理">
    <!-- 搜索栏 -->
    <el-form :inline="true" class="search-form">
      <el-form-item label="关键词">
        <el-input
          v-model="params.keyword"
          placeholder="搜索内容/用户/商品"
          clearable
          @keyup.enter="handleSearch"
        />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="params.status" placeholder="全部状态" clearable style="width: 120px">
          <el-option label="正常" :value="1" />
          <el-option label="已隐藏" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 表格 -->
    <el-table v-loading="loading" :data="commentList" style="width: 100%">
      <el-table-column label="ID" prop="comment_id" min-width="80" />
      <el-table-column label="商品" prop="goods_id" min-width="80" show-overflow-tooltip />
      <el-table-column prop="user_id" label="发布者" width="100">
        <template #default="{ row }">
          {{
            userListStore.userList.find((user) => user.user_id === row.user_id)?.user_nickname ||
            '-'
          }}
        </template>
      </el-table-column>
      <el-table-column label="评价内容" prop="content" min-width="200" show-overflow-tooltip />
      <el-table-column label="图片" min-width="120">
        <template #default="{ row }">
          <div v-if="row.comment_pics" style="display: flex; gap: 4px">
            <el-image
              v-for="(url, index) in row.comment_pics.split(',')"
              :key="index"
              :src="url"
              :preview-src-list="row.comment_pics.split(',')"
              fit="cover"
              style="width: 30px; height: 30px; border-radius: 4px"
              preview-teleported
            />
          </div>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="评分" prop="score" min-width="80">
        <template #default="{ row }">
          <el-rate v-model="row.score" disabled />
        </template>
      </el-table-column>
      <el-table-column label="状态" min-width="80">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">
            {{ row.status === 1 ? '正常' : '已隐藏' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="发布时间" min-width="100">
        <template #default="{ row }">
          {{ formatTime(row.create_time) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" min-width="100" fixed="right">
        <template #default="{ row }">
          <el-button
            :type="row.status === 1 ? 'warning' : 'success'"
            :icon="row.status === 1 ? Hide : View"
            circle
            plain
            @click="handleToggleStatus(row)"
          />
          <el-button type="danger" :icon="Delete" circle plain @click="handleDelete(row)" />
        </template>
      </el-table-column>
    </el-table>
  </page-container>
</template>

<style scoped>
.search-form {
  margin-bottom: 20px;
}
</style>
