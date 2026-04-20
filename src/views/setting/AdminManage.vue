<!-- eslint-disable no-unused-vars -->
<script setup>
import { ref, onMounted } from 'vue'
import {
  getAdminListService,
  addAdminService,
  deleteAdminService,
  resetAdminPasswordService,
  banAdminService,
} from '@/api/setting'
import { ElMessage, ElMessageBox, ElDialog } from 'element-plus'
import { Delete, Plus, RefreshLeft, Key } from '@element-plus/icons-vue'
import { formatTime } from '@/utils/format'
import { useUserStore } from '@/stores/modules/user'
const userStore = useUserStore()
const loading = ref(true)
const adminList = ref([])
const dialogVisible = ref(false)
const formModel = ref({
  username: '',
  password: '',
  role: 1, // 1: 普通管理员, 2: 超级管理员
})
const params = ref({
  pagenum: 1,
  pagesize: 10,
})
const total = ref(0)

const getAdminList = async () => {
  loading.value = true
  try {
    const res = await getAdminListService(params.value)
    //处理分页数据
    adminList.value = res.data.admin.slice(
      (params.value.pagenum - 1) * params.value.pagesize,
      params.value.pagenum * params.value.pagesize,
    )
    total.value = res.data.total
  } catch (error) {
    ElMessage.error('获取管理员列表失败')
  } finally {
    loading.value = false
  }
}

const handleAddAdmin = () => {
  if (userStore.user.role !== 2) {
    ElMessage.error('只有超级管理员才能添加管理员')
    return
  }
  formModel.value = {
    username: '',
    password: '',
    role: 1,
  }
  dialogVisible.value = true
}

const handleResetPassword = (row) => {
  if (userStore.user.role !== 2) {
    ElMessage.error('只有超级管理员才能重置密码')
    return
  }
  ElMessageBox.confirm('确定要重置该管理员密码吗？', '温馨提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      try {
        await resetAdminPasswordService(row.id)
        ElMessage.success('密码重置成功，默认密码为123456')
        getAdminList()
      } catch (error) {
        ElMessage.error('密码重置失败')
      }
    })
    .catch(() => {})
}

const handleDeleteAdmin = (row) => {
  if (userStore.user.role !== 2) {
    ElMessage.error('只有超级管理员才能删除管理员')
    return
  }
  ElMessageBox.confirm('确定要删除该管理员吗？', '温馨提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'danger',
  })
    .then(async () => {
      try {
        await deleteAdminService(row.id)
        ElMessage.success('管理员删除成功')
        getAdminList()
      } catch (error) {
        ElMessage.error('管理员删除失败')
      }
    })
    .catch(() => {})
}

const handleSaveAdmin = async () => {
  try {
    await addAdminService(formModel.value)
    ElMessage.success('管理员添加成功')
    dialogVisible.value = false
    getAdminList()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const handleStatusChange = async (row) => {
  try {
    await banAdminService(row.id, row.status)
    getAdminList()
    ElMessage({
      message: row.status === 2 ? '管理员禁用成功' : '管理员启用成功',
      type: 'success',
    })
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const getRoleText = (role) => {
  return role === 2 ? '超级管理员' : '普通管理员'
}

onMounted(() => {
  getAdminList()
})
</script>

<template>
  <page-container title="管理员管理">
    <template #extra>
      <el-button type="success" @click="handleAddAdmin">
        <el-icon><Plus /></el-icon>
        添加管理员
      </el-button>
      <el-button type="primary" @click="getAdminList">
        <el-icon><RefreshLeft /></el-icon>
        刷新
      </el-button>
    </template>

    <!-- 管理员列表 -->
    <el-table :data="adminList" style="width: 100%" v-loading="loading">
      <el-table-column prop="id" label="管理员ID" width="100" align="center" />
      <el-table-column prop="username" label="账号" min-width="100" />
      <el-table-column prop="role" label="角色" min-width="100">
        <template #default="{ row }">
          {{ getRoleText(row.role) }}
        </template>
      </el-table-column>
      <el-table-column prop="user_status" label="状态" min-width="50">
        <template #default="{ row }">
          <el-switch
            v-model="row.status"
            :active-value="1"
            :inactive-value="2"
            inline-prompt
            active-text="启用"
            inactive-text="禁用"
            :disabled="row.id === userStore.user.id"
            @change="handleStatusChange(row)"
          />
        </template>
      </el-table-column>
      <el-table-column prop="created_time" label="创建时间" width="150">
        <template #default="{ row }">
          {{ formatTime(row.created_time) }}
        </template>
      </el-table-column>
      <el-table-column prop="updated_time" label="更新时间" width="150">
        <template #default="{ row }">
          {{ formatTime(row.updated_time) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button
            plain
            size="small"
            type="info"
            :icon="Key"
            @click="handleResetPassword(row)"
            :disabled="userStore.user.id === row.id"
          >
            重置密码
          </el-button>
          <el-button
            plain
            size="small"
            type="danger"
            :icon="Delete"
            :disabled="userStore.user.id === row.id"
            @click="handleDeleteAdmin(row)"
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
      :background="true"
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
      @size-change="getAdminList"
      @current-change="getAdminList"
      style="margin-top: 20px; display: flex; justify-content: flex-end"
    />

    <!-- 管理员编辑对话框 -->
    <el-dialog v-model="dialogVisible" title="添加管理员" width="500px">
      <el-form :model="formModel" label-width="100px">
        <el-form-item label="管理员账号">
          <el-input v-model="formModel.username" placeholder="请输入管理员账号" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input
            v-model="formModel.password"
            placeholder="请输入密码"
            type="password"
            show-password
          />
          <!-- :placeholder="currentAdmin.id ? '留空表示不修改密码' : '请输入密码'" -->
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="formModel.role" placeholder="请选择角色">
            <el-option label="普通管理员" :value="1" />
            <el-option label="超级管理员" :value="2" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSaveAdmin">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </page-container>
</template>

<style lang="scss" scoped></style>
