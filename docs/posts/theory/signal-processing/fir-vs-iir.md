---
title: "FIR 与 IIR 滤波器：相位线性与实现代价"
---

# FIR 与 IIR 滤波器：相位线性与实现代价

> 数字滤波器分两类：FIR（Finite Impulse Response，有限脉冲响应）的输出只由输入决定，IIR（Infinite Impulse Response，无限脉冲响应）引入输出反馈（递归）。同样截止 150 Hz 的低通，4 阶 IIR 可达到 15 系数 FIR 的滚降水平，每样本乘加从 15 次降到 10 次；代价是相位非线性、时延随频率变化，系数设计或量化不当时还可能不稳定。选型取决于三个条件：是否实时处理、是否需要保持相位关系、能否接受稳定性风险。

## 一、滤波器在干什么

滤噪声、去漂移、A 计权（A-weighting）、抗混叠（anti-aliasing）——NVH 测试中滤波应用广泛，但都在做同一件事：改变时域信号的频率成分。以低通为例：通带内的频率原样通过，阻带内的成分被衰减，中间是过渡带。幅度调整量既可用线性倍数表示，也可换算为分贝：

$$A_{\mathrm{dB}} = 20\,\lg\frac{A}{A_0}$$

其中 $A$ 为输出幅值、$A_0$ 为输入幅值（比值，无量纲）。线性减半对应 $20\lg(1/2) \approx -6\ \mathrm{dB}$，原样通过为 $0\ \mathrm{dB}$——对数刻度使通带（接近 0 dB）与阻带（几十 dB）的衰减能在同一张图上读出。

Simcenter 手册用龟兔赛跑作比：FIR 如乌龟——慢而稳，必定跑完全程（任何系数下都稳定）；IIR 如野兔——速度快，但有时中途倒下（可能不稳定）。两类滤波器的全部差异，源自一个数学区别。

### 从差分方程看本质区别

FIR 的输出只由输入的加权和决定：

$$y(n) = \sum_{k=0}^{N-1} h(k)\, x(n-k)$$

其中 $x(n)$ 为输入序列，$y(n)$ 为输出序列，$h(k)$ 为滤波器系数（手册记作 a(k) 系列），$N$ 为系数个数。当前输出只用到输入的当前值与历史值——脉冲激励注入后，响应在 $N$ 个样本后完全归零，脉冲响应有限长，这正是 FIR 名称的来历。

IIR 把输出也反馈回来：

$$y(n) = \sum_{k=0}^{N} a(k)\, x(n-k) + \sum_{k=1}^{P} b(k)\, y(n-k)$$

前一项与 FIR 相同，第二项是历史输出的加权和——递归（recursive）结构。系数个数称为滤波器的阶数，也叫抽头数（taps）。递归使 IIR 用更少的系数实现更陡的滚降（roll off），但也带来两个代价：相位非线性，以及反馈可能发散。

::: info 核心概念
- **FIR（有限脉冲响应）**：输出只依赖输入，脉冲响应有限长，任何系数下都稳定
- **IIR（无限脉冲响应）**：输出反馈回输入（递归），脉冲响应无限长，可能不稳定
- **阶数 / 抽头数**：滤波器系数个数，直接决定计算量和滚降陡度
- **滚降（roll off）**：通带边沿到阻带的下降速度，越陡过渡带越窄
:::

## 二、效率对比：IIR 用低阶实现 FIR 的高阶滚降

同一阶数下 IIR 滚降更陡——递归项相当于用少量系数实现无限长的脉冲响应。反过来说，达到同样的滚降，IIR 所需阶数远低于 FIR。

![IIR 用更低阶数实现与 FIR 相当的性能](/images/fir-vs-iir/iir-lower-order.png)
*（图源：Simcenter Testing Knowledge Base）*

手册的总结对比图：

![FIR 与 IIR 滤波器特性对比](/images/fir-vs-iir/fir-iir-summary.png)
*（图源：Simcenter Testing Knowledge Base）*

