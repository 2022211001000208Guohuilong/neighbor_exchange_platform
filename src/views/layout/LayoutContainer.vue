<script setup>
import {
  Management,
  Promotion,
  UserFilled,
  User,
  Crop,
  EditPen,
  SwitchButton,
  CaretBottom,
  DataAnalysis,
  Goods,
  Bell,
  Setting,
  Star,
  List,
  PieChart,
  Key,
} from '@element-plus/icons-vue'
import avatar from '@/assets/default.png'
import { useUserStore } from '@/stores'
import { onMounted } from 'vue'
import router from '@/router'

const userStore = useUserStore()

const handleCommand = (command) => {
  // if (command === 'logout') {
  //   ElMessageBox.confirm('你确认要退出登录吗', '温馨提示', {
  //     confirmButtonText: '确认',
  //     cancelButtonText: '取消',
  //     type: 'warning',
  //   })
  //     .then(() => {
  //       userStore.removeToken()
  //       userStore.setUser({})
  //       router.push('/login')
  //       ElMessage({
  //         type: 'success',
  //         message: '退出成功',
  //       })
  //     })
  //     .catch(() => {})
  // } else {
  //   router.push(`/user/${command}`)
  // }
  router.push(`/user/${command}`)
}

onMounted(() => {
  userStore.setUser({})
  userStore.getUser()
  // console.log('加载', userStore.user)
})
</script>

<template>
  <el-container class="layout-container">
    <el-aside width="200px">
      <div class="el-aside__logo"></div>

      <el-menu
        active-text-color="#ffd04b"
        background-color="#232323"
        :default-active="$route.path"
        text-color="#fff"
        router
      >
        <!-- 数据看板 -->
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据看板</span>
        </el-menu-item>

        <!-- 文章管理 -->
        <el-menu-item index="/article/channel">
          <el-icon><Management /></el-icon>
          <span>文章分类</span>
        </el-menu-item>

        <el-menu-item index="/article/manage">
          <el-icon><Promotion /></el-icon>
          <span>文章管理</span>
        </el-menu-item>

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
          <el-menu-item index="/user/profile">
            <el-icon><User /></el-icon>
            <span>个人资料</span>
          </el-menu-item>
          <el-menu-item index="/user/avatar">
            <el-icon><Crop /></el-icon>
            <span>更换头像</span>
          </el-menu-item>
          <el-menu-item index="/user/password">
            <el-icon><EditPen /></el-icon>
            <span>重置密码</span>
          </el-menu-item>
        </el-sub-menu>

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
            <el-icon><Trades /></el-icon>
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
        <el-menu-item index="/message/send">
          <el-icon><SendMessage /></el-icon>
          <span>消息管理</span>
        </el-menu-item>

        <!-- 系统设置 -->
        <el-sub-menu index="/setting">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>系统设置</span>
          </template>
          <el-menu-item index="/setting/admin">
            <el-icon><Key /></el-icon>
            <span>管理员管理</span>
          </el-menu-item>
          <el-menu-item index="/setting/config">
            <el-icon><Setting /></el-icon>
            <span>系统配置</span>
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header>
        <div>
          程序员：<strong>{{ userStore.user.nickname || userStore.user.username }}</strong>
        </div>
        <el-dropdown placement="bottom-end" @command="handleCommand">
          <span class="el-dropdown__box">
            <el-avatar :src="userStore.user.user_pic || avatar" />
            <el-icon><CaretBottom /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile" :icon="User">基本资料</el-dropdown-item>
              <el-dropdown-item command="avatar" :icon="Crop">更换头像</el-dropdown-item>
              <el-dropdown-item command="password" :icon="EditPen">重置密码</el-dropdown-item>
              <el-dropdown-item command="logout" :icon="SwitchButton">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-header>
      <el-main>
        <router-view></router-view>
      </el-main>
      <el-footer>在线新闻系统 ©2025 Created by GHL</el-footer>
    </el-container>
  </el-container>
</template>

<style lang="scss" scoped>
.layout-container {
  height: 100vh;
  .el-aside {
    background-color: #000000;
    &__logo {
      height: 120px;
      background: url('@/assets/logo.png') no-repeat center / 200px auto;
    }
    .el-menu {
      border-right: none;
    }
  }
  .el-header {
    background-color: #fff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    .el-dropdown__box {
      display: flex;
      align-items: center;
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
  .el-footer {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    color: #666;
  }
}
</style>
