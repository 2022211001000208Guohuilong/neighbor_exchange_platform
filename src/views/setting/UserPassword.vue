<!-- eslint-disable no-undef -->
<!-- eslint-disable no-unused-vars -->
<script setup>
import { ref, reactive } from 'vue'
import { useUserStore } from '@/stores'
import router from '@/router'
import { updateAdminPasswordService } from '@/api/setting'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()
// 表单数据绑定
const pwdForm = ref({
  id: userStore.user.id,
  oldPwd: '',
  newPwd: '',
  re_pwd: '',
})

// 表单引用
const pwdFormRef = ref(null)
const submitLoading = ref(false)

// 校验规则
const rules = reactive({
  oldPwd: [
    { required: true, message: '请输入原密码', trigger: 'blur' },
    { min: 3, max: 15, message: '密码长度必须为3-15位', trigger: 'blur' },
  ],
  newPwd: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 3, max: 15, message: '密码长度必须为3-15位', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        // 自定义校验1：原密码和新密码不能一样
        if (value && value === pwdForm.value.oldPwd) {
          callback(new Error('新密码不能与原密码相同'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
  re_pwd: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { min: 3, max: 15, message: '密码长度必须为3-15位', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        // 自定义校验2：新密码和确认密码必须一样
        if (value && value !== pwdForm.value.newPwd) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
})

// 提交表单
const handleSubmit = async () => {
  try {
    if (submitLoading.value) return
    await pwdFormRef.value.validate()
    submitLoading.value = true
    const res = await updateAdminPasswordService(pwdForm.value)
    console.log(res)
    ElMessage.success('密码修改成功')

    //拦截登录
    userStore.removeToken()
    userStore.setUser({})
    router.push('/login')

    // 重置表单
    handleReset()
  } catch (error) {
    const msg = error?.message || error?.response?.data?.message || '密码修改失败'
    ElMessage.error(msg)
    return
  } finally {
    submitLoading.value = false
  }
}

// 重置表单
const handleReset = () => {
  pwdFormRef.value?.resetFields()
}
</script>

<template>
  <page-container title="修改密码">
    <el-card shadow="hover" class="password-card">
      <div class="tips">建议使用 3-15 位非空字符组合，且新密码不要与原密码相同。</div>
      <el-form
        :model="pwdForm"
        ref="pwdFormRef"
        :rules="rules"
        label-width="100px"
        class="password-form"
      >
        <el-form-item label="原密码" prop="oldPwd">
          <el-input
            v-model="pwdForm.oldPwd"
            type="password"
            placeholder="请输入原密码"
            show-password
          />
        </el-form-item>

        <el-form-item label="新密码" prop="newPwd">
          <el-input
            v-model="pwdForm.newPwd"
            type="password"
            placeholder="请输入新密码"
            show-password
          />
        </el-form-item>

        <el-form-item label="确认密码" prop="re_pwd">
          <el-input
            v-model="pwdForm.re_pwd"
            type="password"
            placeholder="请确认新密码"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
            修改密码
          </el-button>
          <el-button :disabled="submitLoading" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </page-container>
</template>

<style scoped>
.password-card {
  max-width: 560px;
  margin: 0 auto;
}

.tips {
  font-size: 13px;
  color: rgba(15, 23, 42, 0.6);
  margin-bottom: 14px;
}
</style>
