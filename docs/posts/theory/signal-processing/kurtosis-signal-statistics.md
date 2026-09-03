---
title: "峭度：表征信号冲击特性的统计量"
---

# 峭度：表征信号冲击特性的统计量

> 台架上一款电机异响，时域波形平稳，RMS 与正常件接近，客户仍投诉"咔哒"声。这类问题出在信号幅值的分布形状上：冲击事件集中在直方图的尾部。峭度（Kurtosis）是量化这一特征的无量纲统计量：方波为 1、正弦为 1.5、高斯随机为 3（不减 3 口径），含冲击成分的信号显著大于 3。本文依据 LMS 检测理论手册与 Simcenter Testing Knowledge Base，说明其定义、与峰值因子的区别，以及在声品质诊断和随机振动控制试验中的应用方法。

## 一、RMS 与峰值未覆盖的信息

NVH 工程中常用总级（Overall Level）描述振动噪声，RMS 本质是二阶矩，反映能量的平均水平，不反映能量在时间上的分布。一段大部分时间平静、偶发冲击的信号，与一段持续中等强度的信号，RMS 可以相同，听感与疲劳损伤完全不同。

峰值同样存在局限：峰值只取记录内的最大单点，一个毛刺（如传感器碰撞或电磁干扰）即可使其失真；且信息量不足——峰值 10 g 的信号可能是稀疏的大冲击，也可能是密集的中等冲击，两者对应的疲劳损伤不同。

区分这两类信号的依据是幅值的**概率分布**。将时域波形按幅值分箱统计出现次数，得到直方图（Histogram）：方波在两端的幅值处堆积、中间为空；高斯随机呈钟形对称；含冲击的信号呈"中部尖峰 + 长尾"形态——绝大多数采样点集中在零附近，少数点延伸到较大幅值处。

::: info 核心概念
- **峭度（Kurtosis）**：信号的四阶标准化矩，量化幅值分布相对高斯分布的尖峭或平坦程度
- **峭度超值（Kurtosis Excess）**：峭度减 3，使高斯分布对应 0，正负号直接指示"比高斯更尖还是更平"
- **峰值因子（Crest Factor）**：峰值除以 RMS；峭度控制中 Sigma Clipping 的"sigma"即峰值/RMS 倍数
- **尖峰态（Leptokurtic）/ 平坦态（Platykurtic）**：分布比高斯更尖 / 更平的表述
:::

![正负峭度分布与正态分布比较](/images/kurtosis-signal-statistics/fig9-3-kurtosis-distributions.png)
*（图源：LMS 检测理论手册 图 9-3）*

## 二、峭度的定义与典型值

对长度为 $N$ 的时域序列 $x_i$（单位与被测量一致，如 g 或 Pa），先计算均值 $\bar{x}$ 与标准差 $\sigma_x$：

$$\bar{x} = \frac{1}{N}\sum_{i=1}^{N} x_i \,, \qquad \sigma_x = \sqrt{\frac{1}{N}\sum_{i=1}^{N} \left( x_i - \bar{x} \right)^2}$$

均值描述分布中心，标准差描述分布宽度，两者都不含高阶信息。将每个采样点标准化后取四次方平均，即得峭度（LMS 检测理论手册 式 9-14）：

$$\kappa = \frac{1}{N}\sum_{i=1}^{N} \left( \frac{x_i - \bar{x}}{\sigma_x} \right)^4 - 3$$

分步物理意义：$x_i - \bar{x}$ 去除直流分量；除以 $\sigma_x$ 使结果无量纲、可与任意量纲的信号直接比较；四次方在放大大幅值贡献的同时保持符号消失后的正值性；减 3 使高斯分布归零。四次方对尾部极为敏感：$3\sigma$ 以外的单点贡献为 $81$，是 $1\sigma$ 点的 81 倍——尾部概率的微小变化即可引起峭度的显著响应，这是峭度对冲击敏感的数学原因。

手册对判读有明确约定：峭度为正值，表示实际分布比高斯分布有更长的尾部；负值表示尾部更短。

四类典型信号的峭度数值如下：

| 信号类型 | 峭度超值 $\kappa$ | 峭度（不减 3） | 分布形态 |
| --- | --- | --- | --- |
| **方波** | $-2.0$ | 1.0 | 两端堆积，无尾部 |
| **正弦** | $-1.5$ | 1.5 | 平坦态 |
| **高斯随机** | $0$ | 3.0 | 基准钟形 |
| **冲击/瞬态信号** | $\gg 0$ | $\gg 3$ | 中部尖峰 + 长尾 |

