<script setup>
import { Edit, Delete } from '@element-plus/icons-vue'
import { ref } from 'vue'
import { artDelArticleService } from '@/api/article'
import { useArticleStore } from '@/stores/modules/article'
import { formatTime } from '@/utils/format'
import ArticleEdit from './components/ArticleEdit.vue'

const articleStore = useArticleStore()
const articleList = ref([])
const params = ref({
  pagenum: 1,
  pagesize: 5,
  cate_id: '',
  state: '',
})
//控制加载
const loading = ref(true)
const total = ref(0)

// const getArticleList = () => {
//   articleStore.getArticleList(params.value)
//   articleList.value = articleStore.articleList
//   total.value = articleStore.total
//   console.log('aaa', articleList.value)
//   loading.value = false
// }
articleStore.getChannelList()
articleStore.getArticleList(params.value)
articleList.value = articleStore.articleList
total.value = articleStore.total
loading.value = false

//删除
const onDelArticle = async (row) => {
  //提示是否确认删除
  // ElMessageBox.confirm('你确认要删除吗', '温馨提示', {
  //   confirmButtonText: '确认',
  //   cancelButtonText: '取消',
  //   type: 'warning',
  // })
  //   .then(async () => {
  //     await artDelArticleService(row.id)
  //     articleStore.getArticleList(params.value)
  //     // ElMessage({
  //     //   type: 'success',
  //     //   message: '删除成功',
  //     //   plain: true,
  //     // })
  //   })
  //   .catch(() => {})
  await artDelArticleService(row.id)
}

const updateList = () => {
  articleStore.getArticleList(params.value)
  // console.log('hhh')
}

const reset = () => {
  params.value.cate_id = ''
  params.value.state = ''
  articleStore.getArticleList(params.value)
}

const articleEditRef = ref()
//添加文章
// const onAddArticle = () => {
//   articleEditRef.value.open({})
// }

//编辑文章
const onEditArticle = (row) => {
  articleEditRef.value.open(row)
}

const getList = () => {
  articleStore.getArticleList(params.value)
}
</script>

<template>
  <page-container title="文章管理">
    <!-- <template #extra class="extra">
      <el-button type="primary" @click="onAddArticle">添加文章</el-button>
    </template> -->

    <!-- 表单区域 -->
    <el-form :inline="true" class="form">
      <el-form-item label="文章分类:">
        <!-- <ChannelSerlect v-model="cateId"></ChannelSerlect> -->
        <el-select v-model="params.cate_id" style="width: 200px">
          <el-option
            v-for="item in articleStore.channelList"
            :key="item.id"
            :label="item.cate_name"
            :value="item.id"
          ></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="发布状态:">
        <el-select v-model="params.state" style="width: 200px">
          <el-option label="已发布" value="已发布"></el-option>
          <el-option label="草稿" value="草稿"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="updateList">搜索</el-button>
        <el-button @click="reset">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 表格区域 -->
    <el-table :data="articleStore.articleList" style="width: 100%" v-loading="loading">
      <el-table-column prop="title" label="文章标题">
        <template #default="{ row }">
          <el-link type="primary" :underline="false">{{ row.title }}</el-link>
        </template>
      </el-table-column>
      <el-table-column prop="cate_name" label="分类"></el-table-column>
      <el-table-column prop="pub_date" label="发表时间">
        <template #default="{ row }">
          <span>{{ formatTime(row.pub_date) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="state" label="状态"></el-table-column>
      <el-table-column prop="" label="操作">
        <template #default="{ row }">
          <el-button
            plain
            circle
            type="warning"
            :icon="Delete"
            @click="onDelArticle(row)"
          ></el-button>
          <el-button
            plain
            circle
            type="primary"
            :icon="Edit"
            @click="onEditArticle(row)"
          ></el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      v-model:current-page="params.pagenum"
      v-model:page-size="params.pagesize"
      :page-sizes="[2, 3, 5, 10]"
      :background="true"
      layout="jumper, total, sizes, prev, pager, next"
      :total="articleStore.total"
      @size-change="getList"
      @current-change="getList"
      class="pagination"
    />
    <ArticleEdit ref="articleEditRef"></ArticleEdit>
  </page-container>
</template>

<style lang="scss">
.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
.form {
  margin-top: 20px;
}
</style>
