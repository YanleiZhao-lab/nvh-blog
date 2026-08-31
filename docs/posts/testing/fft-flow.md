---
title: "FFT 基础流程：从采样率到谱线解释"
---

# FFT 基础流程：从采样率到谱线解释

> FFT 是 NVH 频域分析的基础工具，但从采集到得到一条可解释的频谱，中间有多个参数会直接影响结果。本文按信号链顺序梳理采样率、抗混叠滤波、加窗、平均、频率分辨率和谱线判读，给出参数选择依据和常见误区。

## 一、信号链总览

```text
物理信号 → 传感器 → 抗混叠滤波器 → ADC 采样 → 加窗 → FFT → 平均 → 频谱
            ↑                       ↑              ↑          ↑
         选型/灵敏度            采样率 fs       窗类型      平均方式
```

每个环节的选择都会影响最终频谱的频率范围、分辨率、幅值精度和噪声水平。按 Simcenter Testing 知识库的术语体系，涉及的时域参数为：采样率（Sampling Rate, $f_s$，单位 Hz）、帧长（Frame Size, $T$，单位 s）、数据块大小（Block Size, $N$，无量纲）；频域参数为：带宽（Bandwidth, $F_{\max}=f_s/2$，单位 Hz）、谱线数（Spectral Lines, $SL$）与频率分辨率（Frequency Resolution, $\Delta f$，单位 Hz）。

## 二、采样率与奈奎斯特

### 2.1 奈奎斯特定理

从定义出发：对连续信号 $x(t)$ 以间隔 $\Delta t = 1/f_s$ 采样，得到离散序列 $x[n] = x(n/f_s)$。对一个正弦分量

$$x(t) = A\sin(2\pi f t + \varphi)$$

采样后的序列为

$$x[n] = A\sin\!\left(2\pi \frac{f}{f_s}\, n + \varphi\right)$$

这一步的物理意义：采样后原频率 $f$ 只以比值 $f/f_s$（数字频率）的形式保留在序列中。

若另一个频率为 $f' = f + k f_s$（$k$ 为任意整数），代入上式：

$$\sin\!\left(2\pi \frac{f + k f_s}{f_s}\, n + \varphi\right) = \sin\!\left(2\pi \frac{f}{f_s}\, n + \varphi + 2\pi k n\right) = x[n]$$

物理意义：相差整数倍采样率的两个频率产生**完全相同**的样本序列，采样之后在数学上无法区分。这就是混叠（Aliasing）的根源。

因此，要在离散序列中唯一区分 $0 \sim f_{\max}$ 范围内的所有频率，采样率必须满足奈奎斯特（Nyquist）判据：

$$f_s \ge 2 f_{\max}$$

工程中不取 $f_s = 2 f_{\max}$，而是留出抗混叠滤波器的过渡带余量（见第三节）。对落在带宽 $f_s/2$ 与 $f_s$ 之间的频率成分，观测到的混叠频率为

$$f_{\text{alias}} = f_s - f$$

即成分以带宽频率为轴**镜像折叠**：超出带宽 X Hz 的成分出现在带宽以下 X Hz 处。

![超过带宽的频率成分以带宽频率为轴镜像折叠：带宽 1000 Hz，实际 1300 Hz 的成分折叠到 700 Hz](/images/fft-flow/fig-alias-mirroring.png)

*（图源：Simcenter Testing Knowledge Base）*

::: warning 抗混叠
高于 $f_s/2$ 的频率成分会折叠回基带产生混叠，混叠后的信号无法用软件去除。必须在 ADC 之前用模拟抗混叠滤波器（低通）把高频成分压下去。
:::

### 2.2 实际采样率选择

Simcenter 手册给出的工程取值依据：频域分析时，采样率至少为最高关心频率的 **2.5 倍**（考虑抗混叠滤波器后），即分析上限落在可信范围 Span = 80% 带宽处；若要在时域正确判读波形与峰值幅值，采样率应不低于最高关心频率的 **10 倍**。按 2.56 倍取整的常用配置如下：