::: warning "减 3"的口径差异
不同软件对"kurtosis"的定义不一致：Simcenter Testlab 的 Throughput Processing 计算峭度超值（高斯 = 0），而 Random Control 振动控制中 Kurtosis Control 的设定值不减 3（高斯 = 3）。对比两套系统的数值前，须先确认口径。
:::

高次矩的代价是估计精度差。手册给出：对理想高斯分布样本，峭度估计的标准差约为

$$\sigma_{\kappa} \approx \sqrt{24 / N}$$

其中 $N$ 为采样点数。这意味着峭度估计的置信度随数据量增长缓慢：欲将 $\sigma_{\kappa}$ 压到 0.1，需要 $N \approx 2400$ 点；压到 0.05 则需约 9600 点。对非高斯分布，该标准差无法解析确定，实际精度通常更差。手册同时提示：偏斜度与峭度这类高次矩，与基于线性相加的低次矩相比鲁棒性较差，计算结果分散，使用时须谨慎——数据量不足时短帧峭度数值跳动属正常现象，判读应以足够长的记录为基础。

![数据分布的对称与偏斜](/images/kurtosis-signal-statistics/fig9-2-skewness-distributions.png)
*（图源：LMS 检测理论手册 图 9-2，与峭度同属幅值分布统计参数）*

## 三、声品质应用：滑动帧峭度定位瞬态声

在声品质评价中，峭度超值对瞬态声敏感。两种点击声（click）峰值相同，一个以 5 ms 时间常数衰减，一个以 40 ms 衰减：短促的能量集中使四次方项主导平均，峭度显著更高——衰减越快、能量越集中的点击，峭度超值越大。

这类应用的关键方法是**滑动帧统计**：在 Testlab Signature Throughput Processing 中对信号加帧（例如帧长 0.05 s、增量 0.005 s），每帧计算一个峭度超值，得到随时间变化的统计曲线。咔哒声出现的时刻，曲线同步出现峰值，以此定位事件时间点，效率高于人工翻查录音。

```python
import numpy as np

def kurtosis_excess(x):
    z = (x - x.mean()) / x.std()          # 标准化
    return np.mean(z**4) - 3.0            # 四阶矩减 3

fs = 50000                                # 采样率，Hz

def click_burst(tau):
    """峰值恒为 1.0 的指数衰减振荡，tau 为时间常数 (s)"""
    n = np.arange(int(0.3 * fs))
    burst = np.exp(-n / (tau * fs)) * np.sin(2 * np.pi * 2500 * n / fs)
    return burst / np.abs(burst).max()

# 1) 同峰值、不同衰减时长的单次点击（无背景）
for tau in (0.005, 0.04):
    sig = np.zeros(fs)                    # 1 s 记录，0.5 s 处一次点击
    burst = click_burst(tau)
    i0 = int(0.5 * fs)
    sig[i0:i0 + len(burst)] += burst
    print(f"tau={tau*1000:4.0f}ms peak=1.00 excess={kurtosis_excess(sig):+7.1f}")

# 2) 背景噪声中的短点击：滑动帧定位
rng = np.random.default_rng(0)
sig = rng.standard_normal(fs) * 0.05      # 平稳背景噪声
burst = click_burst(0.005)
i0 = int(0.5 * fs)
sig[i0:i0 + len(burst)] += burst
L, H = int(0.05 * fs), int(0.005 * fs)    # 帧长 0.05 s，增量 0.005 s
fk = np.array([kurtosis_excess(sig[s:s+L])
               for s in range(0, len(sig) - L + 1, H)])
print(f"frame kurtosis: median={np.median(fk):+.1f} "
      f"max={fk.max():+.1f} at t={np.argmax(fk) * H / fs:.3f}s")
```

实测输出（随机种子固定，可复现）：单次点击峰值同为 1.0 时，$\tau = 5\,\mathrm{ms}$ 的峭度超值约 $+297$，$\tau = 40\,\mathrm{ms}$ 约 $+34$，相差近一个数量级；背景噪声场景中，滑动帧曲线的背景中位数约 $0$，在 $t = 0.455\,\mathrm{s}$（点击发生前、帧覆盖到点击的时刻）达到峰值约 $+13.6$，事件定位明确。

