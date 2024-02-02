<script setup lang="ts">
import { postMessage } from './vscode'
import { ref } from 'vue'

const rootEl = ref<HTMLElement | null>(null)
const isToolbarVisible = ref(false)

function getText() {
  return rootEl.value?.querySelector('slot')!.assignedElements()[0].textContent
}

function copy() {
  postMessage({ command: 'copy', text: getText() })
}
function insert() {
  postMessage({ command: 'insert', text: getText() })
}
</script>

<template>
  <div
    @mouseover="isToolbarVisible = true"
    @mouseout="isToolbarVisible = false"
    :ref="(el: any) => (rootEl = el)"
    class="code"
  >
    <div class="toolbar" :class="{ show: isToolbarVisible }">
      <div @click="copy" class="toolbar-item copy">⧉</div>
      <div @click="insert" class="toolbar-item insert">⪡</div>
    </div>
    <slot></slot>
  </div>
</template>

<style>
.code {
  position: relative;
}

.toolbar {
  display: none;
  position: absolute;
  top: -13px;
  right: 10px;
  height: 26px;
  background-color: var(--vscode-editor-background);
  color: var(--vscode-editor-foreground);
  border-radius: 2px;
  border: 1px solid rgba(127, 127, 127, 0.5);
  user-select: none;
}

.toolbar.show {
  display: flex;
}

.toolbar-item {
  font-size: 16px;
  line-height: 20px;
  width: 20px;
  text-align: center;
  margin: 3px;
  cursor: pointer;
}

.toolbar-item.insert {
  transform: scaleX(-1);
}
</style>
