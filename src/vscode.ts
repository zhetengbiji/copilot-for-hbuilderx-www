declare global {
  var acquireVsCodeApi: () => {
    postMessage: (options: any) => void
    onDidReceiveMessage: (callback: (options: any) => void) => void
  }
  var hbuilderx: {
    postMessage: (options: any) => void
    onDidReceiveMessage: (callback: (options: any) => void) => void
  }
}

var notHbuilderx = false

if (!window.acquireVsCodeApi) {
  window.acquireVsCodeApi = function () {
    return {
      postMessage: function (options) {
        window.hbuilderx && hbuilderx.postMessage(options)
      },
      onDidReceiveMessage: function (callback) {
        window.hbuilderx && hbuilderx.onDidReceiveMessage(callback)
      }
    }
  }
} else {
  notHbuilderx = true
}

const vscodeApi = window.acquireVsCodeApi()

export const postMessage = vscodeApi.postMessage.bind(vscodeApi)

export const onDidReceiveMessage =
  vscodeApi.onDidReceiveMessage ||
  function (callback) {
    window.addEventListener('message', (event) => callback(event.data))
  }

export function onReady(callback: () => void) {
  // TODO check hbuilderx ready
  setTimeout(callback, 200)
}
