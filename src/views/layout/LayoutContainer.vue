<!-- eslint-disable no-undef -->
<script setup>
import {
  Management,
  UserFilled,
  EditPen,
  SwitchButton,
  CaretBottom,
  DataAnalysis,
  Goods,
  Bell,
  Avatar,
  Star,
  List,
  PieChart,
  Key,
  Message,
  Sell,
  Promotion,
} from '@element-plus/icons-vue'
import adminAvatar from '@/assets/admin.png'
import adminGeneralAvatar from '@/assets/admin_general.png'
import { useUserStore } from '@/stores'
import { onMounted } from 'vue'
import router from '@/router'
import { useUserListStore } from '@/stores/modules/userList'

const userStore = useUserStore()
const userListStore = useUserListStore()

const handleCommand = (command) => {
  if (command === 'logout') {
    ElMessageBox.confirm('你确认要退出登录吗', '温馨提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning',
    })
      .then(() => {
        userStore.removeToken()
        userStore.setUser({})
        router.push('/login')
        ElMessage({
          type: 'success',
          message: '退出成功',
        })
      })
      .catch(() => {})
  } else {
    router.push(`/user/${command}`)
  }
}

onMounted(() => {
  // userStore.setUser({})
  // userStore.getUser()
  // console.log('加载', userStore.user)
  userListStore.getUser()
})
</script>

<template>
  <el-container class="layout-container">
    <el-aside width="200px" class="el-aside">
      <div class="el-aside__logo"></div>
      <div class="el-aside__menu">
        <el-menu
          active-text-color="#ffd04b"
          background-color="#232323"
          :default-active="$route.path"
          text-color="#fff"
          router
        >
          <!-- 数据面板 -->
          <el-menu-item index="/dashboard">
            <el-icon><DataAnalysis /></el-icon>
            <span>数据面板</span>
          </el-menu-item>

          <!-- 商品管理 -->
          <el-sub-menu index="/goods">
            <template #title>
              <el-icon><Goods /></el-icon>
              <span>商品管理</span>
            </template>
            <el-menu-item index="/goods/list">
              <el-icon><List /></el-icon>
              <span>商品列表</span>
            </el-menu-item>
            <el-menu-item index="/goods/audit">
              <el-icon><Star /></el-icon>
              <span>商品审核</span>
            </el-menu-item>
            <el-menu-item index="/goods/category">
              <el-icon><Management /></el-icon>
              <span>分类管理</span>
            </el-menu-item>
          </el-sub-menu>

          <!-- 交易管理 -->
          <el-sub-menu index="/trade">
            <template #title>
              <el-icon><Sell /></el-icon>
              <span>交易管理</span>
            </template>
            <el-menu-item index="/trade/list">
              <el-icon><List /></el-icon>
              <span>交易列表</span>
            </el-menu-item>
            <el-menu-item index="/trade/statistic">
              <el-icon><PieChart /></el-icon>
              <span>交易统计</span>
            </el-menu-item>
          </el-sub-menu>

          <!-- 公告管理 -->
          <el-menu-item index="/notice/list">
            <el-icon><Bell /></el-icon>
            <span>公告管理</span>
          </el-menu-item>

          <!-- 消息管理 -->
          <!-- <el-menu-item index="/message/MessageSend">
            <el-icon><Message /></el-icon>
            <span>消息管理</span>
          </el-menu-item> -->
          <el-sub-menu index="/message">
            <template #title>
              <el-icon><Message /></el-icon>
              <span>消息管理</span>
            </template>
            <el-menu-item index="/message/MessageList">
              <el-icon><List /></el-icon>
              <span>消息列表</span>
            </el-menu-item>
            <el-menu-item index="/message/MessageSend">
              <el-icon><Promotion /></el-icon>
              <span>消息发送</span>
            </el-menu-item>
          </el-sub-menu>

          <!-- 用户管理 -->
          <el-sub-menu index="/user">
            <template #title>
              <el-icon><UserFilled /></el-icon>
              <span>用户管理</span>
            </template>
            <el-menu-item index="/user/list">
              <el-icon><List /></el-icon>
              <span>用户列表</span>
            </el-menu-item>
            <el-menu-item index="/user/statistic">
              <el-icon><PieChart /></el-icon>
              <span>用户统计</span>
            </el-menu-item>
          </el-sub-menu>

          <!-- 系统设置 -->
          <el-sub-menu index="/setting">
            <template #title>
              <el-icon><Avatar /></el-icon>
              <span>账号管理</span>
            </template>
            <el-menu-item index="/setting/admin">
              <el-icon><Key /></el-icon>
              <span>管理员管理</span>
            </el-menu-item>
            <el-menu-item index="/user/password">
              <el-icon><EditPen /></el-icon>
              <span>修改密码</span>
            </el-menu-item>
          </el-sub-menu>
        </el-menu>
      </div>
    </el-aside>
    <el-container>
      <el-header class="app-header">
        <div class="header-left">
          <div class="brand">邻享后台</div>
          <div class="admin-info">
            管理员：<strong>{{ userStore.user.username || '-' }}</strong>
            <span v-if="userStore.user.role === 2" class="role-badge role-super">超</span>
            <span v-else class="role-badge role-normal">普</span>
          </div>
        </div>
        <el-dropdown placement="bottom-end" @command="handleCommand">
          <span class="el-dropdown__box">
            <el-avatar :src="userStore.user.role === 2 ? adminAvatar : adminGeneralAvatar" />
            <span class="admin-name">{{ userStore.user.username || '管理员' }}</span>
            <el-icon><CaretBottom /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="password" :icon="EditPen">修改密码</el-dropdown-item>
              <el-dropdown-item command="logout" :icon="SwitchButton">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-header>
      <el-main>
        <router-view></router-view>
      </el-main>
      <el-footer class="app-footer">
        <span>邻享换物·闲置流转平台</span>
        <span class="sep">•</span>
        <span>©2026</span>
        <span class="sep">•</span>
        <span>Created by GHL</span>
      </el-footer>
    </el-container>
  </el-container>
