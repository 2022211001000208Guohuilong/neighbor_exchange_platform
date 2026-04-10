<script setup>
import { User, Lock } from '@element-plus/icons-vue'
import { ref, onMounted, onUnmounted } from 'vue'
import { adminLoginService } from '@/api/user'
import router from '@/router'
import { useUserStore } from '@/stores/modules/user'
import { ElMessage } from 'element-plus'
const userStore = useUserStore()

const form = ref()
const loginLoading = ref(false)
const rememberMe = ref(false)
const capsLockOn = ref(false)
const formModel = ref({
  username: '',
  password: '',
})
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, message: '用户名不能少于3位', trigger: 'change' },
    { max: 20, message: '用户名不能多于20位', trigger: 'change' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { pattern: /^\S{3,15}$/, message: '密码必须是 3-15 位非空字符', trigger: 'change' },
  ],
}

const login = async () => {
  if (loginLoading.value) return
  try {
    await form.value.validate()
  } catch {
    return
  }

  loginLoading.value = true
  try {
    const res = await adminLoginService({
      username: formModel.value.username,
      password: formModel.value.password,
    })
    if (rememberMe.value) {
      localStorage.setItem('login_username', formModel.value.username)
    } else {
      localStorage.removeItem('login_username')
    }
    userStore.setToken(res.data.token)
    userStore.setUser(res.data.admin)
    router.push('/')
    ElMessage({
      message: res.message || '登录成功',
      type: 'success',
    })
  } catch (error) {
    const msg = error?.message || error?.response?.data?.message || '登录失败'
    ElMessage.error(msg)
  } finally {
    loginLoading.value = false
  }
}

const cardRef = ref(null)
const handlePasswordKeyup = (e) => {
  if (e && e.getModifierState) {
    capsLockOn.value = !!e.getModifierState('CapsLock')
  }
}
const handleMove = (e) => {
  const card = cardRef.value
  if (!card) return
  const rect = card.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const midX = rect.width / 2
  const midY = rect.height / 2
  const rotateX = ((y - midY) / midY) * -6
  const rotateY = ((x - midX) / midX) * 6
  card.style.setProperty('--rx', `${rotateX.toFixed(2)}deg`)
  card.style.setProperty('--ry', `${rotateY.toFixed(2)}deg`)
  const gx = ((x / rect.width) * 100).toFixed(0)
  const gy = ((y / rect.height) * 100).toFixed(0)
  card.style.setProperty('--gx', `${gx}%`)
  card.style.setProperty('--gy', `${gy}%`)
}
const handleLeave = () => {
  const card = cardRef.value
  if (!card) return
  card.style.setProperty('--rx', '0deg')
  card.style.setProperty('--ry', '0deg')
  card.style.setProperty('--gx', '50%')
  card.style.setProperty('--gy', '50%')
}
onMounted(() => {
  const card = cardRef.value
  if (!card) return
  card.addEventListener('mousemove', handleMove)
  card.addEventListener('mouseleave', handleLeave)
  const saved = localStorage.getItem('login_username')
  if (saved) {
    formModel.value.username = saved
    rememberMe.value = true
  }
})
onUnmounted(() => {
  const card = cardRef.value
  if (!card) return
  card.removeEventListener('mousemove', handleMove)
  card.removeEventListener('mouseleave', handleLeave)
})
</script>