## 四、振动控制应用：PSD 之外的峰值分布控制

随机振动试验以 PSD（功率谱密度）为控制目标。PSD 规定了频率成分，同时约束了 RMS 总级，但不约束时域峰值分布：四条 PSD 几乎重合的驱动信号（RMS 同为 0.25 g），峭度可从 3 到 12 不等——峭度越高，高峰值事件越密集，对试件的疲劳损伤越严重。道路实测谱的峭度常大于 3（碎石路、减速带等工况），仅用高斯随机驱动进行试验，冲击事件密度低于实际载荷。

Simcenter Testlab Random Control 的对应功能：

- **Kurtosis Control**：Tools → Add-ins 启用后，在 Random Control Setup 中直接填写 Desired Kurtosis，口径为高斯 = 3，可设范围约 3～12，用于复现实测路谱的峰值分布
- **Sigma Clipping**：限制驱动信号的峰值/RMS 倍数。默认 sigma = 20（几乎不削波）；设为 3 时，峰值超过 3 倍 RMS 的样本被削除，用于保护功放与试件

| 手段 | 作用 | 方向 |
| --- | --- | --- |
| **Kurtosis Control** | 复现实测路谱的峰值密集程度 | 峭度从 3 向上调，还原真实损伤 |
| **Sigma Clipping** | 限制驱动信号峰值/RMS 比 | 削去罕见极端峰值，保护功放与试件 |
| **PSD 单独使用** | 只保证频率成分与 RMS 总级 | 高斯驱动，冲击事件密度不足 |

::: tip 工程判断
- 手上有实测路谱或工况数据：先计算其峭度，若明显大于 3，随机试验应启用 Kurtosis Control 对齐
- 试件昂贵或不可修复：Sigma Clipping 设为 3～5，以牺牲部分分布还原度为代价控制风险
- 诊断异响（咔哒、咔啦）：用 Throughput Processing 的滑动帧峭度超值，帧长取事件持续时间的数倍
:::

## 五、Python 演示：峭度、峰值因子与 RMS 的分工

```python
import numpy as np

def kurtosis_excess(x):
    z = (x - x.mean()) / x.std()
    return np.mean(z**4) - 3.0

rng = np.random.default_rng(0)
N = 100000
t = np.arange(N) / N

sine   = np.sin(2 * np.pi * 10 * t)         # 正弦
square = np.sign(sine)                      # 方波
gauss  = rng.standard_normal(N)             # 高斯随机
rattle = gauss.copy()                       # 高斯背景 + 千分之二尖峰，模拟咔哒异响
rattle[rng.choice(N, 200, replace=False)] += 15.0

print(f"{'信号':6s} {'峭度超值':>10s} {'峰值因子':>8s} {'RMS':>7s}")
for name, s in [("正弦", sine), ("方波", square), ("高斯", gauss), ("咔哒", rattle)]:
    rms = np.sqrt(np.mean(s**2))
    crest = np.abs(s).max() / rms
    print(f"{name:6s} {kurtosis_excess(s):+10.2f} {crest:8.2f} {rms:7.2f}")
```

实测输出（随机种子固定，可复现）：

| 信号 | 峭度超值 | 峰值因子 | RMS |
| --- | --- | --- | --- |
| 正弦 | -1.50 | 1.41 | 0.71 |
| 方波 | -2.00 | 1.00 | 1.00 |
| 高斯 | +0.02 | 4.73 | 1.00 |
| 咔哒 | +46.91 | 14.01 | 1.20 |

正弦、方波、高斯与理论值逐一对应。带尖峰的"咔哒"信号 RMS 仅从 1.00 升至 1.20（+20%），峰值因子升至 14，峭度超值升至 +46.91：幅值分布的冲击特征主要反映在峭度上，总级的变化幅度不足以作为判据。

## 六、小结

峭度量化的是 RMS 与峰值都无法描述的信息：能量在幅值上的分布形状。诊断侧，滑动帧峭度超值可用于定位咔哒、咯吱、齿轮点蚀等冲击事件；试验侧，Kurtosis Control 与 Sigma Clipping 使随机振动试验能同时控制谱形、冲击密度与峰值上限。两条实用判据：峭度超值明显为正，信号含冲击成分；实测工况峭度明显大于 3，纯高斯随机试验的冲击考核不足。
