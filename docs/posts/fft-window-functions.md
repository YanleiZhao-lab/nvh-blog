---
title: "FFT窗函数选择"
---

# FFT窗函数选择

> 快速傅里叶变换（FFT）是 NVH 频域分析的基石，但有限长采样会引入频谱泄漏。选择合适的窗函数能有效抑制泄漏，提升频谱分析精度。本文给出常用窗函数的对比和选择建议。

## 一、为什么需要窗函数

理想 FFT 假设信号是无限长周期信号。实际采集一段信号时，若首尾不连续（非整周期截断），会在频域产生**泄漏**——能量从真实频率分散到相邻频率。

::: info 核心概念
- **主瓣宽度**：影响频率分辨力
- **旁瓣衰减**：影响强信号旁是否能看到弱信号
- **泄漏**：主瓣能量分散到旁瓣的现象
:::

## 二、常用窗函数对比

| 窗函数 | 主瓣宽度（bins） | 最高旁瓣 | 适用场景 |
| --- | --- | --- | --- |
| **矩形窗 (Rectangular)** | 2 | -13 dB | 整周期截断 / 瞬态信号 |
| **汉宁窗 (Hann)** | 4 | -32 dB | 通用频谱分析（最常用） |
| **海明窗 (Hamming)** | 4 | -43 dB | 近距离强信号分离 |
| **平顶窗 (Flat Top)** | 8 | -44 dB | 幅值精度要求高 |
| **布莱克曼窗 (Blackman)** | 6 | -58 dB | 动态范围极大 |
| **凯泽窗 (Kaiser)** | 可调 | 可调 | 灵活权衡 |

::: tip 选择原则
- **不知道用什么 → 选 Hann 窗**，它是 NVH 通用分析的最佳默认
- 需要精确幅值 → 平顶窗
- 需要极高动态范围 → Blackman 窗
- 信号已整周期截断 → 矩形窗
:::

## 三、Python 示例对比

```python
import numpy as np
from scipy import signal
from scipy.fft import fft, fftfreq

fs = 8192          # 采样率
T = 1.0            # 采样时长
N = int(fs * T)
t = np.linspace(0, T, N, endpoint=False)

# 构造信号: 两个频率 + 一个强信号旁的弱信号
f1, f2, f3 = 50, 80, 80.5
x = 10 * np.sin(2*np.pi*f1*t) \
    + 1.0 * np.sin(2*np.pi*f2*t) \
    + 0.01 * np.sin(2*np.pi*f3*t)  # 弱信号

def apply_window(x, window_name):
    """应用窗函数并计算单边幅度谱"""
    if window_name == 'rect':
        win = np.ones(N)
    else:
        win = signal.get_window(window_name, N)

    xw = x * win
    X = fft(xw)
    freqs = fftfreq(N, 1/fs)

    # 单边幅度谱，补偿窗函数能量损失
    mag = 2.0 / N * np.abs(X[:N//2])
    scale = N / np.sum(win)        # 幅值修正
    return freqs[:N//2], mag * scale

freqs, spec_hann   = apply_window(x, 'hann')
freqs, spec_rect   = apply_window(x, 'rect')
freqs, spec_flat   = apply_window(x, 'flattop')
```

::: warning 幅值修正
窗函数会衰减信号能量，计算幅值时需要乘以补偿系数 `N / sum(window)`，否则幅值会偏小。
:::

## 四、不同窗函数的频谱表现

```python
# 可视化对比
import matplotlib.pyplot as plt

fig, axes = plt.subplots(3, 1, figsize=(10, 8), sharex=True)
for ax, (name, spec) in zip(axes, [
    ('Rectangular', spec_rect),
    ('Hann',       spec_hann),
    ('Flat Top',   spec_flat),
]):
    ax.semilogy(freqs, spec)
    ax.set_xlim(40, 100)
    ax.set_ylim(1e-5, 20)
    ax.set_title(name)
    ax.grid(True, which='both', alpha=0.3)
ax.set_xlabel('Frequency (Hz)')
plt.tight_layout()
plt.savefig('window_comparison.png', dpi=150)
```

## 五、工程选择决策表

::: tip 快速决策
| 你的需求 | 推荐窗函数 |
| --- | --- |
| 通用 NVH 频谱分析 | **Hann** |
| 精确测量正弦幅值 | **Flat Top** |
| 阶次分析（转频跟踪） | Hann（配合重采样） |
| 模态分析（FRF） | **Hann** 或 **Hanning** |
| 冲击/瞬态信号 | 矩形或指数窗 |
| 高动态范围（小信号检测） | **Blackman-Harris** |
:::

## 六、窗函数幅值修正系数

```text
窗函数      理论幅值修正系数 (CG)
─────────────────────────────────
矩形        1.000
Hann        2.000
Hamming     1.852
Flat Top    4.180
Blackman    2.381
```

::: info 计算公式
幅值修正系数 CG = N / sum(window)，其中 N 为采样点数。该系数确保加窗后的频谱幅值还原为信号真实幅值。
:::

## 七、注意事项

::: warning 频率分辨率与窗函数
- 窗函数的主瓣宽度会**降低**有效频率分辨率
- Hann 窗下，可分辨的两个等幅频率间隔约为 `4 × Δf`（Δf = 1/T）
- 若需要分辨相近频率，优先增大采样时长 T，而非换窗
:::

::: danger 常见错误
不要在阶次分析中直接使用平顶窗。平顶窗主瓣极宽，会导致相邻阶次能量叠加，阶次峰值判读错误。
:::

## 八、参考

- **IEEE Std 1658** — 频谱分析窗函数
- **Heinzel et al. (2002)** — Spectrum and spectral density estimation by the DFT
- **Brüel & Kjær Technical Review** — Window functions in FFT analyzers
