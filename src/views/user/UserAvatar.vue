<script setup>
import { ref } from 'vue'
import PageContainer from '@/components/PageContainer.vue'
import { Plus, Upload, Check } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores'
import { userUpdateAvatar } from '@/api/user'
import { ElMessage } from 'element-plus' // 补充引入ElMessage

const userStore = useUserStore()
const uploadRef = ref()
const imgUrl = ref(userStore.user?.user_pic || '')
const base64Image = ref('') // 存储base64格式图片（用于上传）
const isUploading = ref(false)

// 处理文件选择并转换为base64
const onSelectFile = (uploadFile) => {
  const file = uploadFile.raw
  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    ElMessage.error('请选择图片文件（JPG/PNG）')
    return
  }
  // 验证文件大小（2MB以内）
  if (file.size > 2 * 1024 * 1024) {
    ElMessage.error('文件大小不能超过2MB')
    return
  }

  // 生成预览URL
  imgUrl.value = URL.createObjectURL(file)

  // 转换为base64格式（用于上传）
  const reader = new FileReader()
  reader.onload = (e) => {
    base64Image.value = e.target.result // 结果格式：data:image/png;base64,...
  }
  reader.readAsDataURL(file) // 关键：将文件转为base64
}

// 提交上传
const submitUpload = async () => {
  if (!base64Image.value) {
    ElMessage.warning('请先选择图片')
    return
  }

  isUploading.value = true
  try {
    // 调用接口上传base64图片（而非blob URL）
    await userUpdateAvatar(base64Image.value) // 传递base64格式，符合后端验证规则

    // 假设接口返回成功
    ElMessage.success('头像上传成功')
    // 更新用户存储中的头像
    userStore.user.user_pic = base64Image.value
    // 可选：如果需要刷新页面生效，可调用store的更新方法
    // userStore.updateUserAvatar(base64Image.value)
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '上传失败，请重试')
    console.error('上传错误:', error)
  } finally {
    isUploading.value = false
  }
}
</script>

<template>
  <page-container title="更换头像">
    <div class="avatar-container">
      <!-- 头像预览区域 -->
      <div class="avatar-preview">
        <div class="preview-wrapper">
          <el-upload
            class="avatar-uploader"
            ref="uploadRef"
            :show-file-list="false"
            auto-upload="false"
            :on-change="onSelectFile"
            accept="image/jpeg,image/png"
          >
            <div class="image-box">
              <img v-if="imgUrl" :src="imgUrl" class="avatar-img" alt="用户头像" loading="lazy" />
              <div v-else class="default-avatar">
                <el-icon class="avatar-icon"><Plus /></el-icon>
                <p class="placeholder-text">点击上传头像</p>
              </div>
              <!-- 悬停提示遮罩 -->
              <div class="upload-mask">
                <span class="mask-text">点击更换图片</span>
              </div>
            </div>
          </el-upload>
        </div>

        <!-- 格式说明 -->
        <div class="format-tips">
          <p>支持 JPG、PNG 格式，建议尺寸 300×300px</p>
          <p>文件大小不超过 2MB</p>
        </div>
      </div>

      <!-- 操作按钮区域 -->
      <div class="action-buttons">
        <el-button
          type="primary"
          :icon="Plus"
          class="select-btn"
          @click="$refs.uploadRef.$el.querySelector('input[type=file]').click()"
        >
          选择图片
        </el-button>
        <el-button
          type="success"
          :icon="isUploading ? Check : Upload"
          class="upload-btn"
          @click="submitUpload"
          :loading="isUploading"
          :disabled="!base64Image"
        >
          {{ isUploading ? '上传中...' : '确认上传' }}
        </el-button>
      </div>
    </div>
  </page-container>
</template>

<style lang="scss" scoped>
/* 样式保持不变 */
.avatar-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 30px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
}

.avatar-preview {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.preview-wrapper {
  width: 300px;
  height: 300px;
  position: relative;
}

.image-box {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  position: relative;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
  }
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;

  .image-box:hover & {
    transform: scale(1.02);
  }
}

.default-avatar {
  width: 100%;
  height: 100%;
  background-color: #f5f7fa;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.avatar-icon {
  font-size: 40px;
  color: #8c939d;
}

.placeholder-text {
  color: #8c939d;
  font-size: 14px;
  margin: 0;
}

.upload-mask {
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  cursor: pointer;

  .image-box:hover & {
    opacity: 1;
  }
}

.mask-text {
  color: white;
  font-size: 16px;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 20px;
  background-color: rgba(0, 0, 0, 0.5);
}

.format-tips {
  text-align: center;
  color: #606266;
  font-size: 13px;
  line-height: 1.6;
  padding: 8px 16px;
  background-color: #f5f7fa;
  border-radius: 6px;
  width: 100%;
  max-width: 300px;
}

.action-buttons {
  display: flex;
  gap: 16px;
  margin-top: 10px;
}

.select-btn,
.upload-btn {
  padding: 10px 24px;
  font-size: 14px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.upload-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

:deep(.el-upload) {
  border: none !important;
  padding: 0 !important;
  background: transparent !important;
}

:deep(.el-upload:hover) {
  border-color: transparent !important;
}
</style>
