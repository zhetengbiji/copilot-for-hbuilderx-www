<script setup lang="ts">
import { onMounted, ref, nextTick, reactive } from 'vue'
import { onDidReceiveMessage, postMessage, onReady } from './vscode'
import { Marked } from 'marked'
import { throttle } from 'lodash-es'
import hljs from 'highlight.js/lib/common'
// import 'highlight.js/styles/github.css'
// import 'highlight.js/styles/github-dark.css'

const marked = new Marked({
  renderer: {
    code(code, lang = '', escaped) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext'
      const html = escaped ? code : hljs.highlight(code, { language }).value
      return `<code-view>
  <pre><code class="xxx hljs language-${lang}">${html}</code></pre>
</code-view>`
    }
  }
})

type Line = {
  end?: boolean
  text: string
  html: string
}

const textarea = ref('')
const list = ref<Line[]>([])
const listEl = ref<HTMLElement | null>(null)
const loading = ref(false)

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

function stop() {
  postMessage({
    command: 'stop'
  })
}

function add() {
  postMessage({
    command: 'add'
  })
}

function enter(event: KeyboardEvent) {
  if (!event.shiftKey && !event.isComposing) {
    event.preventDefault()
    const button = document.querySelector('[data-command="send"]') as HTMLButtonElement | null
    button?.click()
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
    onDidReceiveMessage(function (message: {
      command: 'appendLine' | 'append' | 'updateLoading' | 'clear'
      text?: string
      loading?: boolean
    }) {
      switch (message.command) {
        case 'appendLine': {
          append(message.text!, true)
          break
        }
        case 'append': {
          append(message.text!)
          break
        }
        case 'clear': {
          list.value = []
          break
        }
        case 'updateLoading': {
          loading.value = message.loading!
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
  <div class="nav">
    <button @click="add">+</button>
  </div>
  <div :ref="(el: any) => (listEl = el)" class="list">
    <div v-for="(item, index) in list" :key="index" v-html="item.html"></div>
  </div>
  <div class="input-box">
    <textarea
      type="text"
      placeholder="询问 Copilot"
      rows="1"
      v-model="textarea"
      @keydown.enter="enter"
    ></textarea>
    <button data-command="send" v-if="!loading" @click="send">▷</button>
    <button v-if="loading" @click="stop">■</button>
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

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
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

.nav {
  display: flex;
  justify-content: flex-end;
  padding: 1px 5px 5px 5px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.4);
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
  color: var(--vscode-input-foreground);
  border-radius: 3px;
  cursor: pointer;
}

button:hover {
  outline: 1px solid var(--vscode-input-border);
}

button:focus {
  outline: none;
}

.input-box button {
  position: absolute;
  right: 16px;
  top: 50%;
  margin-top: -11px;
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
