<!-- eslint-disable no-unused-vars -->
<script setup>
import { ref, reactive } from 'vue'
import { userResetPassword } from '@/api/user'
import { useUserStore } from '@/stores'
import router from '@/router'

const userStore = useUserStore()
// 表单数据绑定
const pwdForm = ref({
  old_pwd: '',
  new_pwd: '',
  re_pwd: '',
})

// 表单引用
const pwdFormRef = ref(null)

// 校验规则
const rules = reactive({
  old_pwd: [
    { required: true, message: '请输入原密码', trigger: 'blur' },
    { min: 6, max: 15, message: '密码长度必须为6-15位', trigger: 'blur' },
  ],
  new_pwd: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 15, message: '密码长度必须为6-15位', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        // 自定义校验1：原密码和新密码不能一样
        if (value && value === pwdForm.value.old_pwd) {
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
    { min: 6, max: 15, message: '密码长度必须为6-15位', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        // 自定义校验2：新密码和确认密码必须一样
        if (value && value !== pwdForm.value.new_pwd) {
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
    // 表单校验
    const res = await userResetPassword(pwdForm.value)
    console.log(res)

    // 校验通过，这里可以添加修改密码的API调用
    // ElMessage.success('密码修改成功')

    //拦截登录
    userStore.removeToken()
    router.push('/login')

    // 重置表单
    handleReset()
  } catch (error) {
    // 校验失败
    // ElMessage.error('请检查输入的信息')
    return false
  }
}

// 重置表单
const handleReset = () => {
  pwdFormRef.value.resetFields()
}
</script>

<template>
  <el-form
    :model="pwdForm"
    ref="pwdFormRef"
    :rules="rules"
    label-width="100px"
    class="password-form"
  >
    <!-- 原密码 -->
    <el-form-item label="原密码" prop="old_pwd">
      <el-input
        v-model="pwdForm.old_pwd"
        type="password"
        placeholder="请输入原密码"
        show-password
      ></el-input>
    </el-form-item>

    <!-- 新密码 -->
    <el-form-item label="新密码" prop="new_pwd">
      <el-input
        v-model="pwdForm.new_pwd"
        type="password"
        placeholder="请输入新密码"
        show-password
      ></el-input>
    </el-form-item>

    <!-- 确认密码 -->
    <el-form-item label="确认密码" prop="re_pwd">
      <el-input
        v-model="pwdForm.re_pwd"
        type="password"
        placeholder="请确认新密码"
        show-password
      ></el-input>
    </el-form-item>

    <!-- 操作按钮 -->
    <el-form-item>
      <el-button type="primary" @click="handleSubmit">修改密码</el-button>
      <el-button @click="handleReset">重置</el-button>
    </el-form-item>
  </el-form>
</template>

<style scoped>
.password-form {
  max-width: 500px;
  margin: 20px auto;
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.08);
}

.el-form-item {
  margin-bottom: 20px;
}

.el-button + .el-button {
  margin-left: 15px;
}
</style>
