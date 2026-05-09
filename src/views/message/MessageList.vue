<!-- eslint-disable no-undef -->
<!-- eslint-disable no-unused-vars -->
<script setup>
import { ref, onMounted } from 'vue'
import { getAdminMessageListService, markAdminMessageAsReadService } from '@/api/message'
import { getAdminListService } from '@/api/setting'
import { RefreshLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { formatTime } from '@/utils/format'
import { useUserListStore } from '@/stores/modules/userList'

const userListStore = useUserListStore()

const messageList = ref([])
const adminList = ref([])
const total = ref(0)
const params = ref({
  pagenum: 1,
  pagesize: 10,
  is_read: true,
})
const list = ref([])

const getMessageList = async () => {
  try {
    const res = await getAdminMessageListService()
    if (params.value.is_read) {
      list.value = res.data.filter((item) => item.is_read === 0)
    } else {
      list.value = res.data
    }
    messageList.value = list.value
    total.value = list.value.length
  } catch (error) {
    ElMessage.error('获取消息列表失败')
  }
}

const handlePage = () => {
  messageList.value = list.value.slice(
    (params.value.pagenum - 1) * params.value.pagesize,
    params.value.pagenum * params.value.pagesize,
  )
}

const getAdminList = async () => {
  try {
    const res = await getAdminListService()
    adminList.value = res.data.admin
  } catch (error) {
    ElMessage.error('获取管理员列表失败')
  }
}

onMounted(() => {
  getMessageList()
  getAdminList()
})

const handleReadMessage = async (row) => {
  try {
    await markAdminMessageAsReadService({ id: row.id })
    ElMessage.success('消息标为已读成功')
    getMessageList()
  } catch (error) {
    ElMessage.error('消息标为已读失败')
  }
}
</script>

<template>
  <page-container title="管理员消息列表">
    <template #extra>
      <el-button type="primary" @click="getMessageList">
        <el-icon><RefreshLeft /></el-icon>
        刷新
      </el-button>
    </template>

    <!-- 搜索表单 -->
    <el-form :inline="true" class="search-form">
      <!-- 只看未读 -->
      <el-form-item label="只看未读">
        <el-checkbox v-model="params.is_read" @change="getMessageList" />
      </el-form-item>
    </el-form>

    <el-table :data="messageList" style="width: 100%">
      <el-table-column prop="id" label="消息ID" min-width="50" align="center" />
      <el-table-column prop="type" label="消息类型" min-width="100">
        <template #default="{ row }">
          {{ row.type === 1 ? '管理员通知' : '用户通知' }}
        </template>
      </el-table-column>
      <el-table-column prop="send_id" label="发布者" min-width="100">
        <template #default="{ row }">
          {{
            (row.type === 2
              ? userListStore.userList.find((user) => user.user_id === row.send_id)?.user_nickname
              : adminList.find((admin) => admin.id === row.send_id)?.username) || '-'
          }}
        </template>
      </el-table-column>
      <el-table-column prop="content" label="消息内容" min-width="200" />
      <el-table-column prop="create_time" label="发送时间" min-width="100">
        <template #default="{ row }">
          {{ formatTime(row.create_time) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" min-width="50">
        <template #default="{ row }">
          <el-button
            type="primary"
            size="small"
            :disabled="row.is_read === 1"
            @click="handleReadMessage(row)"
            >标为已读</el-button
          >
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
      @size-change="handlePage"
      @current-change="handlePage"
      style="margin-top: 20px; display: flex; justify-content: flex-end"
    />
  </page-container>
</template>

<style lang="scss" scoped>
.message-container {
  padding: 20px 0;

  .message-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }
}
</style>
