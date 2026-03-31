<!-- eslint-disable no-unused-vars -->
<script setup>
import { ref, onMounted } from 'vue'
import {
  getUserListService,
  updateUserService,
  banUserService,
  unbanUserService,
  resetUserPasswordService,
} from '@/api/admin/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Edit, Delete, RefreshLeft, Key, SwitchButton } from '@element-plus/icons-vue'
import { formatTime } from '@/utils/format'

const loading = ref(true)
const userList = ref([])
const total = ref(0)
const params = ref({
  pagenum: 1,
  pagesize: 10,
  username: '',
  nickname: '',
  status: '',
})

const getUserList = async () => {
  loading.value = true
  try {
    const res = await getUserListService(params.value)
    userList.value = res.data
    total.value = res.total
  } catch (error) {
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  params.value.pagenum = 1
  getUserList()
}

const handleReset = () => {
  params.value = {
    pagenum: 1,
    pagesize: 10,
    username: '',
    nickname: '',
    status: '',
  }
  getUserList()
}

const handleStatusChange = async (row) => {
  try {
    if (row.user_status === 1) {
      await banUserService(row.id)
      ElMessage.success('用户已封禁')
    } else {
      await unbanUserService(row.id)
      ElMessage.success('用户已解封')
    }
    getUserList()
  } catch (error) {
    ElMessage.error('操作失败')
    // 恢复原状态
    row.user_status = row.user_status === 1 ? 0 : 1
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
        await resetUserPasswordService(row.id)
        ElMessage.success('密码重置成功，默认密码为123456')
      } catch (error) {
        ElMessage.error('密码重置失败')
      }
    })
    .catch(() => {})
}

const handleEdit = (row) => {
  // 编辑用户信息，这里可以跳转到详情页或弹出编辑对话框
  ElMessage.info('编辑功能开发中')
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除该用户吗？', '温馨提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'danger',
  })
    .then(async () => {
      try {
        // 这里需要调用删除用户的API
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
        <el-input v-model="params.username" placeholder="请输入账号" style="width: 200px" />
      </el-form-item>
      <el-form-item label="昵称">
        <el-input v-model="params.nickname" placeholder="请输入昵称" style="width: 200px" />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="params.status" placeholder="请选择状态" style="width: 120px">
          <el-option label="启用" value="1" />
          <el-option label="禁用" value="0" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 用户列表 -->
    <el-table :data="userList" style="width: 100%" v-loading="loading">
      <el-table-column prop="id" label="用户ID" width="80" />
      <el-table-column prop="username" label="账号" width="150" />
      <el-table-column prop="nickname" label="昵称" width="150" />
      <el-table-column label="头像" width="100">
        <template #default="{ row }">
          <el-avatar :src="row.user_pic || '@/assets/default.png'" size="small" />
        </template>
      </el-table-column>
      <el-table-column prop="intro" label="简介" min-width="150" />
      <el-table-column prop="user_status" label="状态" width="100">
        <template #default="{ row }">
          <el-switch
            v-model="row.user_status"
            :active-value="1"
            :inactive-value="0"
            @change="handleStatusChange(row)"
          />
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="180">
        <template #default="{ row }">
          {{ formatTime(row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button plain size="small" type="primary" :icon="Edit" @click="handleEdit(row)">
            编辑
          </el-button>
          <el-button plain size="small" type="info" :icon="Key" @click="handleResetPassword(row)">
            重置密码
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
      @size-change="getUserList"
      @current-change="getUserList"
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