把两类滤波器放在同一指标下对比（同样截止 150 Hz 的低通、滚降相当）：

| 维度 | **FIR（15 系数）** | **IIR（4 阶 Butterworth）** |
| --- | --- | --- |
| 每样本乘加次数 | 15 次 | 10 次（两个双二阶节，每节 5 次） |
| 衰减 @200 Hz | -14.8 dB | -14.2 dB |
| 衰减 @300 Hz | -44.7 dB | -34.7 dB |
| 通带相位 | 严格线性 | 非线性，截止频率附近最严重 |
| 时延 | 恒定 (N-1)/2 样本 | 随频率变化 |
| 稳定性 | 永远稳定 | 可能不稳定 |
| 典型用途 | 事后分析、相位敏感 | 实时处理、嵌入式 |

```python
import numpy as np

fs = 1000.0; fc = 150.0

# FIR 低通：sinc 截断 + 汉宁窗，15 个系数
N = 15
k = np.arange(N) - (N - 1) / 2
h = np.sinc(2 * fc / fs * k) * np.hanning(N); h /= h.sum()

# IIR 低通：4 阶 Butterworth，两个双二阶节级联
w0 = 2 * np.pi * fc / fs; Q = 1 / np.sqrt(2)
al = np.sin(w0) / (2 * Q); c = 1 - np.cos(w0)
b = np.array([c/2, c, c/2]) / (1 + al)
a1, a2 = -2*np.cos(w0)/(1+al), (1-al)/(1+al)

def H_fir(f):
    return abs((h * np.exp(-2j*np.pi*f/fs * np.arange(N))).sum())
def H_iir(f):
    z = np.exp(-2j*np.pi*f/fs)
    return abs(((b[0]+b[1]*z+b[2]*z**2) / (1+a1*z+a2*z**2))**2)

print(f"{'频率':>6} {'FIR(15系数)':>12} {'IIR(4阶)':>10}")
for f in [50, 100, 150, 200, 300, 450]:
    print(f"{f:>5.0f}Hz {20*np.log10(H_fir(f)):>+10.1f} dB {20*np.log10(H_iir(f)):>+9.1f} dB")
print(f"\n每样本乘加: FIR {N} 次 vs IIR 10 次（两个双二阶节，每节 5 次）")
```

运行结果要点：滚降相当（200 Hz 处 -14.8 dB 对 -14.2 dB），每样本乘加 FIR 15 次、IIR 10 次——约 1.5 倍的计算量差距；且指标要求越陡差距越大：FIR 的系数个数需随过渡带变窄成比例增加，IIR 每增加一对共轭极点（阶数加 2）即可显著加深滚降。实时选频试听、车载控制器在线滤波等场合，计算量直接决定可行性，IIR 是默认选择。

::: warning IIR 高效的代价：稳定性
IIR 的传递函数为

$$H(z) = \frac{\sum_{k=0}^{N} a(k)\, z^{-k}}{1 - \sum_{k=1}^{P} b(k)\, z^{-k}}$$

分母多项式的根是滤波器的极点，稳定的充要条件是全部极点位于单位圆内：$|p_i| < 1$。系数设计不当，或嵌入式平台定点实现时的系数量化，都可能把极点推到单位圆外——反馈发散，输出溢出。

FIR 的结构只有有限项加权求和，除 $z=0$ 外没有极点，数学上不可能发散。
:::

## 三、时延与相位：FIR 线性相位的来源

滤波输出相对输入存在时延。FIR 的时延有解析表达式，可从频响出发推导。

FIR 的频率响应是系数序列的离散时间傅里叶变换：

$$H(\omega) = \sum_{k=0}^{N-1} h(k)\, e^{-j\omega k}$$

物理意义：滤波器对复指数输入的响应是各系数贡献的复数加权和，$\omega$ 为数字角频率（rad/样本）。

若系数关于中心对称，$h(k) = h(N-1-k)$，把第 $k$ 项与第 $N-1-k$ 项配对求和：

