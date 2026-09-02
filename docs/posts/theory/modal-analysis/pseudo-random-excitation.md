---
title: "伪随机激励：将激振能量对齐傅里叶网格的模态测试信号"
---

# 伪随机激励：将激振能量对齐傅里叶网格的模态测试信号

> 模态测试中频响函数（Frequency Response Function, FRF）的质量与激励信号的特性直接相关：纯随机信号频带覆盖宽，但信噪比低、需加窗、需多次平均；正弦类信号信噪比高，但须在频带内逐点扫描。伪随机激励（Pseudo-Random Excitation）介于两者之间：信号在一帧内周期化、谱线全部落在傅里叶网格上，可用矩形窗实现零泄漏，相干函数优于猝发随机。本文说明其构造方法、Schroeder 相位降低波峰因子的原理，以及周期平均对噪声的抑制作用。

## 一、FRF 质量的两个约束：泄漏与信噪比

评估 FRF 质量的主要指标是**相干函数（Coherence Function）**：其值接近 1 表示输出能量几乎全部可由输入解释，该数据用于模态参数拟合才具备可靠性。相干函数保持高值需要满足两个条件。

第一，傅里叶变换要求被测信号在采集窗内**周期化**：帧首尾相接时不产生突跳。信号不周期时必须施加窗函数强制周期化，而窗函数必然引入畸变。第二，激励能量须覆盖整个分析频带，且信噪比（Signal-to-Noise Ratio, SNR）足够高，否则响应通道中背景噪声占比过大。

常用激振信号在上述两项约束上各有不足：

| 信号类型 | 频域形态 | 信噪比 | 泄漏/加窗 | 平均次数 |
| --- | --- | --- | --- | --- |
| **纯随机（Random）** | 连续宽带 | 低 | 非周期，须汉宁窗 | 几十次起步 |
| **猝发随机（Burst Random）** | 连续宽带 | 中 | 帧内归零即周期，矩形窗 | 中等 |
| **扫频正弦（Sine）** | 单谱线，随扫移动 | 高 | 落网格才无泄漏 | 每频点少 |
| **伪随机（Pseudo-Random）** | 固定离散谱线铺满网格 | 高 | 帧内整周期，矩形窗 | 少 |

::: info 核心概念
- **傅里叶网格（Fourier Grid）**：频率分辨率 Δf = 1/T 决定的谱线位置集合。信号频率恰好落在网格上时，DFT 隐含的周期延拓与信号自身周期一致，无泄漏
- **波峰因子（Crest Factor，LMS 理论手册称峰值因子）**：峰值与均方根值（RMS）之比。正弦波为 1.41，随机信号约 3～4。波峰因子越高，功放与激振器在同样电压上限下的有效激励能量越低
- **周期随机（Periodic Random）**：与伪随机同属多正弦信号家族，区别是其幅度谱也逐帧随机化
:::

## 二、多正弦合成：伪随机的构造逻辑

伪随机信号的本质是**多正弦（Multi-sine）**：将一组频率恰好落在傅里叶网格上的正弦波叠加。其一般形式为

$$x(t) = \sum_{k=1}^{K} A_k \sin\!\left( 2\pi k \Delta f \, t + \phi_k \right)$$

其中 K 为谱线数，A_k 为第 k 根谱线的幅值（单位 V），φ_k 为其相位（单位 rad），Δf = 1/T 为频率分辨率（单位 Hz）。每个分量的频率 kΔf 均为窗长 T 对应基频的整数倍，因此整帧信号天然满足周期条件，可直接使用矩形窗。

以最小算例说明：取 2、4、6 Hz 三个分量，采集窗 T = 0.5 s，频率分辨率 Δf = 1/T = 2 Hz，三个频率全部落在网格上：

```python
import numpy as np

fs = 1000            # 采样率
T = 0.5              # 采集窗长 -> 频率分辨率 2 Hz
N = int(fs * T)
t = np.linspace(0, T, N, endpoint=False)

freqs = np.array([2.0, 4.0, 6.0])          # 全部是 2 Hz 的整数倍
phases = np.array([0.3, 2.1, 4.7])         # 任意相位
x = np.sin(2*np.pi*freqs[:, None]*t + phases[:, None]).sum(axis=0)

# 帧首尾拼接是否平滑：比较最后一点与周期延拓后下一点的跳变
x_wrap = np.roll(x, -1)
jump = abs(x_wrap[-1] - x[-1])
print(f"帧尾值 x[-1] = {x[-1]:.4f}")
print(f"首点   x[0]  = {x[0]:.4f}")
print(f"拼接跳变量     = {jump:.4f}（峰值 {np.max(np.abs(x)):.2f}）")
```

