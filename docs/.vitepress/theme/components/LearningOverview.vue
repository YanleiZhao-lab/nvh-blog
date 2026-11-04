<script setup lang="ts">
import { withBase } from 'vitepress'

const articles = [
  {
    step: '01', topic: 'dB 基础',
    title: '同一台电机为什么测出 62、68、55 三个都对的分贝值？',
    href: '/posts/theory/acoustics-basics/decibel-basics.html',
    summary: '分贝是对数比值；先弄清参考值、声压与声功率的能量域加减。'
  },
  {
    step: '02', topic: 'FFT 全流程',
    title: '同一台电机，两份频谱为什么连峰都对不上？',
    href: '/posts/testing/fft-flow.html',
    summary: '从采样率、带宽到谱线判读；只差 1 Hz 的两个峰，至少要采满 1 秒。'
  },
  {
    step: '03', topic: '窗函数',
    title: '换个窗读数就差 1 dB，两个峰还测成一个？',
    href: '/posts/testing/fft-window-functions.html',
    summary: '看懂频谱泄漏，以及汉宁窗、平顶窗分别适合什么测量任务。'
  },
  {
    step: '04', topic: '窗修正',
    title: '同一条谱线，乘 2.00 还是乘 1.633？',
    href: '/posts/theory/signal-processing/window-correction-factors.html',
    summary: '幅值校正与能量校正不能混用；用错一档，RMS 可偏差 22.5%。'
  },
  {
    step: '05', topic: '功率谱密度',
    title: '同一份路噪数据，换台分析仪怎么就差出 8 倍？',
    href: '/posts/theory/signal-processing/psd-explained.html',
    summary: '随机信号为什么要除以带宽，以及不同分析带宽下怎样公平比较。'
  },
  {
    step: '06', topic: '总级合成',
    title: '时域频域各算一遍，RMS 为什么差出 3 dB？',
    href: '/posts/theory/signal-processing/rms-overall-level.html',
    summary: '谱线平方和开根号得到总级，并排查时域频域对不上的三个条件。'
  },
  {
    step: '07', topic: 'FRF 估计',
    title: '同一组锤击数据，FRF 反共振谷为什么差出 5 倍？',
    href: '/posts/theory/modal-analysis/frf-estimators.html',
    summary: 'H1、H2、Hv 的噪声假设不同，决定反共振谷究竟该信谁。'
  },
  {
    step: '08', topic: '锤击模态',
    title: '同一把锤同一台车身，两套 FRF 为什么一套干净一套报废？',
    href: '/posts/testing/impact-testing-guide.html',
    summary: '从选锤、触发、力窗到相干检查，建立一套可复现的锤击测试流程。'
  },
  {
    step: '09', topic: '模态拟合',
    title: '圆拟合法凭什么多出一位有效数字？',
    href: '/posts/theory/modal-analysis/modal-circle-fit.html',
    summary: '把共振区搬到复平面，用整段圆弧共同估计频率与阻尼。'
  },
  {
    step: '10', topic: 'A 计权',
    title: 'dBA 更低却更吵？',
    href: '/posts/theory/acoustics-basics/a-weighting.html',
    summary: '理解 A 计权给低频打了多少折，以及读数与主观感受为何会冲突。'
  },
  {
    step: '11', topic: '倍频程',
    title: '同一份白噪声，窄带谱平线、倍频程柱子为什么爬楼梯？',
    href: '/posts/theory/acoustics-basics/octaves-hearing.html',
    summary: '听觉按倍数分带；白噪声的倍频程柱子每升一带约增加 3 dB。'
  },
  {
    step: '12', topic: '阶次分析',
    title: '转速一直在变，怎么给每座谱峰挂上部件名牌？',
    href: '/posts/theory/rotating-machinery/whats-an-order.html',
    summary: '把频率轴换成每转事件数，让随转速移动的激励保持固定身份。'
  }
]
</script>

<template>
  <div class="learning-overview" aria-label="NVH 入门推荐文章">
    <a
      v-for="article in articles"
      :key="article.step"
      class="learning-overview__card"
      :href="withBase(article.href)"
    >
      <div class="learning-overview__meta">
        <span class="learning-overview__step">{{ article.step }}</span>
        <span class="learning-overview__topic">{{ article.topic }}</span>
      </div>
      <strong class="learning-overview__title">{{ article.title }}</strong>
      <span class="learning-overview__summary">{{ article.summary }}</span>
      <span class="learning-overview__action">开始阅读 <span aria-hidden="true">→</span></span>
    </a>
  </div>
</template>
