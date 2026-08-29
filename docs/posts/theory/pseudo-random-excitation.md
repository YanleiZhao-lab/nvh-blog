---
title: "伪随机激励：把激振能量铺满傅里叶网格的模态测试利器"
---

# 伪随机激励：把激振能量铺满傅里叶网格的模态测试利器

> 模态测试要出高质量的频响函数（FRF），激励信号的选择比采集参数更根本：随机信号能量铺得开但信噪比差、要加窗、要平均几十帧；正弦类信号信噪比高却是一条线一条线地扫。伪随机（Pseudo-Random）取两者之长——一帧之内信号周期化、天然落在傅里叶网格上，矩形窗零泄漏，相干函数轻松压过猝发随机。这篇讲清它的构造逻辑、Schroeder 相位压波峰因子的原理，以及周期平均怎么进一步压噪声。

## 一、FRF 质量的瓶颈：泄漏与信噪比

评估 FRF 好不好，工程师看的不是幅值曲线漂不漂亮，而是**相干函数（Coherence）**：γ² 接近 1 说明输出能量几乎全部可以被输入解释，数据拿去拟合模态参数才可靠。想让相干高，两件事必须成立——

第一，傅里叶变换要求被测信号在采集窗内**周期化**：帧首尾相接时没有突跳。不周期就得加窗强制周期化，而窗必然带来畸变。第二，激励能量要盖住整个分析频带，并且信噪比（SNR）足够高，否则响应通道里测到的一半是背景噪声。

常见的激振信号正好各占一头的缺陷：

| 信号类型 | 频域形态 | 信噪比 | 泄漏/加窗 | 平均次数 |
| --- | --- | --- | --- | --- |
| **纯随机（Random）** | 连续宽带 | 低 | 非周期，须汉宁窗 | 几十次起步 |
| **猝发随机（Burst Random）** | 连续宽带 | 中 | 帧内归零即周期，矩形窗 | 中等 |
| **扫频正弦（Sine）** | 单谱线，随扫移动 | 高 | 落网格才无泄漏 | 每频点少 |
| **伪随机（Pseudo-Random）** | 固定离散谱线铺满网格 | 高 | 帧内整周期，矩形窗 | 少 |

::: info 核心概念
- **傅里叶网格（Fourier Grid）**：频率分辨率 Δf = 1/T 的谱线位置。信号频率恰好落在网格上时，DFT 自然周期化、无泄漏
- **波峰因子（Crest Factor）**：峰值与 RMS 之比。正弦波 1.41，随机信号约 3～4（LMS 理论手册数值）。波峰因子越高，功放与激振器同样的电压上限下有效激励能量越低
- **周期随机（Periodic Random）**：与伪随机同属多正弦家族，区别是幅度谱也逐帧随机化
:::

## 二、多正弦合成：伪随机的构造逻辑

伪随机的本质是**多正弦（Multi-sine）**：把一串频率恰好在傅里叶网格上的正弦波叠加起来。举个最小例子——2、4、6 Hz 三个分量，采集窗 T = 0.5 s，频率分辨率 Δf = 1/T = 2 Hz，三个频率全部落在网格上，整帧信号天然周期，矩形窗直接用。

```python
import numpy as np

fs = 1000            # 采样率
T = 0.5              # 采集窗长 -> 频率分辨率 2 Hz
N = int(fs * T)
t = np.linspace(0, T, N, endpoint=False)

freqs = np.array([2.0, 4.0, 6.0])          # 全部是 2 Hz 的整数倍
phases = np.array([0.3, 2.1, 4.7])         # 任意相位
x = np.sin(2*np.pi*freqs[:, None]*t + phases[:, None]).sum(axis=0)

# 帧首尾拼接是否平滑：比较最后一点与下一点（周期延拓）的跳变
x_wrap = np.roll(x, -1)                    # 周期延拓后的下一点
jump = abs(x_wrap[-1] - x[-1])
print(f"帧尾值 x[-1] = {x[-1]:.4f}")
print(f"首点   x[0]  = {x[0]:.4f}")
print(f"拼接跳变量     = {jump:.4f}（峰值 {np.max(np.abs(x)):.2f}）")
```