三个频率均为 Δf 的整数倍时，x(0) 与 x(T) 处相位自然对齐，拼接跳变量为 0。这就是"落在网格上"的物理含义：DFT 隐含的周期延拓与信号自身周期一致，全部能量保留在谱线位置，不向相邻谱线泄漏。

频率不落在网格上造成的幅值误差可以直接计算：

```python
import numpy as np

fs = 1024
T = 1.0                                # 分辨率 1 Hz
N = int(fs * T)
t = np.linspace(0, T, N, endpoint=False)

# 同样两个分量，一组频率落在网格上，一组偏离 0.3/0.7 Hz
x_grid = np.sin(2*np.pi*100*t)   + 0.5*np.sin(2*np.pi*250*t)
x_off  = np.sin(2*np.pi*100.3*t) + 0.5*np.sin(2*np.pi*250.7*t)

for name, s in (("落网格  ", x_grid), ("不落网格", x_off)):
    amp = np.abs(np.fft.rfft(s))/N*2   # 单边幅值谱
    print(f"{name}: 100Hz 幅值 {amp[100]:.3f} | 250Hz 幅值 {amp[250]:.3f}")
print("理论值  : 100Hz 幅值 1.000 | 250Hz 幅值 0.500")
```

计算结果：不落网格的 250.7 Hz 分量在最近的 250 Hz 谱线上幅值仅剩 0.184，比真值 0.500 低 63%。该误差不是仪器误差，而是非周期截断的确定性数学后果。工程上若必须以连续采样分析非周期信号，只能退回加汉宁窗的处理方式；伪随机的做法则是使信号在生成时就落在网格上。

伪随机信号的频域谱线分布与时域波形见下面两图：连续宽带随机在整个频带上形成连续"地毯"，任何单根谱线上的能量有限；伪随机将同样的总能量集中到有限根离散谱线上，每根谱线的幅度可精确设定并逐线抬高，信噪比优势即来源于此。

![伪随机与宽带随机的频域形态对比](/images/pseudo-random-excitation/pr-vs-random-spectrum.jpg)
*（图源：Simcenter Testing Knowledge Base）*

![多正弦信号的时域波形](/images/pseudo-random-excitation/multisine-time.jpg)
*（图源：Simcenter Testing Knowledge Base）*

::: warning 工程注意
LMS 理论手册对系统分析（频响函数测量）的窗函数推荐为：汉宁窗用于随机激励的参考通道和响应通道；**矩形窗只用于伪随机激励的参考通道和响应通道**；力窗与指数窗用于锤击法。若测伪随机时误用汉宁窗，等于对已周期化的信号再施加一次人为调幅，幅值和相位均会失真，这是 Testlab 使用者常见的参数残留错误。
:::

## 三、波峰因子：功放电压上限下的有效能量约束

多正弦解决了泄漏问题，但引入新的约束：K 个正弦分量若全部同相叠加，峰值可达单分量幅值的 K 倍量级，而 RMS 仅按 √K 增长，波峰因子随谱线数增加而恶化。功放和激振器存在电压/推力上限，峰值最先达到上限：波峰因子为 3 的信号，有效激励电压仅为上限的 1/3，信噪比优势随之损失。

降低波峰因子的常用方法是 **Schroeder 相位**：为每个分量分配如下确定性相位

$$\phi_k = \frac{\pi\, k (k-1)}{K}, \quad k = 1, 2, \dots, K$$

其物理含义是使各分量的瞬时频率在时间上近似均匀分布，各分量在时域上不同时达到峰值。该相位序列由周期性调频信号瞬时频率的推导得出，可将合成波的波峰因子降至接近单正弦水平（1.41），且完全确定、可复现。作为对照，K 个同相分量叠加的波峰因子理论值为 √(2K)，K=50 时为 10.0。

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