| 关注频段 (Hz) | 推荐 fs (Hz) | 带宽 fs/2 (Hz) | 可信范围 Span = 0.8×带宽 (Hz) |
| --- | --- | --- | --- |
| 0–200 | 512 | 256 | 204.8 |
| 0–2000 | 5120 | 2560 | 2048 |
| 0–8000 | 20480 | 10240 | 8192 |
| 0–20000 | 51200 | 25600 | 20480 |

::: tip 取值依据
频域频谱分析取分析上限的 2.56 倍（等价于把分析上限放在 Span 处，给抗混叠滤波器留过渡带）；时域波形与峰值判读取 10 倍以上，以保证峰值幅值不失真。
:::

## 三、抗混叠滤波器

抗混叠滤波器（Anti-Aliasing Filter, AAF）是模拟低通滤波器，放在 ADC 之前。理想滤波器是"砖墙"式的，实际不可实现；Simcenter 采集系统的做法是在带宽处 -3 dB 滚降，在带宽以上 20% 处衰减到零。因此从 80% 带宽开始幅值已被滤波器压低，**该区间数据不可信**。无混叠的可信分析范围定义为

$$\text{Span} = 0.8 \times \frac{f_s}{2} = 0.4 f_s$$

```python
# 概念示意：理解为什么需要留余量
fs = 8192                  # 采样率 (Hz)
f_nyquist = fs / 2         # 4096 Hz —— 带宽（奈奎斯特频率）
span = 0.8 * f_nyquist     # 3276.8 Hz —— 可信分析范围
f_analysis = 3200          # 想分析的频率上限，必须 <= span
print(f"分析上限 / Span = {f_analysis / span:.2f}")
# 若分析上限进入 0.8~1.0 带宽区间，滤波器衰减不足，会残留混叠
```

::: warning 数字滤波器不能替代模拟 AAF
一旦信号被采样，混叠就已经发生了。后端的数字低通滤波器无法恢复被混叠的信号。抗混叠必须在 ADC 之前完成。
:::

## 四、频率分辨率

从 DFT 定义出发推导。帧长 $T$ 内以采样率 $f_s$ 采集 $N = f_s T$ 个样本，DFT 只在离散频率

$$f_k = \frac{k}{T} = k \frac{f_s}{N}, \quad k = 0, 1, 2, \dots$$

上取值。相邻两个取值点的间距即频率分辨率：

$$\Delta f = \frac{f_s}{N} = \frac{1}{T}$$

物理意义：频谱上相邻谱线的间距只由**单帧采样时长**决定——这就是 Simcenter 手册所称数字信号处理的"黄金方程"。要分辨更近的两个频率，必须增加采样时长；帧长越短，分辨率越粗。

对实信号，FFT 结果共轭对称，有效谱线数为数据块大小的一半：

$$SL = \frac{N}{2}, \qquad \Delta f = \frac{F_{\max}}{SL}$$

注意 0 Hz 谱线对应直流（DC）偏置，不计入谱线数 $SL$。

![数字信号处理参数关系：帧长 T 与频率分辨率 Δf 的"黄金方程"](/images/fft-flow/fig-golden-equation.png)

*（图源：Simcenter Testing Knowledge Base）*

| 目标 Δf (Hz) | 所需 T (s) | 在 fs=8192 时 N |
| --- | --- | --- |
| 1 | 1.0 | 8192 |
| 0.5 | 2.0 | 16384 |
| 0.25 | 4.0 | 32768 |

频率分辨率决定能否分开相邻的两个成分。对 100 Hz 与 101 Hz 两个等幅正弦，Δf=1 Hz 时两峰合并为一个，Δf=0.5 Hz 时才能分开：

![100 Hz 与 101 Hz 两正弦：Δf=1 Hz 时合并为一个峰（左），Δf=0.5 Hz 时分为两个独立峰（右）](/images/fft-flow/fig-resolution-two-tones.png)

