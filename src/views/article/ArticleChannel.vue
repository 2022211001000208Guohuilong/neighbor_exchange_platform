<script setup>
import { ref, onMounted } from 'vue'
import { useArticleStore } from '@/stores/modules/article'
import { Delete, Edit } from '@element-plus/icons-vue'
import ChannelEdit from './components/ChannelEdit.vue'
import { artDelChannelService } from '@/api/article'

const articleStore = useArticleStore()

onMounted(() => {
  // loading.value = true
  articleStore.getChannelList()
  loading.value = false
})

const loading = ref(true)
const dialog = ref()

const onDelChannel = async (row) => {
  // ElMessageBox.confirm('你确认要删除吗', '温馨提示', {
  //   confirmButtonText: '确认',
  //   cancelButtonText: '取消',
  //   type: 'warning',
  // })
  //   .then(async () => {
  //     await artDelChannelService(row.id)
  //     articleStore.getChannelList()
  //     ElMessage({
  //       type: 'success',
  //       message: '删除成功',
  //       plain: true,
  //     })
  //   })
  //   .catch(() => {})
  await artDelChannelService(row.id)
}

const onEditChannel = (row) => {
  dialog.value.open(row)
}

const onAddChannel = () => {
  dialog.value.open({})
}
</script>

<template>
  <page-container title="文章分类">
    <template #extra>
      <el-button type="primary" @click="onAddChannel">添加分类</el-button>
    </template>

    <div v-loading="loading">
      <div v-if="articleStore.channelList.length > 0">
        <el-table :data="articleStore.channelList" style="width: 100%">
          <el-table-column type="index" label="序号" width="200"> </el-table-column>
          <el-table-column prop="cate_name" label="类名" width="400"> </el-table-column>
          <el-table-column prop="cate_alias" label="别名" width="400"> </el-table-column>
          <el-table-column prop="" label="操作" width="200">
            <template #default="{ row, $index }">
              <el-button
                :icon="Delete"
                type="danger"
                circle
                plain
                @click="onDelChannel(row, $index)"
              ></el-button>
              <el-button
                :icon="Edit"
                type="primary"
                circle
                plain
                @click="onEditChannel(row, $index)"
              ></el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div v-else>
        <el-empty description="这里空空如也~" />
      </div>
    </div>
    <ChannelEdit ref="dialog"></ChannelEdit>
  </page-container>
</template>

<style lang="scss"></style>