三个频率都是 Δf 的整数倍时，x(0) 与 x(T) 处相位自然对齐，拼接跳变量为 0——这就是"落在网格上"的物理含义：DFT 隐含的周期延拓与信号自身周期严丝合缝，能量一个比特都不外泄。

频率不落网格的代价可以直接算出来：

```python
import numpy as np

fs = 1024
T = 1.0                                # 分辨率 1 Hz
N = int(fs * T)
t = np.linspace(0, T, N, endpoint=False)

# 同样两个分量，一组频率落在网格上，一组差 0.3/0.7 Hz
x_grid = np.sin(2*np.pi*100*t)   + 0.5*np.sin(2*np.pi*250*t)
x_off  = np.sin(2*np.pi*100.3*t) + 0.5*np.sin(2*np.pi*250.7*t)

for name, s in (("落网格  ", x_grid), ("不落网格", x_off)):
    amp = np.abs(np.fft.rfft(s))/N*2   # 单边幅值谱
    print(f"{name}: 100Hz 幅值 {amp[100]:.3f} | 250Hz 幅值 {amp[250]:.3f}")
print("理论值  : 100Hz 幅值 1.000 | 250Hz 幅值 0.500")
```

不落网格的 250.7 Hz 分量在 250 Hz 谱线上只剩 0.184，比真值 0.5 低了 63%——这不是仪器误差，是非周期截断的数学后果。工程上如果必须用连续采样分析非周期信号，就退回到加汉宁窗的老路；伪随机的做法更聪明：直接让信号生来就在网格上。

与纯随机的频域对比可以看下图：宽带随机在整个频带上是连续"地毯"，任何一根谱线上的能量都有限；伪随机把同样的总能量集中到有限根离散谱线上，每根线的幅度可以精确设定、逐线抬高，信噪比的优势就是这么来的。

![伪随机与宽带随机的频域形态对比](/images/pseudo-random-excitation/pr-vs-random-spectrum.jpg)
*（图源：Simcenter Testing Knowledge Base）*

::: warning 工程注意
LMS 理论手册对窗函数的推荐里明确写着：**矩形窗只用于伪随机激励的参考通道和响应通道**，汉宁窗对应随机激励。如果测伪随机时顺手挂了个汉宁窗，等于亲手把已经周期化的信号又乘上一个人为调幅，幅值和相位都会失真——这是 Testlab 新手最常见的参数残留错误。
:::

## 三、波峰因子：功放电压上限下的隐形天花板

多正弦解决了泄漏，但引入新问题：K 个正弦波如果同相叠加，峰值是单波的 K 倍，而 RMS 只涨 √K 倍——波峰因子随频率数恶化。功放和激振器有电压/推力上限，峰值先到顶：波峰因子 3 的信号，有效激励电压只剩上限的 1/3，信噪比优势被原样吐回去。

破解办法是 **Schroeder 相位**：不追求峰值最小，而是给每个分量分配一个确定性相位

$$\phi_k = \frac{\pi\, k (k-1)}{K}, \quad k = 1, 2, \dots, K$$

让各分量在时域上"轮流出头"而不是同时冒尖。这个相位序列来自对周期性调频信号瞬时频率的推导，能把合成波的波峰因子压到接近单正弦水平（单正弦为 1.41），且完全确定、可复现。

```python
import numpy as np

K  = 50                                # 叠加 50 个正弦分量
f0 = 2.0                               # 网格间隔 2 Hz（T=0.5s）
fs = 1000
T  = 0.5
N  = int(fs * T)
t  = np.linspace(0, T, N, endpoint=False)

freqs = 2*np.pi*f0*np.arange(1, K+1)                 # 2,4,...,100 Hz
ph_rand = np.random.default_rng(7).uniform(0, 2*np.pi, K)
ph_schr = np.pi*np.arange(1, K+1)*np.arange(0, K)/K  # Schroeder 相位

for name, ph in (("随机相位  ", ph_rand), ("Schroeder ", ph_schr)):
    s = np.sin(freqs[:, None]*t + ph[:, None]).sum(axis=0)
    peak = np.max(np.abs(s))
    rms  = np.sqrt(np.mean(s**2))
    print(f"{name}: 峰值 {peak:5.1f} | RMS {rms:4.1f} | 波峰因子 {peak/rms:.2f}")
```

