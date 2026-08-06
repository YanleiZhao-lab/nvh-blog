import type { NavData } from './types'

export const NAV_DATA: NavData[] = [
  {
    title: 'NVH 工具',
    items: [
      {
        title: 'NVH 百宝箱',
        desc: 'NVH 工程研究与知识社区主站',
        link: 'https://nvhtest.cn',
        icon: '🔊',
      },
      {
        title: 'NVH Test 博客',
        desc: 'NVH 工程技术博客',
        link: 'https://nvhtest.cn/blog/',
        icon: '📖',
      },
      {
        title: 'GitHub 源码',
        desc: '博客源码与文档',
        link: 'https://github.com/YanleiZhao-lab/nvh-blog',
        icon: '🐙',
      },
    ],
  },
  {
    title: 'AI 导航',
    items: [
      {
        title: 'ChatGPT',
        desc: 'OpenAI 旗舰对话模型',
        link: 'https://chat.openai.com',
        icon: '🤖',
      },
      {
        title: 'Claude',
        desc: 'Anthropic 智能助手',
        link: 'https://claude.ai',
        icon: '🧠',
      },
      {
        title: 'GitHub Copilot',
        desc: 'AI 编程助手',
        link: 'https://github.com/features/copilot',
        icon: '✈️',
      },
      {
        title: '通义千问',
        desc: '阿里云大语言模型',
        link: 'https://qianwen.aliyun.com',
        icon: '🌐',
      },
      {
        title: '文心一言',
        desc: '百度大语言模型',
        link: 'https://yiyan.baidu.com',
        icon: '💬',
      },
    ],
  },
  {
    title: 'NVH 百宝箱站点',
    items: [
      {
        title: 'NVH 百宝箱',
        desc: 'NVH 工程研究与知识社区',
        link: 'https://nvhtest.cn',
        icon: '🎒',
        badge: { text: '主站', type: 'tip' },
      },
      {
        title: 'NVH Test 博客',
        desc: '基于 VitePress 的技术博客',
        link: 'https://nvhtest.cn/blog/',
        icon: '📝',
      },
    ],
  },
  {
    title: '测试仪器',
    items: [
      {
        title: 'HEAD Acoustics',
        desc: '德国 HEAD acoustics 声学与 NVH 测试解决方案',
        link: 'https://www.head-acoustics.com',
        icon: '🎯',
      },
      {
        title: 'Brüel & Kjær (HBK)',
        desc: '丹麦 B&K 声学与振动测量仪器',
        link: 'https://www.bksv.com',
        icon: '📊',
      },
      {
        title: 'Siemens Simcenter',
        desc: 'Siemens Simcenter 测试与仿真一体化平台',
        link: 'https://plm.sw.siemens.com/en-US/simcenter/',
        icon: '⚙️',
      },
      {
        title: 'NI (National Instruments)',
        desc: '美国 NI 数据采集与测试系统',
        link: 'https://www.ni.com',
        icon: '🔬',
      },
      {
        title: 'PCB Piezotronics',
        desc: 'PCB 传感器与加速度计',
        link: 'https://www.pcb.com',
        icon: '📡',
      },
      {
        title: 'GRAS Sound & Vibration',
        desc: '丹麦 GRAS 测量麦克风',
        link: 'https://www.gras.dk',
        icon: '🎙️',
      },
    ],
  },
  {
    title: '信号处理',
    items: [
      {
        title: 'MATLAB',
        desc: '科学计算与信号处理工具',
        link: 'https://www.mathworks.com/products/matlab.html',
        icon: '📐',
      },
      {
        title: 'Python SciPy',
        desc: 'Python 科学计算与信号处理库',
        link: 'https://scipy.org',
        icon: '🐍',
      },
      {
        title: 'NumPy',
        desc: 'Python 数值计算核心库',
        link: 'https://numpy.org',
        icon: '🔢',
      },
      {
        title: 'Librosa',
        desc: 'Python 音频与音乐分析库',
        link: 'https://librosa.org',
        icon: '🎵',
      },
      {
        title: 'Audacity',
        desc: '开源音频编辑与分析软件',
        link: 'https://www.audacityteam.org',
        icon: '🎧',
      },
    ],
  },
  {
    title: '社区资源',
    items: [
      {
        title: 'GitHub',
        desc: '全球最大开源代码托管平台',
        link: 'https://github.com',
        icon: '🐙',
      },
      {
        title: 'Stack Overflow',
        desc: '程序员问答社区',
        link: 'https://stackoverflow.com',
        icon: '📚',
      },
      {
        title: '知乎',
        desc: '中文知识分享社区',
        link: 'https://www.zhihu.com',
        icon: '💡',
      },
      {
        title: 'VitePress 官网',
        desc: 'VitePress 文档站点生成器',
        link: 'https://vitepress.dev',
        icon: '⚡',
      },
      {
        title: 'Vue.js',
        desc: '渐进式 JavaScript 框架',
        link: 'https://vuejs.org',
        icon: '💚',
      },
      {
        title: 'MDN Web Docs',
        desc: 'Web 开发者文档',
        link: 'https://developer.mozilla.org',
        icon: '📘',
      },
    ],
  },
]
