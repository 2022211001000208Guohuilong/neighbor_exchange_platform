/* eslint-disable no-unused-vars */
import LayoutContainer from '@/views/layout/LayoutContainer.vue'
import UserPassword from '@/views/setting/UserPassword.vue'
import loginPage from '@/views/login/LoginPage.vue'
import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', component: loginPage },
    {
      path: '/',
      component: LayoutContainer,
      redirect: '/dashboard',
      children: [
        // 数据看板
        { path: '/dashboard', component: () => import('@/views/dashboard/DashboardView.vue') },

        // 用户管理
        { path: '/user/list', component: () => import('@/views/user/UserList.vue') },
        { path: '/user/statistic', component: () => import('@/views/user/UserStatistic.vue') },

        // 商品管理
        { path: '/goods/list', component: () => import('@/views/goods/GoodsList.vue') },
        { path: '/goods/audit', component: () => import('@/views/goods/GoodsAudit.vue') },
        { path: '/goods/category', component: () => import('@/views/goods/GoodsCategory.vue') },

        // 交易管理
        { path: '/trade/list', component: () => import('@/views/trade/TradeList.vue') },
        { path: '/trade/statistic', component: () => import('@/views/trade/TradeStatistic.vue') },

        // 公告管理
        { path: '/notice/list', component: () => import('@/views/notice/NoticeList.vue') },

        // 消息管理
        {
          path: '/message/MessageList',
          component: () => import('@/views/message/MessageList.vue'),
        },
        {
          path: '/message/MessageSend',
          component: () => import('@/views/message/MessageSend.vue'),
        },

        // 账号管理
        { path: '/setting/admin', component: () => import('@/views/setting/AdminManage.vue') },
        { path: '/user/password', component: UserPassword },
      ],
    },
  ],
})

//默认放行
router.beforeEach((to, from) => {
  const userStore = useUserStore()

  if (!userStore.token && to.path !== '/login') return '/login'
})

export default router