同样是 50 个分量，随机相位波峰因子 3.06，Schroeder 相位压到 1.89——峰值从 15.3 降到 9.5，相当于在同样的功放电压上限下凭空多出 60% 的有效激励电压。Testlab 里这条绿线就是 Schroeder 相位版本，可以直接把激励电平抬高而不触发过载。

![Schroeder 相位压低波峰因子](/images/pseudo-random-excitation/schroder-crest.jpg)
*（图源：Simcenter Testing Knowledge Base）*

![同等过载裕度下可抬高的激励电平](/images/pseudo-random-excitation/excitation-level.jpg)
*（图源：Simcenter Testing Knowledge Base）*

## 四、谱平均与周期平均：两种压噪声路径

有噪声就得平均。频域的**谱平均**大家熟：线性平均或指数平均，随机激励、猝发随机都靠它，SNR 越差需要的帧数越多。伪随机因为信噪比本来就高，需要的平均次数少，测试时间直接省下来。

![谱平均设置](/images/pseudo-random-excitation/spectral-averaging.jpg)
*（图源：Simcenter Testing Knowledge Base）*

伪随机还有第二条路：**周期平均（Cyclic Averaging）**——时域平均。因为激励信号每帧完全相同（确定性波形），结构的响应在瞬态衰减掉之后也逐帧重复。操作节奏是：先发若干**延迟块（Delay Blocks）**让结构进入稳态周期响应，然后从每帧激励的同一时刻起采、逐帧时域平均。噪声与激励无固定相位关系，平均中相互抵消；响应信号因为帧帧相干而越平均越干净。这套流程分内环（单次采集内的周期平均）与外环（重复整个采集），IMAC 会议上 Allemang 与 Phillips 的经典论文给出了完整的误差分析。

| 平均方式 | 域 | 前提条件 | 压的是什么 |
| --- | --- | --- | --- |
| **谱平均（线性/指数）** | 频域 | 无特殊要求 | 各帧互谱/自谱的随机波动 |
| **周期平均（瞬态后）** | 时域 | 激励逐帧重复、结构已进入稳态 | 与激励不相关的背景噪声 |

周期平均对工况还有细分：半稳态工况（转速漂移）先用 RPM 自适应重采样（阶次跟踪思路）再同步平均；严格稳态工况直接从时间块起点同步平均。

![周期平均流程](/images/pseudo-random-excitation/cyclic-averaging.jpg)
*（图源：Simcenter Testing Knowledge Base）*

## 五、实战检验：飞机全机驱动点 FRF

Siemens 用一组飞机驱动点（Driving-point）FRF 对比了猝发随机与 Schroeder 正弦伪随机，判据就是相干函数。结果方向明确：猝发随机工况的相干在多个频段出现明显下凹，伪随机 + Schroeder 正弦的相干整体贴着 1.0，共振峰附近也没有塌陷。

![猝发随机工况的相干函数](/images/pseudo-random-excitation/coherence-burst-random.jpg)
*（图源：Simcenter Testing Knowledge Base）*

![伪随机 + Schroeder 正弦工况的相干函数](/images/pseudo-random-excitation/coherence-pseudo-random.jpg)
*（图源：Simcenter Testing Knowledge Base）*

![实测案例对比](/images/pseudo-random-excitation/coherence-case.jpg)
*（图源：Simcenter Testing Knowledge Base）*

这条结论对整车与动力总成测试同样成立：车身模态、副车架模态这类高价值测试，试件准备动辄几天，换激励信号换来相干从 0.9 提到 0.99，后续与有限元模型对标的相关性直接上台阶。

## 六、小结

选激励信号的判断标准只有三条：能量是否铺满分析频带、是否天然免泄漏、功放电压上限内有效能量有多高。伪随机 + Schroeder 相位三条全占，代价是需要信号源与采集同步（激振器测试的标配）。锤击仍用 H1 + 力窗/指数窗，宽带随机扫底仓快速普查仍用汉宁窗 + 谱平均；一旦目标是高保真 FRF——模态对标、航空结构 GVT、修改预测——伪随机是值得优先投入的方案。
