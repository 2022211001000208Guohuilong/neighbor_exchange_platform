<script setup>
import { ref } from 'vue' // 引入watch
import { useArticleStore } from '@/stores/modules/article'
import { artEditArticleService, artAddArticleService, getArticleDetailService } from '@/api/article'
import { Plus } from '@element-plus/icons-vue'
import '@vueup/vue-quill/dist/vue-quill.snow.css'
import { ElMessage } from 'element-plus'
import { baseURL } from '@/utils/request'
import axios from 'axios'

const articleStore = useArticleStore()
const visibleDrawer = ref(false)
const imgUrl = ref('')
const editorRef = ref()

articleStore.getList()
articleStore.getChannelList()

// 表单数据
const formModel = ref({
  title: '',
  cate_id: '',
  cover_img: '',
  content: '',
  state: '',
})

// 默认空数据
const defaultForm = ref({
  title: '',
  cate_id: '',
  cover_img: '',
  content: '',
  state: '',
})

const params = ref({
  pagenum: 1,
  pagesize: 5,
  cate_id: '',
  state: '',
})
params.value = articleStore.params

//打开编辑抽屉
const open = async (row) => {
  visibleDrawer.value = true
  if (row.id) {
    const res = await getArticleDetailService(row.id)
    formModel.value = res.data
    // 确保图片预览正确
    imgUrl.value = baseURL + formModel.value.cover_img || ''

    const file = await urlToFile(imgUrl.value, formModel.value.cover_img)
    formModel.value.cover_img = file
    console.log(formModel.value.content)
  } else {
    // 重置数据
    formModel.value = { ...defaultForm.value }
    imgUrl.value = ''

    // 清空编辑器
    if (editorRef.value) {
      editorRef.value.quill.setText('')
    }
  }
}

defineExpose({
  open,
})

// 上传新建修改
const onPublish = async (state) => {
  formModel.value.state = state

  // 接口需要formData对象
  const fd = new FormData()
  for (let key in formModel.value) {
    fd.append(key, formModel.value[key])
  }

  // 发请求
  if (formModel.value.id) {
    await artEditArticleService(fd)
    articleStore.getList()
    ElMessage.success('修改成功')
  } else {
    await artAddArticleService(fd)
    params.value = articleStore.params

    // 添加成功后跳转到最后一页
    const lastPage = Math.ceil((articleStore.total + 1) / params.value.pagesize)
    params.value.pagenum = lastPage
    articleStore.getArticleList(params.value)
    ElMessage.success('添加成功')
  }
  visibleDrawer.value = false
}

const onSelectFile = (uploadFile) => {
  // 实现预览
  imgUrl.value = URL.createObjectURL(uploadFile.raw)
  formModel.value.cover_img = uploadFile.raw
}

async function urlToFile(imageUrl, filename = '') {
  try {
    // 1. 发送请求下载图片二进制数据
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer', // 关键：获取二进制数据
      headers: {
        Accept: 'image/*', // 声明接受图片类型
      },
    })

    // 2. 从响应头获取图片 MIME 类型（如 image/jpeg）
    const contentType = response.headers['content-type'] || 'image/jpeg'

    // 3. 生成 Blob 对象
    const blob = new Blob([response.data], { type: contentType })

    // 4. 处理文件名（默认从 URL 提取）
    if (!filename) {
      // 从 URL 中截取文件名（如 "image.jpg"）
      const urlParts = imageUrl.split('/')
      filename = urlParts[urlParts.length - 1].split('?')[0] // 去除 URL 参数
    }

    // 5. 从 Blob 生成 File 对象（File 构造函数：name, lastModified 可选）
    const file = new File([blob], filename, { type: contentType })

    return file
  } catch (error) {
    console.error('图片转换失败：', error)
    throw new Error('无法将 URL 转换为 File 对象')
  }
}
</script>

<template>
  <el-drawer
    v-model="visibleDrawer"
    :title="formModel.id ? '编辑文章' : '添加文章'"
    direction="rtl"
    size="50%"
  >
    <!-- 发表文章表单 -->
    <el-form :model="formModel" ref="formRef" label-width="100px">
      <el-form-item label="文章标题" prop="title">
        <el-input v-model="formModel.title" placeholder="请输入标题"></el-input>
      </el-form-item>
      <el-form-item label="文章分类" prop="cate_id">
        <el-select v-model="formModel.cate_id" placeholder="请选择分类">
          <el-option
            v-for="item in articleStore.channelList"
            :key="item.id"
            :label="item.cate_name"
            :value="item.id"
          >
          </el-option>
        </el-select>
      </el-form-item>

      <!-- 图片上传 -->
      <el-form-item label="文章封面" prop="cover_img">
        <el-upload
          class="avatar-uploader"
          :show-file-list="false"
          auto-upload="false"
          :on-change="onSelectFile"
        >
          <img v-if="imgUrl" :src="imgUrl" class="avatar" />
          <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
        </el-upload>
      </el-form-item>
      <el-form-item label="文章内容" prop="content">
        <div class="editor">
          <!-- 文本框 -->
          <!-- <quill-editor
            ref="editorRef"
            v-model:content="formModel.content"
            theme="snow"
          ></quill-editor> -->

          <el-input
            v-model="formModel.content"
            maxlength="1000"
            style="width: 240px"
            placeholder="请输入内容"
            show-word-limit
            type="textarea"
            class="textarea"
            autosize="true"
            row="5"
          />
        </div>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onPublish('已发布')">发布</el-button>
        <el-button type="info" @click="onPublish('草稿')">草稿</el-button>
      </el-form-item>
    </el-form>
  </el-drawer>
</template>

<style lang="scss" scoped>
.avatar-uploader {
  :deep() {
    .avatar {
      width: 178px;
      height: 178px;
      display: block;
    }
    .el-upload {
      border: 1px dashed var(--el-border-color);
      border-radius: 6px;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      transition: var(--el-transition-duration-fast);
    }
    .el-upload:hover {
      border-color: var(--el-color-primary);
    }
    .el-icon.avatar-uploader-icon {
      font-size: 28px;
      color: #8c939d;
      width: 178px;
      height: 178px;
      text-align: center;
    }
  }
}

.editor {
  width: 100%;
  :deep(.ql-editor) {
    min-height: 200px;
  }
}
</style>