<template>
  <!-- 总共 24 份  ， 左右各12份-->
  <el-row class="login-page">
    <el-col :span="12" class="bg">
      <svg class="ribbons" viewBox="0 0 1200 800" preserveAspectRatio="none" aria-hidden="true">
        <path
          d="M-60 560C120 470 250 480 430 560C610 640 760 640 940 560C1120 480 1260 490 1340 540"
          fill="none"
          stroke="rgba(0, 194, 255, 0.28)"
          stroke-width="18"
          stroke-linecap="round"
        />
        <path
          d="M-80 640C110 540 260 540 450 640C640 740 790 740 980 640C1170 540 1320 540 1420 620"
          fill="none"
          stroke="rgba(103, 194, 58, 0.22)"
          stroke-width="14"
          stroke-linecap="round"
        />
        <path
          d="M-40 240C160 170 310 175 510 240C710 305 870 305 1070 240C1270 175 1410 180 1500 220"
          fill="none"
          stroke="rgba(15, 23, 42, 0.08)"
          stroke-width="10"
          stroke-linecap="round"
        />
      </svg>
    </el-col>
    <el-col :span="6" :offset="3" class="form">
      <div class="glass-card" ref="cardRef">
        <el-form
          :model="formModel"
          :rules="rules"
          ref="form"
          size="large"
          autocomplete="off"
          @keyup.enter="login"
        >
          <div class="form-header">
            <h1 class="title">登录</h1>
            <div class="subtitle">邻享 换物·闲置流转</div>
          </div>
          <el-form-item prop="username">
            <el-input
              v-model="formModel.username"
              :prefix-icon="User"
              placeholder="请输入用户名"
              class="fancy-input"
            />
          </el-form-item>
          <el-form-item prop="password">
            <el-input
              v-model="formModel.password"
              name="password"
              :prefix-icon="Lock"
              type="password"
              show-password
              placeholder="请输入密码"
              class="fancy-input"
              @keyup="handlePasswordKeyup"
            />
            <div v-if="capsLockOn" class="caps-tip">已开启大写锁定 Caps Lock</div>
          </el-form-item>
          <div class="options">
            <el-checkbox v-model="rememberMe">记住我</el-checkbox>
            <el-link
              type="primary"
              :underline="false"
              @click="ElMessage.info('请联系管理员重置密码')"
            >
              忘记密码？
            </el-link>
          </div>
          <el-form-item>
            <el-button
              @click="login"
              class="button glow"
              type="primary"
              auto-insert-space
              :loading="loginLoading"
            >
              登录
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-col>
  </el-row>
</template>

