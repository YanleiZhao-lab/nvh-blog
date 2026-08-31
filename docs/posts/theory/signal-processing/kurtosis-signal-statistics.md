---
title: "峭度：直方图形状里的冲击信息"
---

# 峭度：直方图形状里的冲击信息

> 台架上一款电机异响，时域波形看着平平无奇，RMS 也和正常件差不多，客户却投诉"咔哒咔哒"。问题出在信号的分布形状上——冲击都藏在直方图的尾巴里。峭度（Kurtosis）就是量化这条尾巴的无量纲统计量：正弦为 1.5、方波为 1、高斯随机为 3，冲击信号远大于 3。本文讲清它的定义、与峰值因子的区别，以及在声品质评价和振动控制试验里的两套用法。

## 一、为什么 RMS 和峰值都照不见冲击

NVH 工程师习惯用总级（Overall Level）描述振动噪声，但 RMS 本质是二阶矩——它只关心能量的平均，不管能量怎么分布。一段大部分时间安静、偶尔来一下狠的信号，和一段持续中等强度的信号，RMS 可以完全一样，听感却天差地别。

峰值也不行。峰值只盯住最大那一个点，一个毛刺（比如传感器碰撞或电磁干扰）就能把它带偏，而且信息量太少：峰值 10 g 的信号，可能是稀疏的大冲击，也可能是密集的中等冲击，疲劳损伤完全不同。

真正区分这两类信号的，是幅值的**概率分布**。把时域波形按幅值分箱统计出现次数，得到直方图（Histogram）：方波的两端堆满、中间空；高斯随机的钟形对称；冲击信号则是"一根细高塔 + 长长的尾巴"——绝大多数采样点挤在零附近，极少数点伸到很远的幅值处。

::: info 核心概念
- **峭度（Kurtosis）**：信号四阶标准化矩，量化幅值分布相对高斯分布的尖峭/平坦程度
- **峭度超值（Kurtosis Excess）**：峭度减 3，使高斯分布归零，正负号直接指示"比高斯更尖还是更平"
- **峰值因子（Crest Factor / Sigma）**：峰值除以 RMS，峭度控制里sigma削波的"sigma"就是它
- **尖峰态（Leptokurtic）/ 平坦态（Platykurtic）**：分布比高斯更尖 / 更平的专业称呼
:::

![正负峭度分布与正态分布比较](/images/kurtosis-signal-statistics/fig9-3-kurtosis-distributions.png)
*（图源：Simcenter Testing Knowledge Base）*

## 二、峭度怎么算：一个公式和三个典型值

对长度为 n 的时域序列 x，峭度超值的定义为：

```text
k = (1/n) · Σ [ (xᵢ - x̄) / σ ]⁴ - 3
```

先把每个点减均值、除标准差（标准化），取四次方求平均，再减 3。四次方是个放大器：±3σ 以外的点贡献 81 倍于 ±1σ 的点，所以尾部稍有变化，峭度就剧烈响应——这正是它对冲击敏感的原因。

三类典型信号的峭度超值值得背下来：

| 信号类型 | 峭度超值 | 峭度（不减3） | 分布形态 |
| --- | --- | --- | --- |
| **方波** | -2.0 | 1.0 | 两端堆满，无尾部 |
| **正弦** | -1.5 | 1.5 | 平坦态 |
| **高斯随机** | 0 | 3.0 | 基准钟形 |
| **冲击/瞬态信号** | 远大于 0 | 远大于 3 | 细高塔 + 长尾 |

::: warning "减 3"的坑
不同软件对"kurtosis"的定义不一致：Simcenter Testlab 的 Throughput Processing 算的是峭度超值（高斯=0），而 Random Control 振动控制里的"Kurtosis Control"是不减 3 的版本（高斯=3）。对比两套系统的数值前，先确认口径。
:::

高次矩的代价是鲁棒性差。理论上高斯样本峭度估计的标准差约为 √(24/N)，N 个采样点才换来一点置信度；对非高斯信号，这个误差还无法解析确定。所以峭度要算得稳，数据量必须足够，短帧计算时数值跳动是常态。

## 三、声品质应用：区分"咔哒""砰砰"和"叮叮"

在声品质评价里，峭度超值是瞬态声的指纹。两种点击声（click）：峰值相同，一个 5 ms 短促衰减，一个 40 ms 悠长衰减，时域上几乎看不出差别，峭度却差出一个数量级——官方示例里短促点击的峭度超值峰值超过 120，长点击不到 40。

这类应用的关键是**滑动帧统计**：在 Testlab Signature Throughput Processing 里给信号加帧（比如帧长 0.05 s、增量 0.005 s），每个帧算一个峭度超值，得到一条随时间变化的曲线。咔哒声出现的位置，曲线同步冒尖，比人耳翻录音找时间点高效得多。

