<script setup lang="ts">
import { onMounted } from 'vue'
import { onDidReceiveMessage, postMessage, onReady } from './vscode'
import * as marked from 'marked'

type Line = HTMLElement & { __end?: boolean; __text?: string }

onMounted(() => {
  const send = document.querySelector('button')!
  const textarea = document.querySelector('textarea')!
  const list = document.getElementById('list')!

  send.addEventListener('click', () => {
    const text = textarea.value
    if (text) {
      postMessage({
        command: 'input',
        text
      })
      textarea.value = ''
    }
  })
  textarea.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault()
      send.click()
    }
  })

  onReady(() => {
    onDidReceiveMessage(function (message: { command: 'appendLine' | 'append'; text: string }) {
      switch (message.command) {
        case 'appendLine': {
          let line = list.querySelector('div:last-child') as Line | null
          if (!line || line.__end) {
            line = document.createElement('div')
            list.appendChild(line)
          }
          line.__end = true
          const text = (line.__text = (line.__text || '') + message.text)
          const html = marked.parse(text) as string
          line.innerHTML = html
          list.scrollTop = list.scrollHeight
          break
        }
        case 'append': {
          let line = list.querySelector('div:last-child') as Line | null
          if (!line || line.__end) {
            line = document.createElement('div')
            list.appendChild(line)
          }
          const text = (line.__text = (line.__text || '') + message.text)
          const html = marked.parse(text + '...') as string
          line.innerHTML = html
          list.scrollTop = list.scrollHeight
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
  <div id="list" class="list"></div>
  <div class="input-box">
    <textarea type="text" placeholder="询问 Copilot" rows="1"></textarea>
    <button>▷</button>
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

.body {
  flex: 1;
  /* user-select: none; */
  box-sizing: border-box;
  background-color: var(--vscode-editor-background);
  color: var(--vscode-editor-foreground);
}

p {
  font-size: 13px;
  line-height: 1.5em;
}

.session {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.list {
  flex: 1;
  overflow: auto;
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
</style>
