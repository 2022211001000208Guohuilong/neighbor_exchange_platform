<script setup>
defineProps({
  title: {
    required: true,
    type: String,
  },
})
</script>

<template>
  <el-card class="page-container">
    <template v-slot:header>
<div  class="header">
      <span>{{ title }}</span>
      <div class="extra">
        <slot name="extra"></slot>
      </div>
    </div>
</template>

    <slot></slot>
  </el-card>
</template>

<style lang="scss" scoped>
.page-container {
  min-height: 100%;
  box-sizing: border-box;
  .header {
    display: flex;
    min-height: 50px;
    align-items: center;
    border-bottom: 1px solid #d3d3d3;
    justify-content: space-between;
    margin-bottom: 10px;
  }
}
</style>
