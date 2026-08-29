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
  '/pyodide/',                                  // 自托管（同域，最稳）
  'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/',  // 备用
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
          // fetch + eval：同域最稳（script 标签在部分环境静默失败）
          const r = await fetch(base + 'pyodide.js?v=26')
          if (!r.ok) throw new Error('fetch pyodide.js: ' + r.status)
          const code = await r.text()
          // eslint-disable-next-line no-eval
          (0, eval)(code)
          if (!window.loadPyodide) throw new Error('loadPyodide 未定义')
        }
        let idxURL = base.startsWith('/') ? new URL(base, location.origin).href : base
        // Pyodide 0.26 支持 indexURL 带 query？不支持 — 改用 lockFileURL 方式不可靠
        // 直接方案：asm.js 的 404 缓存需要 CF purge，这里用 canonical URL
        pyodide = await window.loadPyodide({ indexURL: idxURL })
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

const BLOCKED = /\b(import\s+(os|sys|subprocess|socket|shutil|pathlib|ctypes|requests|urllib|http|pickle)|from\s+(os|sys|subprocess|socket|pathlib|ctypes|requests|urllib)\b|\bopen\s*\(|\bexec\s*\(|\beval\s*\(|__import__|\bos\.|\bsys\.)/

function guard(code) {
  if (BLOCKED.test(code)) throw new Error('安全限制：演示代码仅允许 numpy/math 演示用途')
  if (code.split('\n').length > 60) throw new Error('安全限制：代码超过 60 行')
}

async function run() {
  busy.value = true
  error.value = ''
  output.value = ''
  status.value = '运行中…'
  statusType.value = 'loading'
  try {
    guard(props.code)
    const py = await getPyodide()
    let out = ''
    py.setStdout({ batched: (s) => { out += s + '\n' } })
    py.setStderr({ batched: (s) => { out += s + '\n' } })
    // 只允许 numpy（轻量），matplotlib 太重不默认加载
    if (/\bimport\s+numpy\b|from\s+numpy\b/.test(props.code)) {
      await py.loadPackage('numpy')
      status.value = '已加载 numpy…'
    }
    // 25 秒超时熔断（防死循环）
    await Promise.race([
      py.runPythonAsync(props.code),
      new Promise((_, rej) => setTimeout(() => rej(new Error('超时中断（25秒）：可能存在死循环')), 25000))
    ])
    output.value = out.trim().slice(0, 20000)
    status.value = '完成 ✓'
    statusType.value = 'ok'
    ran.value = true
  } catch (e) {
    error.value = String(e).split('\n').slice(-8).join('\n')
    status.value = '出错'
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