*（图源：Simcenter Testing Knowledge Base）*

::: tip 分辨率 vs 窗函数
有效分辨率还受窗函数主瓣宽度影响。Hann 窗主瓣宽约 4 条谱线（±2Δf），两个等幅频率要分开，间隔需与主瓣宽度同量级。若 Δf=1 Hz，Hann 窗下实际可分辨间隔约 4 Hz。
:::

## 五、窗函数

非整周期截断会产生泄漏（Leakage），能量从真实频率泄漏到整个分析带宽，必须加窗。窗函数的详细选择依据见[FFT 窗函数选择](./fft-window-functions.html)一文。

```python
import numpy as np
from scipy import signal
from scipy.fft import fft, fftfreq

fs = 8192
T_frame = 0.5
N = int(fs * T_frame)
t = np.linspace(0, T_frame, N, endpoint=False)
x = 3 * np.sin(2 * np.pi * 120 * t) + 0.5 * np.random.randn(N)

# 加 Hann 窗后做 FFT
win = signal.get_window('hann', N)
X = fft(x * win)
freqs = fftfreq(N, 1 / fs)[:N // 2]
mag = (2.0 / np.sum(win)) * np.abs(X[:N // 2])
```

加窗在抑制泄漏的同时也压低了幅值：单频成分的谱峰按窗函数的均值 $\frac{1}{N}\sum_n w[n]$ 缩放。为还原真实幅值，需乘幅值修正系数（Amplitude Correction Factor）：

$$C_A = \frac{N}{\sum_{n=0}^{N-1} w[n]}$$

物理意义：把窗对信号的平均衰减"除回去"。Hann 窗 $\sum_n w[n] = N/2$，故 $C_A = 2.00$（能量修正系数为 1.63）；Flat Top 窗 $C_A \approx 4.18$。

::: warning 幅值修正不可省
加窗后必须乘修正系数，否则幅值偏小。注意幅值修正与能量修正是两个不同的系数、不能同时成立：Hann 窗乘 2.00 后峰值还原，但谱下面积（能量）偏高；要还原能量需改乘 1.63。
:::

## 六、平均方法

实测信号含噪声，单帧频谱统计波动大，需要多帧平均。Simcenter Testlab 稳态测量提供五种平均类型。设某条谱线上 $M$ 帧的幅值依次为 $A_1, A_2, \dots, A_M$（以 3g、5g、10g 三帧为例）：

| 平均方式 | 计算方法 | 结果示例 | 特点与适用 |
| --- | --- | --- | --- |
| **能量平均（Energy Average）** | 平方均值开方 | 6.68 g | 稳态测量默认，又称 RMS 平均；大幅值权重大，声学常用 |
| **线性平均（Linear Average）** | 算术平均 | 6 g | 等权；若数据含相位则相位参与平均 |
| **能量指数平均（Energy Exponential）** | 后采数据权重更高 | 7 g（EWF=50%） | 缓变工况，权重因子 EWF 取 0–100% |
| **最大值（Maximum Value）** | 逐谱线取最大 | 10 g | 峰值保持，评估最坏工况 |
| **最小值（Minimum Value）** | 逐谱线取最小 | 3 g | 背景水平估计 |

能量平均对平方值求均值再开方：

$$\bar{A} = \sqrt{\frac{1}{M}\sum_{i=1}^{M} A_i^2} = \sqrt{\frac{3^2 + 5^2 + 10^2}{3}} = \sqrt{\frac{134}{3}} \approx 6.68\ \text{g}$$

物理意义：能量在平均过程中守恒（先求功率均值再开方），因此高幅值帧对结果影响更大。平方过程丢掉了相位，故能量平均不保留相位信息；多传声器声功率平均即采用能量平均。

线性平均对幅值直接做算术平均：

$$\bar{A} = \frac{1}{M}\sum_{i=1}^{M} A_i = \frac{3 + 5 + 10}{3} = 6\ \text{g}$$

