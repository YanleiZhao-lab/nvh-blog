---
title: "功率谱密度 PSD：随机信号为什么必须用它"
---

# 功率谱密度 PSD：随机信号为什么必须用它

> 同一段路噪数据，用 1 Hz 分辨率测出来是 0.0005 g²，用 8 Hz 测出来是 0.004 g²，差了 8 倍——两台设备谁都没错，错的是拿 Autopower 对比随机信号。PSD 用一步“除以频率分辨率”把这个坑填平。这篇讲清 PSD 的单位 g²/Hz 为什么长这样、正弦信号为什么是反例，以及规范里 PSD 曲线怎么读出总均方根值。

## 一、问题从哪来：同一根轴，测出三个“正确”答案

整车耐久试验里，底盘测点采集同一段随机振动数据，三次数采只改一个参数——频率分辨率：第一次 1 Hz，第二次 4 Hz，第三次 8 Hz。回到办公室甴出自功率谱（Autopower），三条曲线的幅值差得离谱：8 Hz 的最高，1 Hz 的最低，看着像三次完全不同的测量。

![三份相同宽带数据在不同频率分辨率下的自功率谱](/images/psd-explained/autopower-df.png)
*（图源：Simcenter Testing Knowledge Base）*

三条曲线其实都对。把任意一条做 RMS 求和（幅值平方 × 分辨率，逐线累加后开方），三个总 RMS 一模一样；缩到 2000–4000 Hz 做局部 RMS，也一样。能量总量守恒，变的只是它被切分的方式。

::: info 核心概念
- **谱线（Spectral Line）**：频域里的离散采样点，条数 = 带宽 ÷ 频率分辨率，比如 6000 Hz 带宽、1 Hz 分辨率就是 6000 条
- **RMS 求和（RMS Summation）**：把带内每条谱线的功率（幅值² × Δf）加起来开方，得到该频段的均方根值——它对分辨率不敏感
- **功率谱密度（PSD, Power Spectral Density）**：把 Autopower 幅值除以频率分辨率 Δf，单位变成 g²/Hz，让不同分辨率的随机数据可以直接叠加对比
:::

## 二、物理本质：一壶饮料怎么分杯子

知识库里的“派对类比”值得消化一遍：信号总能量是一壶饮料，谱线是杯子。随机信号的能量在频域里摊得很开，1 Hz 分辨率给了 6000 个杯子，每个杯子里只分到一点；8 Hz 分辨率只有 750 个杯子，每杯自然多。杯子数量变了，饮料总量没变。

正弦信号正好相反——所有饮料倒进同一个杯子。200 Hz 正弦波无论用 1 Hz、4 Hz 还是 8 Hz 分辨率，能量都集中在 200 Hz 那一根谱线上（200 恰好被三者整除），杯子里的水位不随杯子总数变化。

这一正一反，决定了 PSD 与 Autopower 的分工。

## 三、PSD 做了什么：一步除法，单位变 g²/Hz

PSD 的定义动作很朴素：把 Autopower 每条谱线的幅值（按惯例已是平方量）除以频率分辨率 Δf。

- 1 Hz 分辨率：幅值除以 1，不变
- 4 Hz 分辨率：幅值除以 4
- 8 Hz 分辨率：幅值除以 8

除完之后，三条分辨率不同的曹线幅值几乎重合——这才是随机信号该有的“长相”。

![相同数据转成 PSD 后三条曲线重合](/images/psd-explained/psd-df.png)
*（图源：Simcenter Testing Knowledge Base）*

单位 g²/Hz 拆开读就是它的全部含义：g² 是功率量纲（幅值的平方），/Hz 表示“每 1 Hz 带宽内的功率”——密度。一条 PSD 曱线下的面积（g²/Hz × Hz = g²）开方就是该频段的 RMS。规范里典型的道路谱 PSD 曲线，读图方法就是分段面积累加。

```python
import numpy as np

rng = np.random.default_rng(7)
fs = 4096                        # 采样率 4096 Hz
x = rng.standard_normal(fs*4)    # 4 秒高斯白噪声，sigma=1 g
x -= x.mean()

def autopower(x, fs, df):
    # 按分辨率 df 分块平均的自功率谱（单边，g2，已归一化）
    N = fs // df                 # 每块样本数
    nblk = len(x) // N           # 平均块数
    seg = x[:nblk*N].reshape(nblk, N)
    G = (np.abs(np.fft.rfft(seg, axis=1))**2).mean(axis=0) * 2 / N**2
    G[0] /= 2                    # 直流分量无双边镜像
    return np.fft.rfftfreq(N, 1/fs), G

# 同一份数据，只改频率分辨率
for df in (1, 4, 8):
    f, G = autopower(x, fs, df)
    band = (f >= 500) * (f <= 3500)      # 500~3500 Hz 频带
    rms = np.sqrt(G[band].sum())         # 带内 RMS
    print("df=%2d Hz  Autopower均值=%9.6f g2   PSD均值=%9.6f g2/Hz   带内RMS=%.4f g"
          % (df, G[band].mean(), G[band].mean()/df, rms))
```

