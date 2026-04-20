<!-- eslint-disable no-undef -->
<!-- eslint-disable no-unused-vars -->
<script setup>
import { ref, onMounted } from 'vue'
import {
  sendSystemMessageService,
  getMessageListService,
  deleteMessageService,
} from '@/api/message'
import { ElMessage } from 'element-plus'
import { Promotion } from '@element-plus/icons-vue'
import { formatTime } from '@/utils/format'

const formModel = ref({
  user_id: '',
  msg_content: '',
  msg_type: 1, // 1: 系统通知, 2: 交易通知
})
const messageList = ref([])
const total = ref(0)
const params = ref({
  pagenum: 1,
  pagesize: 10,
})
const list = ref([])

const getMessageList = async () => {
  try {
    const res = await getMessageListService()
    list.value = res.data.filter((item) => item.related_id === null)
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

onMounted(() => {
  getMessageList()
})

const handleSendMessage = async () => {
  if (!formModel.value.user_id) {
    ElMessage.error('请输入用户ID')
    return
  }
  if (isNaN(Number(formModel.value.user_id))) {
    ElMessage.error('用户ID必须是数字')
    return
  }
  if (!formModel.value.msg_content) {
    ElMessage.error('消息内容不能为空')
    return
  }
  if (!formModel.value.msg_type) {
    ElMessage.error('请选择消息类型')
    return
  }

  try {
    await sendSystemMessageService({
      user_id: Number(formModel.value.user_id),
      msg_content: formModel.value.msg_content,
      msg_type: Number(formModel.value.msg_type),
    })
    ElMessage.success('消息发送成功')
    getMessageList()
    // 清空表单
    formModel.value = {
      msg_content: '',
      user_id: '',
      msg_type: 1,
    }
  } catch (error) {
    ElMessage.error('消息发送失败')
  }
}

const handleDeleteMessage = async (row) => {
  // 确认删除
  ElMessageBox.confirm('确定要撤回该消息吗？', '温馨提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'danger',
  }).then(async () => {
    try {
      await deleteMessageService({ msg_id: row.msg_id, user_id: row.user_id })
      ElMessage.success('消息撤回成功')
      getMessageList()
    } catch (error) {
      ElMessage.error('消息撤回失败')
    }
  })
}
</script>

<template>
  <page-container title="消息管理">
    <div class="message-container">
      <!-- 发送单条消息 -->
      <el-card shadow="hover" class="message-card">
        <template #header>
          <div class="card-header">
            <span>发送系统通知</span>
          </div>
        </template>
        <el-form :model="formModel" label-width="100px">
          <el-form-item label="用户ID">
            <el-input v-model="formModel.user_id" placeholder="请输入用户ID" />
          </el-form-item>
          <el-form-item label="消息类型">
            <el-select
              v-model="formModel.msg_type"
              placeholder="请选择消息类型"
              style="width: 120px"
            >
              <el-option label="系统通知" :value="1" />
              <el-option label="交易通知" :value="2" />
            </el-select>
          </el-form-item>
          <el-form-item label="消息内容">
            <el-input
              v-model="formModel.msg_content"
              placeholder="请输入消息内容"
              type="textarea"
              :rows="4"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSendMessage">
              <el-icon><Promotion /></el-icon>
              发送消息
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 消息发送记录 -->
      <el-card shadow="hover" class="message-card" style="margin-top: 30px">
        <template v-if="messageList.length > 0" #header>
          <div class="card-header">
            <el-table :data="messageList" style="width: 100%">
              <el-table-column prop="msg_id" label="消息ID" width="100" />
              <el-table-column prop="user_id" label="用户ID" width="100" />
              <el-table-column prop="msg_type" label="消息类型" width="150">
                <template #default="{ row }">
                  {{ row.msg_type === 1 ? '系统通知' : '交易通知' }}
                </template>
              </el-table-column>
              <el-table-column prop="msg_content" label="消息内容" min-width="200" />
              <el-table-column prop="create_time" label="发送时间" width="150">
                <template #default="{ row }">
                  {{ formatTime(row.create_time) }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="80">
                <template #default="{ row }">
                  <el-button type="danger" size="small" @click="handleDeleteMessage(row)">
                    撤回
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
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
        </template>
        <el-empty v-if="messageList.length === 0" description="暂无消息发送记录" />
      </el-card>
    </div>
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
