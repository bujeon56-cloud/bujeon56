<template>
  <VDialog :model-value="modelValue" :aria-labelledby="titleId" max-width="540" scrollable @update:model-value="value => { if (!value) close() }">
    <VCard color="surface" rounded="xl" class="w-full border border-slate-200">
      <div class="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-5 py-3 sm:px-6">
        <h3 :id="titleId" class="text-base font-bold text-slate-900">
          <slot name="title">{{ title }}</slot>
        </h3>
        <VBtn type="button" aria-label="닫기" icon variant="text" size="36" class="text-slate-600" @click="close">
          <X class="h-5 w-5" aria-hidden="true" />
        </VBtn>
      </div>
      <div class="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-5 sm:p-6">
        <slot />
      </div>
      <div v-if="$slots.footer" class="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3 sm:px-6">
        <slot name="footer" />
      </div>
    </VCard>
  </VDialog>
</template>

<script setup>
import { X } from 'lucide-vue-next';
import { useId } from 'vue';
import { VBtn } from 'vuetify/components/VBtn';
import { VCard } from 'vuetify/components/VCard';
import { VDialog } from 'vuetify/components/VDialog';

const titleId = useId();

defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:modelValue', 'close']);

const close = () => {
  emit('update:modelValue', false);
  emit('close');
};
</script>