物理意义：每帧等权。若测量类型为 Spectrum 或 Time（含相位），线性平均会把相位一并平均；相位信息重要时应使用 Spectrum + 线性平均。

能量指数平均通过权重因子（Exponential Weighting Factor, EWF，0–100%）给**后采**的数据更高权重：EWF=100% 退化为第一帧，EWF=0% 退化为最近一帧。与前两种不同，指数平均的结果与数据出现的**顺序**有关。

```python
# 线性功率谱平均示意（对应能量平均：先平均功率，显示时开方）
n_frames = 16
psd_acc = np.zeros(N // 2)
for i in range(n_frames):
    frame = acquire_one_frame()               # 获取一帧
    win = signal.get_window('hann', N)
    X = fft(frame * win)
    psd_acc += np.abs(X[:N // 2]) ** 2
psd_avg = psd_acc / n_frames                  # 平均功率谱
```

::: warning 平均方式不匹配信号类型
- **稳态信号**用能量/线性平均——帧越多结果越稳定。
- **缓变信号**（如发动机暖机）用能量指数平均——否则早期数据会"污染"当前谱。
- **瞬态信号**不能用功率平均——会抹掉能量，应单帧（无平均）或峰值保持。
:::

## 七、重叠处理

加窗后帧两端信号被衰减，若帧间不重叠会丢信息。常用 **50% 重叠**（Hann 窗），既补偿能量损失又不过度增加计算量。

```text
无重叠:  |---帧1---|---帧2---|---帧3---|   ← 窗两端信号弱
50%重叠: |---帧1---|
              |---帧2---|                    ← 弱区被下一帧中心覆盖
                   |---帧3---|
```

| 窗类型 | 建议重叠率 |
| --- | --- |
| 矩形 | 0%（整周期时） |
| Hann | 50%（常用）或 66.7% |
| Flat Top | 66.7%–75% |

## 八、谱线解释

FFT 的每条谱线上有两个量：幅值与相位；谱线数等于数据块大小的一半。计算谱线数时注意 0 Hz 是直流偏置项，不计入。

![每条谱线含幅值（上）与相位（下）两个量；谱线数 = 数据块大小的一半](/images/fft-flow/fig-spectral-lines.png)

*（图源：Simcenter Testing Knowledge Base）*

得到频谱后，按特征归类判读：

- **离散峰值** → 多为周期性来源（转速阶次、电源频率、齿轮啮合）
- **宽带隆起** → 流体噪声、摩擦、随机振动
- **低频隆起（<100 Hz）** → 结构共振 / 轰鸣
- **50/100 Hz 尖峰** → 工频干扰（检查接地和屏蔽）
- **随转速移动的峰** → 阶次成分，需做阶次分析

::: tip 判读三问
拿到一条谱，先问三个问题：
1. 这个峰的频率对应的**物理来源**是什么？
2. 这个峰的幅值是否**超过目标值/背景**？
3. 这个峰是**稳态**还是**瞬态**？（决定是否需要时频分析）
:::

## 九、参数速查

::: warning 参数联动
采样率、采样时长、窗函数、平均次数是**联动**的，不能孤立设置。典型配置示例（按 Span=0.8×带宽 标注可信分析范围）：
- 通用声学频谱：fs=8192, T=1 s, Hann, 能量平均 32 帧 → Δf=1 Hz，Span≈3277 Hz
- 阶次分析：fs=随转速重采样, Hann, 50% 重叠
- 模态 FRF：fs=2048, T=4 s, Hann → Δf=0.25 Hz，Span≈819 Hz
:::

## 十、参考

- **Oppenheim & Schafer** — Discrete-Time Signal Processing
- **Bendat & Piersol** — Random Data: Analysis and Measurement Procedures
- **Brüel & Kjær** — Primer on FFT analysis
- **Siemens Simcenter Testing Knowledge Base** — Digital Signal Processing 基础系列
