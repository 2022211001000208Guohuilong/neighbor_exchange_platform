<!-- eslint-disable no-unused-vars -->
<script setup>
import { ref, onMounted } from 'vue'
import { getSystemConfigService, updateSystemConfigService } from '@/api/admin/setting'
import { ElMessage } from 'element-plus'
import { RefreshLeft, Check } from '@element-plus/icons-vue'

const loading = ref(true)
const configForm = ref({
  site_name: '',
  site_description: '',
  contact_email: '',
  contact_phone: '',
  jwt_expire: 72,
  max_upload_size: 5,
  maintenance_mode: false,
})

const loadSystemConfig = async () => {
  loading.value = true
  try {
    const res = await getSystemConfigService()
    configForm.value = res.data
  } catch (error) {
    ElMessage.error('获取系统配置失败')
  } finally {
    loading.value = false
  }
}

const handleSaveConfig = async () => {
  try {
    await updateSystemConfigService(configForm.value)
    ElMessage.success('系统配置更新成功')
  } catch (error) {
    ElMessage.error('系统配置更新失败')
  }
}

onMounted(() => {
  loadSystemConfig()
})
</script>

<template>
  <page-container title="系统配置">
    <template #extra>
      <el-button type="primary" @click="handleSaveConfig">
        <el-icon><Check /></el-icon>
        保存配置
      </el-button>
      <el-button type="info" @click="loadSystemConfig">
        <el-icon><RefreshLeft /></el-icon>
        刷新
      </el-button>
    </template>

    <div class="config-container" v-loading="loading">
      <el-card shadow="hover" class="config-card">
        <template #header>
          <div class="card-header">
            <span>基本配置</span>
          </div>
        </template>
        <el-form :model="configForm" label-width="120px">
          <el-form-item label="网站名称">
            <el-input v-model="configForm.site_name" placeholder="请输入网站名称" />
          </el-form-item>
          <el-form-item label="网站描述">
            <el-input
              v-model="configForm.site_description"
              placeholder="请输入网站描述"
              type="textarea"
              :rows="3"
            />
          </el-form-item>
          <el-form-item label="联系邮箱">
            <el-input v-model="configForm.contact_email" placeholder="请输入联系邮箱" />
          </el-form-item>
          <el-form-item label="联系电话">
            <el-input v-model="configForm.contact_phone" placeholder="请输入联系电话" />
          </el-form-item>
        </el-form>
      </el-card>

      <el-card shadow="hover" class="config-card" style="margin-top: 30px">
        <template #header>
          <div class="card-header">
            <span>系统配置</span>
          </div>
        </template>
        <el-form :model="configForm" label-width="120px">
          <el-form-item label="JWT过期时间(小时)">
            <el-input-number v-model="configForm.jwt_expire" :min="1" :max="720" />
          </el-form-item>
          <el-form-item label="最大上传大小(MB)">
            <el-input-number v-model="configForm.max_upload_size" :min="1" :max="50" />
          </el-form-item>
          <el-form-item label="维护模式">
            <el-switch v-model="configForm.maintenance_mode" />
          </el-form-item>
        </el-form>
      </el-card>

      <el-card shadow="hover" class="config-card" style="margin-top: 30px">
        <template #header>
          <div class="card-header">
            <span>交易规则</span>
          </div>
        </template>
        <el-form :model="configForm" label-width="120px">
          <el-form-item label="交易规则">
            <el-input
              v-model="configForm.trade_rules"
              placeholder="请输入交易规则"
              type="textarea"
              :rows="5"
            />
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </page-container>
</template>

<style lang="scss" scoped>
.config-container {
  padding: 20px 0;

  .config-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }
}
</style>