同为 50 个分量，随机相位波峰因子为 3.06，Schroeder 相位降至 1.89：峰值从 15.3 降至 9.5，RMS 保持 5.0 不变。在相同功放电压上限下，Schroeder 版本的有效激励电压为随机相位版本的 3.06/1.89 ≈ 1.62 倍，即提高约 60%。Simcenter Testlab 中的伪随机信号即采用 Schroeder 相位，可在不触发过载的前提下提高激励电平。

![Schroeder 相位压低波峰因子](/images/pseudo-random-excitation/schroder-crest.jpg)
*（图源：Simcenter Testing Knowledge Base）*

![同等过载裕度下可抬高的激励电平](/images/pseudo-random-excitation/excitation-level.jpg)
*（图源：Simcenter Testing Knowledge Base）*

## 四、谱平均与周期平均：两种噪声抑制路径

存在噪声即需平均。频域的**谱平均（Spectral Averaging）**为常用方法：线性平均或指数平均，随机激励、猝发随机均依赖它，SNR 越差所需帧数越多。伪随机因信噪比本身较高，所需平均次数少，测试时间相应缩短。

![谱平均设置](/images/pseudo-random-excitation/spectral-averaging.jpg)
*（图源：Simcenter Testing Knowledge Base）*

伪随机还有第二条噪声抑制路径：**周期平均（Cyclic Averaging）**，即时域平均。由于激励信号每帧完全相同（确定性波形），结构响应在瞬态衰减之后也逐帧重复。操作流程为：先施加若干**延迟块（Delay Blocks）**使结构进入稳态周期响应，然后从每帧激励的同一时刻起采集、逐帧作时域平均。噪声与激励无固定相位关系，在平均中相互抵消；响应信号因帧帧相干而随平均次数增加趋于干净。该流程分为内环（单次采集内的周期平均）与外环（重复整个采集），Allemang 与 Phillips 在 IMAC 会议论文中给出了完整的误差分析。

| 平均方式 | 域 | 前提条件 | 抑制对象 |
| --- | --- | --- | --- |
| **谱平均（线性/指数）** | 频域 | 无特殊要求 | 各帧互谱/自谱的随机波动 |
| **周期平均（瞬态后）** | 时域 | 激励逐帧重复、结构已进入稳态 | 与激励不相关的背景噪声 |

周期平均对工况还有细分：半稳态工况（转速漂移）先用 RPM 自适应重采样（阶次跟踪思路）再作同步平均；严格稳态工况直接从时间块起点同步平均。

![周期平均流程](/images/pseudo-random-excitation/cyclic-averaging.jpg)
*（图源：Simcenter Testing Knowledge Base）*

## 五、工程验证：飞机全机驱动点 FRF

Siemens 以一组飞机驱动点（Driving-point）FRF 对比了猝发随机与 Schroeder 正弦伪随机，判据为相干函数。结果方向明确：猝发随机工况的相干函数在多个频段出现明显下凹；伪随机 + Schroeder 正弦的相干函数整体接近 1.0，共振峰附近也无塌陷。

![猝发随机工况的相干函数](/images/pseudo-random-excitation/coherence-burst-random.jpg)
*（图源：Simcenter Testing Knowledge Base）*

![伪随机 + Schroeder 正弦工况的相干函数](/images/pseudo-random-excitation/coherence-pseudo-random.jpg)
*（图源：Simcenter Testing Knowledge Base）*

![实测案例对比](/images/pseudo-random-excitation/coherence-case.jpg)
*（图源：Simcenter Testing Knowledge Base）*

该结论对整车与动力总成测试同样成立：车身模态、副车架模态等高价值测试中，试件准备耗时以天计，更换激励信号使相干函数从 0.9 提升至 0.99，可明显改善后续与有限元模型对标的相关性。

## 六、小结

选择激励信号的判据有三条：能量是否覆盖分析频带、是否天然免泄漏、功放电压上限内有效能量有多高。伪随机 + Schroeder 相位三项均满足，代价是需要信号源与采集同步（激振器测试的标配功能）。锤击法仍用 H1 估计 + 力窗/指数窗；宽带随机适用于快速普查，仍用汉宁窗 + 谱平均；当目标是高保真 FRF，即模态对标、航空结构地面共振试验（Ground Vibration Test, GVT）、修改预测时，伪随机是应优先考虑的方案。
