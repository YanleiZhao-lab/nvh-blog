<template>
  <div class="pyodide-runner" ref="root">
    <div class="pyodide-toolbar">
      <span class="pyodide-lang">Python</span>
      <button class="pyodide-run-btn" :disabled="busy || !ready" @click="run">
        {{ busy ? '运行中…' : (ran ? '重新运行' : '▶ 运行') }}
      </button>
      <span v-if="status" :class="['pyodide-status', statusType]">{{ status }}</span>
    </div>
    <pre class="pyodide-output" v-if="output || error">{{ error || output }}</pre>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({ code: { type: String, default: '' } })

const root = ref(null)
const output = ref('')
const error = ref('')
const status = ref('')
const statusType = ref('ok')
const busy = ref(false)
const ready = ref(false)
const ran = ref(false)

let pyodide = null

const MIRRORS = [
  'https://registry.npmmirror.com/pyodide/0.26.4/files/',
  'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/',
]
let loadingPromise = null

async function getPyodide() {
  if (pyodide) return pyodide
  if (loadingPromise) return loadingPromise
  loadingPromise = (async () => {
    let lastErr = null
    for (const base of MIRRORS) {
      try {
        status.value = '加载 Python 运行时(首次约10秒)…'
        statusType.value = 'loading'
        if (!window.loadPyodide) {
          await new Promise((res, rej) => {
            const s = document.createElement('script')
            s.src = base + 'pyodide.js'
            s.onload = res
            s.onerror = () => rej(new Error('load fail: ' + base))
            document.head.appendChild(s)
          })
        }
        pyodide = await window.loadPyodide({ indexURL: base })
        ready.value = true
        return pyodide
      } catch (e) {
        lastErr = e
        // 清理失败的 loadPyodide 状态，试下一个源
      }
    }
    loadingPromise = null
    throw new Error('所有 CDN 均加载失败: ' + lastErr)
  })()
  return loadingPromise
}

async function run() {
  busy.value = true
  error.value = ''
  output.value = ''
  status.value = '运行中…'
  statusType.value = 'loading'
  try {
    const py = await getPyodide()
    let out = ''
    py.setStdout({ batched: (s) => { out += s + '\n' } })
    py.setStderr({ batched: (s) => { out += s + '\n' } })
    // 只允许 numpy（轻量），matplotlib 太重不默认加载
    if (/\bimport\s+numpy\b|from\s+numpy\b/.test(props.code)) {
      await py.loadPackage('numpy')
      status.value = '已加载 numpy…'
    }
    await py.runPythonAsync(props.code)
    output.value = out.trim()
    status.value = '完成 ✓'
    statusType.value = 'ok'
    ran.value = true
  } catch (e) {
    error.value = String(e).split('\n').slice(-8).join('\n')
    status.value = '出错（网络或运行时问题）'
    statusType.value = 'err'
  } finally {
    busy.value = false
    setTimeout(() => { status.value = '' }, 2500)
  }
}
</script>

<style scoped>
.pyodide-runner {
  margin: 12px 0 20px;
  border: 1px solid var(--vp-c-divider, #ccc);
  border-radius: 8px;
  overflow: hidden;
}
.pyodide-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  background: var(--vp-code-bg, #f6f6f7);
  border-bottom: 1px solid var(--vp-c-divider, #ccc);
}
.pyodide-lang {
  font-size: 12px;
  font-weight: 700;
  color: #3572A5;
  letter-spacing: .5px;
}
.pyodide-run-btn {
  margin-left: auto;
  padding: 4px 14px;
  border: none;
  border-radius: 6px;
  background: #2f81f7;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background .2s;
}
.pyodide-run-btn:hover:not(:disabled) { background: #4493f8; }
.pyodide-run-btn:disabled { opacity: .5; cursor: wait; }
.pyodide-status { font-size: 12px; color: var(--vp-c-text-2, #888); }
.pyodide-status.err { color: #f85149; }
.pyodide-status.ok { color: #3fb950; }
.pyodide-output {
  margin: 0;
  padding: 12px 16px;
  font-family: var(--vp-font-family-mono, monospace);
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  max-height: 360px;
  overflow: auto;
  background: var(--vp-c-bg, #fff);
  color: var(--vp-c-text-1, #222);
}
</style>
