<script setup lang="ts">
import { onMounted, ref, nextTick, reactive } from 'vue'
import { onDidReceiveMessage, postMessage, onReady } from './vscode'
import { Marked } from 'marked'
import { throttle } from 'lodash-es'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js/lib/common'
// import 'highlight.js/styles/github.css'
// import 'highlight.js/styles/github-dark.css'

const marked = new Marked(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang, info) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext'
      return hljs.highlight(code, { language }).value
    }
  })
)

type Line = {
  end?: boolean
  text: string
  html: string
}

const textarea = ref('')
const list = ref<Line[]>([])
const listEl = ref<HTMLElement | null>(null)

function send() {
  const text = textarea.value
  if (text) {
    postMessage({
      command: 'input',
      text
    })
    textarea.value = ''
  }
}

function enter(event: KeyboardEvent) {
  if (!event.shiftKey && !event.isComposing) {
    event.preventDefault()
    const button = document.querySelector('button')!
    button.click()
  }
}

const refresh = throttle((line: Line) => {
  line.html = marked.parse(line.text + (line.end ? '' : '...')) as string
  nextTick(() => {
    listEl.value!.scrollTop = listEl.value!.scrollHeight
  })
}, 100)

function append(text: string, end: boolean = false) {
  let line = list.value[list.value.length - 1]
  if (!line || line.end) {
    line = reactive({
      text: '',
      html: ''
    })
    list.value.push(line)
  }
  line.end = end
  line.text += text
  if (end) {
    refresh.flush()
  }
  refresh(line)
  if (end) {
    refresh.flush()
  }
}

onMounted(() => {
  onReady(() => {
    onDidReceiveMessage(function (message: { command: 'appendLine' | 'append'; text: string }) {
      switch (message.command) {
        case 'appendLine': {
          append(message.text, true)
          break
        }
        case 'append': {
          append(message.text)
          break
        }
      }
    })
    postMessage({
      command: 'ready'
    })
  })
})
</script>

<template>
  <div :ref="(el: any) => (listEl = el)" class="list">
    <div v-for="(item, index) in list" :key="index" v-html="item.html"></div>
  </div>
  <div class="input-box">
    <textarea type="text" placeholder="询问 Copilot" rows="1" v-model="textarea" @keydown.enter="enter"></textarea>
    <button @click="send">▷</button>
  </div>
</template>

<style>
html,
body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
}

html {
  font-size: 13px;
}

body {
  flex: 1;
  /* user-select: none; */
  box-sizing: border-box;
  background-color: var(--vscode-background);
  color: var(--vscode-foreground);
}

.session {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.list {
  flex: 1;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 10px;
}

.input-box {
  display: flex;
  padding: 10px;
  position: relative;
}

textarea {
  font-size: 13px;
  padding: 8px 6px;
  padding-right: 28px;
  line-height: 20px;
  border: none;
  resize: auto;
  flex: 1;
  background: none;
  border-radius: 4px;
  background-color: var(--vscode-input-background);
  border: 1px solid var(--vscode-input-border);
  color: var(--vscode-input-foreground);
  min-height: 20px;
}

textarea::placeholder {
  color: var(--vscode-input-placeholderForeground);
}

textarea:focus {
  outline: none;
  border-color: var(--vscode-inputOption-activeBorder);
}

button {
  border: none;
  background: none;
  width: 22px;
  line-height: 22px;
  font-size: 16px;
  height: 22px;
  text-align: center;
  position: absolute;
  right: 16px;
  top: 50%;
  margin-top: -11px;
  color: var(--vscode-input-foreground);
}

.hljs {
  background-color: var(--vscode-editor-background);
  color: var(--vscode-editor-foreground);
  display: block;
  padding: 5px;
  padding-bottom: 15px;
  overflow-y: auto;
  border-radius: 3px;
  border: 1px solid rgba(127, 127, 127, 0.5);
}
</style>
