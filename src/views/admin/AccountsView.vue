<template>
  <div v-if="auth.isAdmin" class="space-y-6">
    <h2 class="text-xl font-black text-slate-900">계정 관리</h2>
    <AdminAccountSetup />
  </div>
</template>
<script setup>
import {useAuthStore} from '../../stores/authStore';
import AdminAccountSetup from '../../components/AdminAccountSetup.vue';
const auth=useAuthStore();
</script>