</template>

<style lang="scss" scoped>
.layout-container {
  height: 100vh;
  background: #f6f8fc;
  .el-aside {
    background: linear-gradient(180deg, #0f172a 0%, #111827 40%, #0b1220 100%);
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    box-shadow: 8px 0 28px rgba(15, 23, 42, 0.25);
    &__logo {
      height: 120px;
      background: url('@/assets/logo.jpg') no-repeat center / 200px auto;
      background-size: cover;
      position: sticky;
      top: 0;
      z-index: 1;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }
    &__logo::after {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(360px 140px at 50% 30%, rgba(0, 194, 255, 0.18), transparent 70%);
      pointer-events: none;
    }
    &__menu {
      flex: 1;
      overflow-y: auto;
      padding: 10px 8px 14px;
    }
    .el-menu {
      border-right: none;
      background-color: transparent;
      :deep(.el-menu--inline) {
        background-color: transparent;
      }
      :deep(.el-sub-menu__title),
      :deep(.el-menu-item) {
        height: 46px;
        line-height: 46px;
        border-radius: 10px;
        margin: 6px 6px;
        transition:
          background-color 0.2s ease,
          color 0.2s ease,
          transform 0.15s ease;
      }
      :deep(.el-menu-item:hover),
      :deep(.el-sub-menu__title:hover) {
        background-color: rgba(255, 255, 255, 0.08);
        transform: translateX(2px);
      }
      :deep(.el-menu-item.is-active) {
        background: linear-gradient(135deg, rgba(0, 194, 255, 0.22), rgba(103, 194, 58, 0.18));
        color: #ffffff;
        box-shadow: 0 10px 18px rgba(0, 0, 0, 0.12);
      }
      :deep(.el-sub-menu.is-active > .el-sub-menu__title) {
        background-color: rgba(255, 255, 255, 0.08);
      }
      :deep(.el-menu-item .el-icon),
      :deep(.el-sub-menu__title .el-icon) {
        font-size: 18px;
      }
    }
  }
  .el-header.app-header {
    background: rgba(255, 255, 255, 0.86);
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 64px;
    padding: 0 18px;
    border-bottom: 1px solid rgba(15, 23, 42, 0.06);
    backdrop-filter: blur(10px);
    box-shadow: 0 10px 18px rgba(15, 23, 42, 0.05);
    .header-left {
      display: flex;
      align-items: center;
      gap: 14px;
      min-width: 0;
    }
    .brand {
      font-weight: 800;
      letter-spacing: 1px;
      background: linear-gradient(90deg, #00c2ff, #67c23a);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      white-space: nowrap;
    }
    .admin-info {
      font-size: 14px;
      color: #334155;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      strong {
        color: #0f172a;
      }
    }
    .role-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-left: 8px;
      height: 18px;
      min-width: 18px;
      padding: 0 6px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      color: #fff;
    }
    .role-super {
      background: linear-gradient(135deg, #ff8a05, #ff5f45);
    }
    .role-normal {
      background: linear-gradient(135deg, #64748b, #94a3b8);
    }
    .el-dropdown__box {
      display: flex;
      align-items: center;
      padding: 6px 10px;
      border-radius: 12px;
      transition: background-color 0.2s ease;
      cursor: pointer;
      &:hover {
        background-color: rgba(15, 23, 42, 0.05);
      }
      .admin-name {
        margin-left: 10px;
        font-size: 14px;
        color: #0f172a;
        max-width: 140px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .el-icon {
        color: #999;
        margin-left: 10px;
      }

      &:active,
      &:focus {
        outline: none;
      }
    }
  }
  .el-main {
    padding: 18px;
    background:
      radial-gradient(900px 400px at 20% 0%, rgba(0, 194, 255, 0.08), transparent 60%),
      radial-gradient(900px 400px at 80% 0%, rgba(103, 194, 58, 0.08), transparent 60%), #f6f8fc;
    overflow: auto;
  }
  .el-footer.app-footer {
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 13px;
    color: rgba(15, 23, 42, 0.55);
    background: rgba(255, 255, 255, 0.72);
    border-top: 1px solid rgba(15, 23, 42, 0.06);
    backdrop-filter: blur(10px);
    .sep {
      opacity: 0.6;
    }
  }
}
</style>
