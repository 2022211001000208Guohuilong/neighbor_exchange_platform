<!-- eslint-disable no-unused-vars -->
<script setup>
import { ref } from 'vue'
import { sendSystemMessageService, batchSendMessageService } from '@/api/admin/message'
import { ElMessage, ElMessageBox, ElDialog } from 'element-plus'
import { SendMessage, User } from '@element-plus/icons-vue'

const formModel = ref({
  title: '',
  content: '',
  user_id: '',
})
const batchFormModel = ref({
  title: '',
  content: '',
  user_ids: '',
})
const batchDialogVisible = ref(false)

const handleSendMessage = async () => {
  if (!formModel.value.title) {
    ElMessage.error('消息标题不能为空')
    return
  }
  if (!formModel.value.content) {
    ElMessage.error('消息内容不能为空')
    return
  }
  if (!formModel.value.user_id) {
    ElMessage.error('请输入用户ID')
    return
  }

  try {
    await sendSystemMessageService({
      user_id: formModel.value.user_id,
      title: formModel.value.title,
      content: formModel.value.content,
    })
    ElMessage.success('消息发送成功')
    // 清空表单
    formModel.value = {
      title: '',
      content: '',
      user_id: '',
    }
  } catch (error) {
    ElMessage.error('消息发送失败')
  }
}

const handleBatchSendMessage = async () => {
  if (!batchFormModel.value.title) {
    ElMessage.error('消息标题不能为空')
    return
  }
  if (!batchFormModel.value.content) {
    ElMessage.error('消息内容不能为空')
    return
  }
  if (!batchFormModel.value.user_ids) {
    ElMessage.error('请输入用户ID列表')
    return
  }

  try {
    const userIds = batchFormModel.value.user_ids.split(',').map((id) => id.trim())
    await batchSendMessageService({
      user_ids: userIds,
      title: batchFormModel.value.title,
      content: batchFormModel.value.content,
    })
    ElMessage.success('批量消息发送成功')
    batchDialogVisible.value = false
    // 清空表单
    batchFormModel.value = {
      title: '',
      content: '',
      user_ids: '',
    }
  } catch (error) {
    ElMessage.error('批量消息发送失败')
  }
}

const openBatchDialog = () => {
  batchDialogVisible.value = true
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
          <el-form-item label="消息标题">
            <el-input v-model="formModel.title" placeholder="请输入消息标题" />
          </el-form-item>
          <el-form-item label="消息内容">
            <el-input
              v-model="formModel.content"
              placeholder="请输入消息内容"
              type="textarea"
              :rows="4"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSendMessage">
              <el-icon><SendMessage /></el-icon>
              发送消息
            </el-button>
            <el-button type="info" @click="openBatchDialog">
              <el-icon><User /></el-icon>
              批量发送
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 批量发送消息对话框 -->
      <el-dialog v-model="batchDialogVisible" title="批量发送消息" width="600px">
        <el-form :model="batchFormModel" label-width="100px">
          <el-form-item label="用户ID列表">
            <el-input
              v-model="batchFormModel.user_ids"
              placeholder="请输入用户ID，多个ID用逗号分隔"
              type="textarea"
              :rows="3"
            />
          </el-form-item>
          <el-form-item label="消息标题">
            <el-input v-model="batchFormModel.title" placeholder="请输入消息标题" />
          </el-form-item>
          <el-form-item label="消息内容">
            <el-input
              v-model="batchFormModel.content"
              placeholder="请输入消息内容"
              type="textarea"
              :rows="4"
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="batchDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="handleBatchSendMessage">发送消息</el-button>
          </span>
        </template>
      </el-dialog>

      <!-- 消息发送记录 -->
      <el-card shadow="hover" class="message-card" style="margin-top: 30px">
        <template #header>
          <div class="card-header">
            <span>消息发送记录</span>
          </div>
        </template>
        <el-empty description="暂无消息发送记录" />
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
