<script setup>
// 应用外壳：仅承载路由视图。各页面自行管理布局。
</script>

<template>
  <router-view v-slot="{ Component }">
    <component :is="Component" />
  </router-view>
</template>
