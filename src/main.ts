import { createApp, defineCustomElement } from 'vue'
import App from './App.vue'
import CodeView from './CodeView.ce.vue'

customElements.define('code-view', defineCustomElement(CodeView))
createApp(App).mount('#app')