<style lang="scss" scoped>
.login-page {
  height: 100vh;
  background-color: #fff;
  overflow: hidden;
  .bg {
    background:
      url('@/assets/login_title.png') no-repeat 50% 60% / 200px auto,
      url('@/assets/logo2.svg') no-repeat 50% center / 500px auto,
      radial-gradient(1200px 600px at 20% 10%, rgba(0, 194, 255, 0.22), transparent 60%),
      radial-gradient(900px 520px at 80% 90%, rgba(103, 194, 58, 0.2), transparent 62%),
      linear-gradient(135deg, #e9f7ff 0%, #eefbf4 45%, #ffffff 100%);
    border-radius: 0 20px 20px 0;
    position: relative;
    overflow: hidden;
  }
  .bg::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(600px 300px at 20% 20%, rgba(0, 194, 255, 0.22), transparent 60%),
      radial-gradient(500px 260px at 80% 70%, rgba(103, 194, 58, 0.2), transparent 60%);
    pointer-events: none;
    mix-blend-mode: screen;
    animation: bgPulse 10s ease-in-out infinite;
  }
  .bg::after {
    content: '';
    position: absolute;
    width: 1400px;
    height: 1400px;
    left: 50%;
    top: 80%;
    transform: translate(-50%, -50%);
    background: radial-gradient(closest-side, rgba(255, 255, 255, 0.06), transparent 70%);
    filter: blur(2px);
    animation: float 12s ease-in-out infinite;
  }
  .bg .ribbons {
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0.55;
    mix-blend-mode: multiply;
    animation: ribbons 14s ease-in-out infinite;
  }
  /* 漂浮光点 */
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image: radial-gradient(rgba(15, 23, 42, 0.08) 1px, transparent 1px);
    background-size: 18px 18px;
    mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.25), rgba(0, 0, 0, 0.02));
    animation: drift 25s linear infinite;
    pointer-events: none;
  }
  .form {
    display: flex;
    flex-direction: column;
    justify-content: center;
    user-select: none;
    padding: 0 10px;
    perspective: 1000px;
  }
  .glass-card {
    width: 100%;
    padding: 28px 26px;
    border-radius: 16px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.55), rgba(255, 255, 255, 0.35));
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.35);
    box-shadow:
      0 20px 40px rgba(0, 0, 0, 0.08),
      0 0 0 1px rgba(255, 255, 255, 0.25) inset;
    animation: cardIn 0.6s ease-out both;
    position: relative;
    transform: rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg));
    transition:
      transform 0.2s ease,
      box-shadow 0.3s ease;
    /* 动态高光跟随鼠标 */
    --gx: 50%;
    --gy: 50%;
  }
  .glass-card::before {
    content: '';
    position: absolute;
    inset: -1px;
    border-radius: 16px;
    padding: 1px;
    background: conic-gradient(
      from 0deg at 50% 50%,
      rgba(0, 194, 255, 0.35),
      rgba(103, 194, 58, 0.35),
      rgba(0, 194, 255, 0.35)
    );
    -webkit-mask:
      linear-gradient(#000 0 0) content-box,
      linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    opacity: 0.6;
    filter: blur(0.5px);
    pointer-events: none;
    animation: spin 6s linear infinite;
  }
  .glass-card::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 16px;
    background: radial-gradient(
      400px 220px at var(--gx) var(--gy),
      rgba(0, 194, 255, 0.18),
      transparent 60%
    );
    pointer-events: none;
    transition: background 0.1s ease;
  }
  .form-header {
    text-align: center;
    margin-bottom: 10px;
  }
  .options {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: -6px 0 6px;
  }
  .title {
    margin: 0 0 6px;
    background: linear-gradient(90deg, #00c2ff, #67c23a);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    letter-spacing: 2px;
    font-weight: 800;
  }
  .subtitle {
    font-size: 12px;
    color: #7f8c8d;
    letter-spacing: 1px;
  }
  .fancy-input :deep(.el-input__wrapper) {
    transition: all 0.25s ease;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.06) inset;
    background-color: rgba(255, 255, 255, 0.9);
    border-radius: 10px;
  }
  .fancy-input :deep(.el-input__wrapper.is-focus) {
    box-shadow:
      0 0 0 2px rgba(0, 194, 255, 0.35) inset,
      0 8px 20px rgba(0, 194, 255, 0.15);
    background-color: #fff;
  }
  .caps-tip {
    margin-top: 6px;
    font-size: 12px;
    color: #e6a23c;
    display: inline-block;
  }
  .button {
    width: 100%;
    border: none;
    background: linear-gradient(135deg, #00c2ff, #67c23a);
    box-shadow:
      0 10px 20px rgba(0, 194, 255, 0.2),
      0 0 0 1px rgba(255, 255, 255, 0.25) inset;
    transition:
      transform 0.15s ease,
      box-shadow 0.2s ease;
  }
  .button:hover {
    transform: translateY(-1px);
    box-shadow:
      0 14px 28px rgba(0, 194, 255, 0.28),
      0 0 0 1px rgba(255, 255, 255, 0.3) inset;
  }
  .button.glow::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 6px;
    box-shadow: 0 0 20px rgba(0, 194, 255, 0.3);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  .button.glow:hover::after {
    opacity: 1;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
@keyframes float {
  0% {
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    transform: translate(-48%, -52%) scale(1.05);
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
  }
}
@keyframes cardIn {
  from {
    transform: translateY(8px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
@keyframes drift {
  from {
    background-position: 0 0;
  }
  to {
    background-position: 200px 200px;
  }
}

@keyframes bgPulse {
  0% {
    filter: saturate(1) brightness(1);
  }
  50% {
    filter: saturate(1.12) brightness(1.03);
  }
  100% {
    filter: saturate(1) brightness(1);
  }
}

@keyframes ribbons {
  0% {
    transform: translate3d(0, 0, 0);
    opacity: 0.45;
  }
  50% {
    transform: translate3d(0, -10px, 0);
    opacity: 0.6;
  }
  100% {
    transform: translate3d(0, 0, 0);
    opacity: 0.45;
  }
}
</style>
