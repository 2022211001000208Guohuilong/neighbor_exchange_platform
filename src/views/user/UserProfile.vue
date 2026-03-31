<!-- eslint-disable no-unused-vars -->
<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessageBox, ElMessage, ElLoading } from 'element-plus'
import PageContainer from '@/components/PageContainer.vue'
import { useUserStore } from '@/stores'
import { userUpdateInfo } from '@/api/user'

const userStore = useUserStore()
const loading = ref(false) // 加载状态
const formRef = ref(null) // 表单引用

// 表单数据（深拷贝避免直接修改store数据）
const userForm = ref({
  username: '',
  nickname: '',
  email: '',
})

// 校验规则
const rules = reactive({
  nickname: [
    { required: true, message: '请输入用户昵称', trigger: 'blur' },
    { pattern: /^\S{2,10}$/, message: '长度在 2 到 10 个非空字符', trigger: ['blur', 'change'] },
  ],
  email: [
    { required: true, message: '请输入用户邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: ['blur', 'change'] },
  ],
})

// 初始化用户数据
const initUserInfo = async () => {
  try {
    loading.value = true
    await userStore.getUser() // 获取最新用户信息
    // 深拷贝用户数据到表单
    userForm.value = { ...userStore.user }
  } catch (error) {
    ElMessage.error('获取用户信息失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 提交表单
const updateProfile = async () => {
  // 表单校验
  if (!formRef.value) return
  try {
    await formRef.value.validate()

    // 确认修改
    ElMessageBox.confirm('确认修改用户资料吗？', '温馨提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning',
    })
      .then(async () => {
        const loadingInstance = ElLoading.service({ text: '更新中...' })

        // 调用接口更新
        await userUpdateInfo(userForm.value)
        // 重新获取用户信息
        await userStore.getUser()

        ElMessage.success('资料更新成功')
        loadingInstance.close()
      })
      .catch(() => {
        ElMessage.info('已取消修改')
      })
  } catch (error) {
    // 校验失败不提示错误（Element会自动显示）
    return false
  }
}

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

// 页面挂载时初始化数据
onMounted(() => {
  initUserInfo()
})
</script>

<template>
  <page-container title="用户资料">
    <div class="profile-container">
      <div class="profile-card">
        <div class="card-header">
          <h2 class="card-title">用户信息</h2>
          <p class="card-desc">修改个人基本资料，保存后立即生效</p>
        </div>

        <el-form
          ref="formRef"
          :model="userForm"
          :rules="rules"
          size="large"
          class="profile-form"
          :disabled="loading"
        >
          <!-- 登录名称（不可修改） -->
          <el-form-item label="登录名称" prop="username" class="form-item username">
            <el-input
              v-model="userForm.username"
              disabled
              placeholder="用户登录账号"
              prefix-icon="User"
            ></el-input>
          </el-form-item>

          <!-- 用户昵称 -->
          <el-form-item label="用户昵称" prop="nickname" class="form-item">
            <el-input
              v-model="userForm.nickname"
              placeholder="请输入2-10个非空字符的昵称"
              prefix-icon="UserFilled"
            ></el-input>
          </el-form-item>

          <!-- 用户邮箱 -->
          <el-form-item label="用户邮箱" prop="email" class="form-item">
            <el-input
              v-model="userForm.email"
              placeholder="请输入有效的邮箱地址"
              prefix-icon="Message"
              type="email"
            ></el-input>
          </el-form-item>

          <!-- 操作按钮 -->
          <el-form-item class="form-actions">
            <el-button type="primary" @click="updateProfile" :loading="loading">
              更新资料
            </el-button>
            <el-button type="default" @click="resetForm" :disabled="loading"> 重置 </el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </page-container>
</template>

<style lang="scss" scoped>
.profile-container {
  max-width: 800px;
  margin: 20px auto;
  padding: 0 20px;
}

.profile-card {
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  }
}

.card-header {
  padding: 24px 30px;
  border-bottom: 1px solid #f0f2f5;

  .card-title {
    margin: 0 0 8px 0;
    font-size: 18px;
    font-weight: 600;
    color: #1d2129;
  }

  .card-desc {
    margin: 0;
    font-size: 14px;
    color: #86909c;
  }
}

.profile-form {
  padding: 20px;
}

.form-item {
  margin-bottom: 24px;

  .username {
    margin-left: 200px;
  }

  &:last-of-type {
    margin-bottom: 0;
  }

  .el-form-item__label {
    font-weight: 500;
    color: #4e5969;
  }

  .el-input {
    width: 100%;
    max-width: 500px;
  }
}

.form-actions {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px dashed #e5e6eb;

  .el-button {
    padding: 8px 24px;
    font-size: 14px;
  }

  .el-button + .el-button {
    margin-left: 16px;
  }
}

// 禁用状态样式优化
:deep(.el-form-item.is-disabled .el-input__inner) {
  background-color: #f5f7fa;
  color: #86909c;
  cursor: not-allowed;
}
</style>