$$h(k)\left[e^{-j\omega k} + e^{-j\omega (N-1-k)}\right] = 2\,h(k)\, e^{-j\omega\frac{N-1}{2}} \cos\!\left[\omega\left(\frac{N-1}{2}-k\right)\right]$$

配对的物理意义：对称位置的两个系数提取出同一个公共相位因子，剩余部分是实数余弦项。全部系数配对后，频响整理为

$$H(\omega) = e^{-j\omega\frac{N-1}{2}}\, A(\omega)$$

其中 $A(\omega)$ 为实函数。相位是频率的严格线性函数：

$$\varphi(\omega) = -\frac{N-1}{2}\,\omega$$

群时延（group delay）定义为相位对角频率的负导数（单位：样本）：

$$\tau_g(\omega) = -\frac{d\varphi(\omega)}{d\omega} = \frac{N-1}{2}$$

与频率无关：所有频率成分一律延迟 $(N-1)/2$ 个样本，等价于时域整体平移，各成分的相对相位关系滤波后保持不变。直观解释：要有 $N$ 个数据点喂满滤波器它才完全工作，等效作用中心落在输入序列的 $(N-1)/2$ 处。本文算例 $N=15$、$f_s = 1000\ \mathrm{Hz}$：$\tau_g = 7$ 样本 $= 7\ \mathrm{ms}$，对任何频率都成立。

IIR 没有这个保证：不同频率的时延不相等，手册指出时延最大通常出现在截止频率附近（本文算例的群时延峰约 3.8 个样本，出现在 117 Hz，位于通带边沿）。通带内各成分的相对相位被改变，波形发生畸变。

![FIR 恒定时延，IIR 时延随频率变化](/images/fir-vs-iir/group-delay.png)
*（图源：Simcenter Testing Knowledge Base）*

```python
import numpy as np

fs = 1000.0; fc = 150.0

# 同两款低通滤波器：15 系数 FIR 与 4 阶 Butterworth IIR
N = 15
k = np.arange(N) - (N - 1) / 2
h = np.sinc(2 * fc / fs * k) * np.hanning(N); h /= h.sum()
w0 = 2 * np.pi * fc / fs; Q = 1 / np.sqrt(2)
al = np.sin(w0) / (2 * Q); c = 1 - np.cos(w0)
b = np.array([c/2, c, c/2]) / (1 + al)
a1, a2 = -2*np.cos(w0)/(1+al), (1-al)/(1+al)

def H_fir(f):
    return (h * np.exp(-2j*np.pi*f/fs * np.arange(N))).sum()
def H_iir(f):
    z = np.exp(-2j*np.pi*f/fs)
    return ((b[0]+b[1]*z+b[2]*z**2) / (1+a1*z+a2*z**2))**2
def gd(H, f):   # 相邻 1Hz 相位差 -> 群时延（样本数）
    return -np.angle(H(f + 1) / H(f)) / (2*np.pi/fs)

print(f"{'频率':>6} {'FIR时延':>8} {'IIR时延':>9}  (样本)")
for f in [50, 100, 140, 150, 160, 250, 400]:
    print(f"{f:>5.0f}Hz {gd(H_fir,f):>8.2f} {gd(H_iir,f):>9.2f}")
print(f"FIR 时延恒为 (N-1)/2 = {(N-1)/2:.0f} 样本；IIR 随频率变化")
```

运行结果要点：FIR 从 50 Hz 到 400 Hz 时延恒为 7.00 个样本；IIR 在 100 Hz 附近 3.71 个样本、400 Hz 只剩 0.82 个样本——时延随频率变化，相位关系无法保持。

时延失真的两个典型影响场景：

- **声振关联排查**：多通道同时录制声音和振动，若只给声音通道加了滤波，声音相对振动整体后移。判断某个振动事件是否为某个异响的来源时，时间对不上会导致误判
- **工作变形分析（ODS，Operational Deflection Shape）**：一组振动通道中部分滤波、部分未滤，通道间相位关系被改变，动画给出的结构变形形态不正确