运行结果要点：Autopower 均值从 0.000483 涨到 0.003870 g²，随分辨率变粗翻 8 倍；除以各自的 Δf 后 PSD 均值稳定在 0.000483 g²/Hz 一位都不差，带内 RMS 三次都是 0.866 g 左右——能量守恒看得见。

## 四、正弦信号是反例：PSD 会把它“压扁”

把上面的白噪声换成 200 Hz 正弦波再跑一遍，结论全部反转：Autopower 峰值不随分辨率变化（三次都是 0.7071 g RMS），PSD 峰值反而被除以 Δf，从 0.5 一路跌到 0.0625 g²/Hz。

```python
import numpy as np

fs = 4096
t = np.arange(fs*4) / fs
x = np.sin(2*np.pi*200*t)        # 200 Hz 正弦，峰值 1 g，RMS = 0.707 g

def autopower(x, fs, df):
    N = fs // df
    nblk = len(x) // N
    seg = x[:nblk*N].reshape(nblk, N)
    G = (np.abs(np.fft.rfft(seg, axis=1))**2).mean(axis=0) * 2 / N**2
    G[0] /= 2
    return np.fft.rfftfreq(N, 1/fs), G

for df in (1, 4, 8):
    f, G = autopower(x, fs, df)
    k = 200 // df                        # 200 Hz 所在谱线
    rms = np.sqrt(G.sum())               # 全带 RMS
    print("df=%2d Hz  Autopower峰值=%.4f g   PSD峰值=%.4f g2/Hz   全带RMS=%.4f g"
          % (df, np.sqrt(G[k]), G[k]/df, rms))
```

运行结果要点：正弦的 Autopower 峰值三次都是 0.7071 g 稳如磐石，PSD 峰值却被分辨率除出 8 倍差距——随机信号里 PSD 的美德，到正弦这里全变成失真。

![200 Hz 正弦转 PSD 后幅值随分辨率变化](/images/psd-explained/psd-sine.png)
*（图源：Simcenter Testing Knowledge Base）*

| 信号类型 | Autopower 随 Δf | PSD 随 Δf | 工程用途 |
| --- | --- | --- | --- |
| **宽带随机**（路噪、风噪） | 幅值差数倍，不可直接对比 | 幅值一致，可叠加对比 | **用 PSD**：随机振动耐久规范、台架路谱复现 |
| **正弦/周期**（发动机谐波、齿轮启合） | 幅值稳定 | 幅值随 Δf 漂移 | **用 Autopower**：阶次、谐波幅值判读 |
| **瞬态**（关门声、冲击） | 与分辨率和时间都相关 | 仍与采集时长相关 | 用 ESD：再乘采样时长，分析单事件总能量 |

::: warning 两个高频坑
- **跨数据对比先对格式**：两次测量的谱类型（Linear/Power/PSD/ESD）和幅值模式（Peak/RMS/Peak-Peak）不一致，幅值差 2 倍、4 倍甚至 8 倍都不奇怪——先查格式再谈数据。Testlab 里右键纵轴 → Processing 可改幅值模式，Navigator 工具栏的 FFT Format Conversion 按钮可在 Linear/Power/PSD/ESD 之间互转，但**分辨率转不了**，要改分辨率只能回到时域原始数据重算
- **PSD 里读正弦谐波的绝对值没有意义**：发动机 2 阶、4 阶这类线谱进了 PSD 会被 Δf 除小，分辨率一改数值就变。路谱里混着正弦分量时，判断某根尖峰是随机还是正弦，改一次分辨率看幅值变不变即可
:::

## 五、小结

选函数之前先问一句：这个信号是摊开的还是集中的？

- 能量摊在频段上（路噪、风噪、怠速方向盘抖动）→ PSD，g²/Hz 是唯一能跨分辨率对比、能写进规范的表述
- 能量集中在单根谱线（阶次谐波、共振正弦）→ Autopower，幅值即真相
- 分不清就动一下分辨率：幅值跟着变的是随机信号该用 PSD，不变的是正弦该用 Autopower
- 任何谱先做 RMS 求和庆对比总量——这是唯一对分辨率、对格式都免疫的判据
