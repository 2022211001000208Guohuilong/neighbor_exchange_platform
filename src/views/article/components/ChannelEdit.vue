<script setup>
import { ref, watch } from 'vue'
// import { artAddChannelService, artEditChannelService } from '@/api/article'
import { useArticleStore } from '@/stores/modules/article'

const articleStore = useArticleStore()

const dialogVisible = ref(false)
const formModel = ref({
  cate_name: '1',
  cate_alias: '',
})
const rules = {
  cate_name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { pattern: /^\S{1,10}$/, message: '请输入1-10非空字符', trigger: 'change' },
  ],
  cate_alias: [
    { required: true, message: '请输入分类别名', trigger: 'blur' },
    { pattern: /^\S[a-zA-Z0-9]{1,15}$/, message: '请输入1-15非空字符', trigger: 'change' },
  ],
}

watch(dialogVisible, () => {
  // formModel.value.cate_alias = ''
  // formModel.value.cate_name = ''
})

const open = (row) => {
  dialogVisible.value = true
  // formModel.value.cate_alias = row.cate_alias
  // formModel.value.cate_name = row.cate_name
  formModel.value = { ...row }
  // console.log(formModel.value)
}

const commitChannel = async () => {
  // if (formModel.value.id) {
  //   console.log(formModel.value.id)
  //   await artEditChannelService(formModel.value)
  //   ElMessage({
  //     message: '修改成功',
  //     type: 'success',
  //     plain: true,
  //   })
  // } else {
  //   const res = await artAddChannelService(formModel.value)
  //   ElMessage({
  //     message: '添加成功',
  //     type: 'success',
  //     plain: true,
  //   })
  // }
  articleStore.getChannelList()
  dialogVisible.value = false
}

defineExpose({
  open,
})
</script>

<template>
  <el-dialog v-model="dialogVisible" :title="formModel.id ? '编辑分类' : '添加分类'" width="500">
    <el-form :model="formModel" :rules="rules" label-width="100px">
      <el-form-item label="分类名称：" prop="cate_name">
        <el-input v-model="formModel.cate_name" placeholder="请输入分类名称" p></el-input>
      </el-form-item>
      <el-form-item label="分类别名：" prop="cate_alias">
        <el-input v-model="formModel.cate_alias" placeholder="请输入分类别名"></el-input>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="commitChannel">
          {{ formModel.id ? '确认' : '添加' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>
