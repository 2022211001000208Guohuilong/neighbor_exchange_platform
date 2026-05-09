<!-- eslint-disable no-unused-vars -->
<script setup>
import { ref, onMounted } from 'vue'
import {
  getUserListService,
  updateUserService,
  banUserService,
  resetUserPasswordService,
  deleteUser,
} from '@/api/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Edit, Delete, RefreshLeft, Key } from '@element-plus/icons-vue'
import { formatTime } from '@/utils/format'
import defaultAvatar from '@/assets/default.png'

const loading = ref(true)
const list = ref([])
const userList = ref([])
const total = ref(0)
const editDialogVisible = ref(false)
const editFormRef = ref(null)
const editForm = ref({
  user_id: '',
  user_nickname: '',
  user_avatar: '',
  introduction: '',
})

const editRules = {
  user_nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
}

const params = ref({
  pagenum: 1,
  pagesize: 10,
  user_account: '',
  user_nickname: '',
  user_status: 3,
})

const getUserList = async () => {
  loading.value = true
  try {
    const res = await getUserListService(params.value)
    list.value = res.data
    total.value = list.value.length
    handlePage()
  } catch (error) {
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

const handlePage = () => {
  userList.value = list.value.slice(
    (params.value.pagenum - 1) * params.value.pagesize,
    params.value.pagenum * params.value.pagesize,
  )
}

const handleSearch = () => {
  params.value.pagenum = 1
  getUserList()
}

const handleReset = () => {
  params.value = {
    pagenum: 1,
    pagesize: 10,
    user_account: '',
    user_nickname: '',
    user_status: 3,
  }
  getUserList()
}

const handleStatusChange = async (row) => {
  try {
    await banUserService(row.user_id, row.user_status)
    getUserList()
    ElMessage({
      message: row.user_status === 1 ? '用户封禁成功' : '用户解封成功',
      type: 'success',
    })
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const handleResetPassword = (row) => {
  ElMessageBox.confirm('确定要重置该用户密码吗？', '温馨提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      try {
        await resetUserPasswordService(row.user_id)
        ElMessage.success('密码重置成功，默认密码为123456')
        getUserList()
      } catch (error) {
        ElMessage.error('密码重置失败')
      }
    })
    .catch(() => {})
}

const handleEdit = (row) => {
  editDialogVisible.value = true
  editForm.value = {
    user_id: row.user_id,
    user_nickname: row.user_nickname,
    user_avatar: row.user_avatar,
    introduction: row.introduction,
  }
}

const handleEditSubmit = async () => {
  await editFormRef.value.validate()
  try {
    await updateUserService(editForm.value)
    ElMessage.success('更新用户信息成功')
    editDialogVisible.value = false
    getUserList()
  } catch (error) {
    ElMessage.error('更新用户信息失败')
  }
}

const handleDelete = async (row) => {
  ElMessageBox.confirm('确定要删除该用户吗？', '温馨提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'danger',
  })
    .then(async () => {
      try {
        await deleteUser(row.user_id)
        ElMessage.success('用户删除成功')
        getUserList()
      } catch (error) {
        ElMessage.error('用户删除失败')
      }
    })
    .catch(() => {})
}

onMounted(() => {
  getUserList()
})
</script>

<template>
  <page-container title="用户列表">
    <template #extra>
      <el-button type="primary" @click="handleSearch">
        <el-icon><RefreshLeft /></el-icon>
        刷新
      </el-button>
    </template>

    <!-- 搜索表单 -->
    <el-form :inline="true" class="search-form">
      <el-form-item label="账号">
        <el-input v-model="params.user_account" placeholder="请输入账号" style="width: 200px" />
      </el-form-item>
      <el-form-item label="昵称">
        <el-input v-model="params.user_nickname" placeholder="请输入昵称" style="width: 200px" />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="params.user_status" placeholder="请选择状态" style="width: 120px">
          <el-option label="全部" :value="3" />
          <el-option label="启用" :value="0" />
          <el-option label="禁用" :value="1" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 用户列表 -->
    <el-table :data="userList" style="width: 100%" v-loading="loading">
      <el-table-column prop="user_id" label="用户ID" width="80" />
      <el-table-column prop="user_account" label="账号" min-width="120" />
      <el-table-column prop="user_nickname" label="昵称" min-width="120" />
      <el-table-column label="头像" width="80">
        <template #default="{ row }">
          <el-avatar :src="row.user_avatar || defaultAvatar" size="small" />
        </template>
      </el-table-column>
      <el-table-column prop="user_status" label="状态" width="100">
        <template #default="{ row }">
          <el-switch
            v-model="row.user_status"
            :active-value="0"
            :inactive-value="1"
            inline-prompt
            active-text="启用"
            inactive-text="禁用"
            @change="handleStatusChange(row)"
          />
        </template>
      </el-table-column>
      <el-table-column prop="create_time" label="创建时间" width="150">
        <template #default="{ row }">
          {{ formatTime(row.create_time) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="270">
        <template #default="{ row }">
          <el-button plain size="small" type="primary" :icon="Edit" @click="handleEdit(row)">
            编辑
          </el-button>
          <el-button plain size="small" type="danger" :icon="Delete" @click="handleDelete(row)">
            删除
          </el-button>
          <el-button plain size="small" type="info" :icon="Key" @click="handleResetPassword(row)">
            重置密码
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 编辑用户对话框 -->
    <el-dialog v-model="editDialogVisible" title="编辑用户信息" width="500px">
      <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="80px">
        <el-form-item label="用户ID">
          <el-input v-model="editForm.user_id" disabled />
        </el-form-item>
        <el-form-item label="昵称" prop="user_nickname">
          <el-input v-model="editForm.user_nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="头像URL">
          <el-input v-model="editForm.user_avatar" placeholder="请输入头像URL" />
        </el-form-item>
        <el-form-item label="简介">
          <el-input v-model="editForm.introduction" type="textarea" placeholder="请输入简介" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleEditSubmit">确定</el-button>
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
      @size-change="handlePage"
      @current-change="handlePage"
      style="margin-top: 20px; display: flex; justify-content: flex-end"
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
