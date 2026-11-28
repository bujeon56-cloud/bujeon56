<template>
  <Transition name="fade">
    <div 
      v-if="modelValue" 
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4"
      @click.self="close"
    >
      <div 
        class="modal-panel animate-scale-up flex max-h-[85dvh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-slate-200 text-slate-900 shadow-2xl"
      >
        <!-- Modal Header -->
        <div class="flex items-center justify-between border-b border-slate-200 bg-slate-100 px-6 py-4">
          <h3 class="font-bold text-lg text-slate-800 flex items-center gap-2">
            <slot name="title">{{ title }}</slot>
          </h3>
          <button 
            type="button"
            aria-label="닫기"
            @click="close"
            class="flex h-8 w-8 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-200 hover:text-slate-900"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-6 overflow-y-auto overscroll-contain min-h-0 space-y-4">
          <slot></slot>
        </div>

        <!-- Modal Footer -->
        <div v-if="$slots.footer" class="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-100 px-6 py-4">
          <slot name="footer"></slot>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { X } from 'lucide-vue-next';

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

<style scoped>
.modal-panel {
  background-color: rgb(var(--app-surface-white, 255 255 255));
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes scaleUp {
  0% { transform: scale(0.95); }
  100% { transform: scale(1); }
}

.animate-scale-up {
  animation: scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
