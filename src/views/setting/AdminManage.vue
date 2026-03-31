<!-- eslint-disable no-unused-vars -->
<script setup>
import { ref, onMounted } from 'vue'
import {
  getAdminListService,
  addAdminService,
  editAdminService,
  deleteAdminService,
} from '@/api/admin/setting'
import { ElMessage, ElMessageBox, ElDialog } from 'element-plus'
import { Edit, Delete, Plus, RefreshLeft } from '@element-plus/icons-vue'

const loading = ref(true)
const adminList = ref([])
const dialogVisible = ref(false)
const currentAdmin = ref({})
const formModel = ref({
  username: '',
  password: '',
  role: 1, // 1: 普通管理员, 2: 超级管理员
})

const getAdminList = async () => {
  loading.value = true
  try {
    const res = await getAdminListService()
    adminList.value = res.data
  } catch (error) {
    ElMessage.error('获取管理员列表失败')
  } finally {
    loading.value = false
  }
}

const handleAddAdmin = () => {
  currentAdmin.value = {}
  formModel.value = {
    username: '',
    password: '',
    role: 1,
  }
  dialogVisible.value = true
}

const handleEditAdmin = (row) => {
  currentAdmin.value = { ...row }
  formModel.value = {
    username: row.username,
    password: '',
    role: row.role,
  }
  dialogVisible.value = true
}

const handleDeleteAdmin = (row) => {
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
  if (!formModel.value.username) {
    ElMessage.error('管理员账号不能为空')
    return
  }
  if (!currentAdmin.value.id && !formModel.value.password) {
    ElMessage.error('密码不能为空')
    return
  }

  try {
    if (currentAdmin.value.id) {
      // 编辑管理员
      const data = { ...currentAdmin.value, ...formModel.value }
      // 如果密码为空，不更新密码
      if (!data.password) {
        delete data.password
      }
      await editAdminService(data)
      ElMessage.success('管理员编辑成功')
    } else {
      // 添加管理员
      await addAdminService(formModel.value)
      ElMessage.success('管理员添加成功')
    }
    dialogVisible.value = false
    getAdminList()
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
      <el-button type="primary" @click="handleAddAdmin">
        <el-icon><Plus /></el-icon>
        添加管理员
      </el-button>
      <el-button type="info" @click="getAdminList">
        <el-icon><RefreshLeft /></el-icon>
        刷新
      </el-button>
    </template>

    <!-- 管理员列表 -->
    <el-table :data="adminList" style="width: 100%" v-loading="loading">
      <el-table-column prop="id" label="管理员ID" width="80" />
      <el-table-column prop="username" label="账号" width="150" />
      <el-table-column prop="role" label="角色" width="120">
        <template #default="{ row }">
          {{ getRoleText(row.role) }}
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="180" />
      <el-table-column label="操作" width="150">
        <template #default="{ row }">
          <el-button plain size="small" type="primary" :icon="Edit" @click="handleEditAdmin(row)">
            编辑
          </el-button>
          <el-button
            plain
            size="small"
            type="danger"
            :icon="Delete"
            @click="handleDeleteAdmin(row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 管理员编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="currentAdmin.id ? '编辑管理员' : '添加管理员'"
      width="500px"
    >
      <el-form :model="formModel" label-width="100px">
        <el-form-item label="管理员账号">
          <el-input v-model="formModel.username" placeholder="请输入管理员账号" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="formModel.password" placeholder="请输入密码" type="password" />
          <!-- :placeholder="currentAdmin.id ? '留空表示不修改密码' : '请输入密码'" -->
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="formModel.role" placeholder="请选择角色">
            <el-option label="普通管理员" value="1" />
            <el-option label="超级管理员" value="2" />
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