## 四、零相位滤波：消除时延的事后处理方法

数据采集完成、在计算机上离线处理时，时延可以完全消除：把信号正向滤一遍，反转，再滤一遍，再反转回来。这就是零相位滤波（zero phase filtering）。两次滤波的时延互相抵消，频域解释很直接：时间反转对应频域取共轭，正反两次滤波的等效传递函数为

$$H_{\mathrm{zero}}(f) = H(f) \cdot H^{*}(f) = \left|H(f)\right|^{2}$$

相位恒为零——零相位的名称即由此而来。代价是衰减翻倍：

$$20\,\lg\left|H(f)\right|^{2} = 2 \times 20\,\lg\left|H(f)\right|$$

设定截止频率时必须把滤两遍的衰减叠加考虑进去。手册给出零相位滤波的完整代价清单：

- 计算量翻倍
- 只适用于已数字化的数据，模拟信号无法在时间上反向通过滤波器
- 时间记录末端会丢失一段数据（反转滤波从末尾起算）
- 数据被滤两遍，衰减翻倍、等效滚降更陡

```python
import numpy as np

fs = 1000.0
t = np.arange(600) / fs
x = np.sin(2 * np.pi * 30 * t)          # 30 Hz 正弦，0.6 秒

# 一阶 IIR 低通（截止 60 Hz），只用 numpy 逐样本递推
alpha = np.exp(-2 * np.pi * 60 / fs)
def lp(v):
    y = np.zeros_like(v)
    for i in range(1, len(v)):
        y[i] = (1 - alpha) * v[i] + alpha * y[i - 1]
    return y

y_fwd = lp(x)                    # 直接滤波
y_zero = lp(y_fwd[::-1])[::-1]   # 正向滤 -> 反转 -> 再滤 -> 反转

def lag(y):                      # 互相关找时延（样本数）
    c = np.correlate(y - y.mean(), x - x.mean(), "full")
    return np.argmax(c) - (len(x) - 1)

print(f"直接滤波时延: {lag(y_fwd):+d} 样本（{lag(y_fwd)/fs*1000:.1f} ms）")
print(f"零相位时延  : {lag(y_zero):+d} 样本")
print(f"直接滤波幅值: {np.max(np.abs(y_fwd)):.3f}")
print(f"零相位幅值  : {np.max(np.abs(y_zero)):.3f}  （滤两遍，衰减翻倍）")
```

运行结果要点：直接滤波输出滞后 2 个样本，零相位滤波时延归零；30 Hz 幅值从 0.902 降到 0.810——两遍滤波的衰减叠加，正是等效传递函数 $\left|H(f)\right|^{2}$ 的直接体现。

::: tip 工程选择原则
- **离线处理、关心波形和相位**（ODS、声振关联、TPA）→ 零相位滤波，或用 FIR 后按 $(N-1)/2$ 平移补偿
- **实时处理、嵌入式**（车载在线监测、实时试听）→ IIR，阶数低、计算量小
- **IIR 方法选择**：通带平坦选 Butterworth；过渡带最窄选 Cauer（椭圆）；时延随频率最平选 Bessel——IIR 家族中唯一时延接近恒定的
- **通道一致性要求**：一组通道要么都滤、要么都不滤，且使用同一款滤波器、同一组参数
:::

## 五、小结

选型三条判据：是否实时、是否需要保持相位、能否接受稳定性风险。实时且不关心相位，选 IIR；离线分析，FIR 或零相位滤波可一次解决时延问题；多通道联合分析，全部通道使用完全相同的滤波设置。

Simcenter Testlab 中在 Time Signal Calculator 的 Conditioning 组调用 FILTER_LP 等函数，可指定滤波器类型（FIR/IIR）、阶数与方法；Show 按钮直接预览幅频、相位与群时延。执行滤波前先查看群时延曲线，可提前发现通道间时延失配，避免事后排查时间对不上的问题。
