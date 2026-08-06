---
title: "NVH 信号处理中的 FFT 窗函数选择"
description: "从频谱泄漏的物理直觉出发，对比 Rectangular、Hanning、Hamming、Blackman-Harris 四种常用窗函数在 NVH 场景下的取舍。"
date: 2026-08-06
category: "测试方法"
tags: ["FFT", "信号处理", "窗函数", "频谱分析"]
status: "可发布"
author: "NVH Z"
discussionUrl: "/forum/"
---

## 为什么需要窗函数？

当你在做 FFT 分析时，本质上是在假设信号是**周期性的**——即你截取的这段信号恰好包含整数个周期。但现实是，你采集的数据块几乎不可能恰好对齐。

如果截断处不连续，FFT 会把那个突变解读为无限多的频率分量——这就是**频谱泄漏（Spectral Leakage）**。

> 窗函数的作用就是：把截断处的突变"柔化"，用渐进衰减代替硬截断，从而控制泄漏。

代价是：你换来更少的泄漏，但牺牲了频率分辨率。没有免费的午餐。

## 四种常用窗函数对比

### Rectangular（矩形窗）

等于不加窗。频率分辨率最高，但泄漏也最大。

- **适用场景**：瞬态信号、冲击响应、需要精确定位频率峰值的窄带分析
- **主瓣宽度**：最窄（1 bin）
- **旁瓣衰减**：-13 dB（很差）

### Hanning（汉宁窗）

最常用的通用窗函数。

```python
import numpy as np

def hanning_window(N):
    """标准汉宁窗"""
    return 0.5 - 0.5 * np.cos(2 * np.pi * np.arange(N) / (N - 1))

# 应用窗函数
signal_windowed = signal * hanning_window(len(signal))
spectrum = np.fft.rfft(signal_windowed)
```

- **适用场景**：通用频谱分析、随机信号、振动测试
- **主瓣宽度**：2 bins
- **旁瓣衰减**：-31 dB

### Hamming（汉明窗）

和 Hanning 类似，但旁瓣稍低，代价是泄漏更多。

| 窗函数 | 主瓣宽度 | 最高旁瓣 | 适合场景 |
|--------|---------|---------|---------|
| Rectangular | 1 bin | -13 dB | 瞬态/冲击 |
| Hanning | 2 bins | -31 dB | 通用频谱 |
| Hamming | 2 bins | -42 dB | 语音/音频 |
| Blackman-Harris | 4 bins | -92 dB | 微弱信号检测 |

### Blackman-Harris

旁瓣极低，适合需要从强信号旁边"挖出"弱信号的场景。

## NVH 工程实践建议

### 发动机阶次分析

发动机转速变化频繁，阶次分量是窄带的。推荐用 **Hanning**——在分辨率和泄漏控制之间取得平衡。

### 异响排查（BSR）

异响往往是瞬态事件。用 **Rectangular** 保留时域瞬态特征，或者直接做时频分析（STFT / 小波）。

### 模态分析

模态参数识别依赖准确的峰值。推荐 **Hanning**，并在峰值附近做曲线拟合补偿。

## 代码示例：对比不同窗函数的频谱

```python
import numpy as np
import matplotlib.pyplot as plt

# 构造测试信号：两个频率分量，一个强一个弱
fs = 8192
t = np.arange(4096) / fs
signal = 1.0 * np.sin(2 * np.pi * 100 * t) + 0.01 * np.sin(2 * np.pi * 150 * t)

windows = {
    "Rectangular": np.ones(len(signal)),
    "Hanning": np.hanning(len(signal)),
    "Blackman-Harris": np.blackman(len(signal)),
}

fig, axes = plt.subplots(1, 3, figsize=(15, 4))
for ax, (name, win) in zip(axes, windows.items()):
    spec = np.abs(np.fft.rfft(signal * win)) / np.sum(win)
    freq = np.fft.rfftfreq(len(signal), 1/fs)
    ax.semilogy(freq, spec)
    ax.set_xlim(80, 170)
    ax.set_title(name)
    ax.set_xlabel("Frequency [Hz]")

plt.tight_layout()
plt.savefig("window_comparison.png", dpi=150)
```

## 总结

| 选择标准 | 推荐 |
|---------|------|
| 不知道选什么 | Hanning |
| 瞬态信号 | Rectangular |
| 需要极限旁瓣抑制 | Blackman-Harris |
| 需要精确幅度 | 用校正因子补偿 |

记住：**选窗函数的本质是在频率分辨率和动态范围之间做权衡**。没有"最好"的窗，只有"最适合"当前任务的窗。