```python
import numpy as np

def kurtosis_excess(x):
    z = (x - x.mean()) / x.std()          # 标准化
    return np.mean(z**4) - 3.0            # 四阶矩减 3

fs = 50000                                # 采样率
t = np.arange(fs) / fs                    # 1 秒背景
rng = np.random.default_rng(0)
sig_short = rng.standard_normal(fs) * 0.1 # 平稳背景噪声
sig_long  = sig_short.copy()

for sig, tau in [(sig_short, 0.005), (sig_long, 0.04)]:
    i0 = int(0.5 * fs)                    # 0.5 s 处来一下点击
    n = np.arange(int(0.02 * fs))
    sig[i0:i0+len(n)] += np.exp(-n / (tau * fs)) * np.sin(2 * np.pi * 2500 * n / fs)

print(f"短点击(5ms 衰减)  峭度超值 = {kurtosis_excess(sig_short):+6.1f}")
print(f"长点击(40ms 衰减) 峭度超值 = {kurtosis_excess(sig_long):+6.1f}")
print(f"两者峰值 = {np.abs(sig_short).max():.2f} / {np.abs(sig_long).max():.2f} Pa")
```

运行结果要点：两个信号峰值几乎相同，峭度超值却差近十倍——短促的能量集中让四次方项爆炸，这正是听感上"咔"（清脆高频）与"砰"（沉闷低频）在统计量上的分野。

## 四、振动控制应用：PSD 保不住的东西

随机振动试验用 PSD（功率谱密度）做控制目标，PSD 能复现频率成分和 RMS 总级，却保不住时域的"尖峰性"。四条 PSD 几乎重合的驱动信号（RMS 同为 0.25 g），峭度从 3 到 12 不等——峭度越高的时域波形，高峰值事件越密集，对试件的疲劳损伤越狠。道路谱实测数据往往峭度大于 3（碎石路、减速带），只用高斯随机驱动等于悄悄放过了最致命的载荷。

Simcenter Testlab Random Control 的做法：Tools → Add-ins 打开 Kurtosis Control，在 Random Control Setup 里直接填 Desired Kurtosis（口径为高斯=3，可设范围 3~12）。要保护试件不被罕见极端事件打坏，再用 Sigma Clipping：默认 sigma = 20（99.999999999% 幅值通过），设成 3 则削掉峰值超 3 倍 RMS 的样本。

| 手段 | 作用 | 方向 |
| --- | --- | --- |
| **Kurtosis Control** | 复现实测路谱的尖峰密集程度 | 把峭度从 3 往上调，还原真实损伤 |
| **Sigma Clipping** | 限制驱动信号峰值/RMS 比 | 把罕见极端峰值削掉，保护功放与试件 |
| **PSD 单独使用** | 只保证频率成分与 RMS | 高斯驱动，冲击事件密度不足 |

::: tip 工程判断
- 手上有实测路谱/工况数据：先算其峭度，若明显大于 3，随机试验应开 Kurtosis Control 对齐
- 试件昂贵或不可修复：sigma clipping 收到 3~5，牺牲一点分布纯度换安全
- 诊断异响（咔哒、咔啦）：用 Throughput Processing 的滑动帧峭度超值，帧长取事件持续时间的几倍
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
rattle = gauss.copy()                       # 高斯背景 + 万分之二尖峰，模拟咔哒异响
rattle[rng.choice(N, 200, replace=False)] += 15.0

print(f"{'信号':6s} {'峭度超值':>10s} {'峰值因子':>8s} {'RMS':>7s}")
for name, s in [("正弦", sine), ("方波", square), ("高斯", gauss), ("咔哒", rattle)]:
    rms = np.sqrt(np.mean(s**2))
    crest = np.abs(s).max() / rms
    print(f"{name:6s} {kurtosis_excess(s):+10.2f} {crest:8.2f} {rms:7.2f}")
```

运行结果要点：正弦 -1.5、方波 -2.0、高斯 -0.02，与理论值逐一对上；"咔哒"信号 RMS 与纯高斯几乎没差（1.00 vs 1.00 量级），峭度超值却冲到 +47——冲击诊断的活儿就该交给它，而不是总级。

## 六、小结

峭度不是又一个"更高级的 dB"，它回答的是 RMS 和峰值都回答不了的问题：能量在时间上怎么分布。诊断侧，滑动帧峭度超值是定位咔哒、咯吱、齿轮点蚀这类冲击事件的高效工具；试验侧，Kurtosis Control + Sigma Clipping 让随机振动试验第一次能同时复现"谱形 + 冲击密度 + 安全上限"。记住两条分界线：峭度超值明显为正 → 信号含冲击成分；实测工况峭度明显大于 3 → 纯高斯随机试验欠考核。
