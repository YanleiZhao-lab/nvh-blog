---
title: "功率谱密度 PSD：随机信号为什么必须用它"
---

# 功率谱密度 PSD：随机信号为什么必须用它

> 同一段路噪数据，用 1 Hz 分辨率测出来是 0.0005 g²，用 8 Hz 测出来是 0.004 g²，差了 8 倍——两台设备谁都没错，差异来自用 Autopower 直接对比随机信号。PSD 通过一次除以频率分辨率的归一化消除这一依赖。本文说明 PSD 的单位 g²/Hz 的由来、正弦信号为什么是反例，以及规范中 PSD 曲线如何读出总均方根值。

## 一、问题从哪来：同一根轴，测出三个“正确”答案

整车耐久试验里，底盘测点采集同一段随机振动数据，三次数采只改一个参数——频率分辨率（Frequency Resolution，Δf）：第一次 1 Hz，第二次 4 Hz，第三次 8 Hz。回到办公室调出自功率谱（Autopower），三条曲线的幅值差异明显：8 Hz 的最高，1 Hz 的最低，初看像三次完全不同的测量。

![三份相同宽带数据在不同频率分辨率下的自功率谱](/images/psd-explained/autopower-df.png)
*（图源：Simcenter Testing Knowledge Base）*

三条曲线其实都对。把任意一条做 RMS 求和（幅值平方 × 分辨率，逐线累加后开方），三个总 RMS 一模一样；缩小到 2000–4000 Hz 做局部 RMS，结果也一样。能量总量守恒，变的只是它被切分的方式。


这一现象的根源在于谱线数量。带宽 $f_{\max}$ 的分析中，谱线条数由带宽除以频率分辨率给出：

$$
N = \frac{f_{\max}}{\Delta f}
$$

物理意义：谱线是频域的离散采样点，$N$ 为条数。1 Hz 分辨率对应 6000 条谱线，8 Hz 分辨率只有 750 条。随机信号的能量摊在整个频段上，谱线越多，每条线分到的功率越少——单条谱线的幅值是谱线数量的函数，而非信号能量本身的属性。

::: info 核心概念
- **谱线（Spectral Line）**：频域里的离散采样点，条数 = 带宽 ÷ 频率分辨率，比如 6000 Hz 带宽、1 Hz 分辨率就是 6000 条
- **RMS 求和（RMS Summation）**：把带内每条谱线的功率（幅值² × Δf）加起来开方，得到该频段的均方根值——它对分辨率不敏感
- **功率谱密度（PSD, Power Spectral Density）**：把 Autopower 幅值除以频率分辨率 Δf，单位变成 g²/Hz，让不同分辨率的随机数据可以直接叠加对比
:::

## 二、物理本质：能量总量与切分方式

知识库里的“派对类比”可以说明这一关系：信号总能量是一壶饮料，谱线是杯子。随机信号的能量在频域里摊得很开，1 Hz 分辨率给了 6000 个杯子，每个杯子里只分到一点；8 Hz 分辨率只有 750 个杯子，每杯分到的自然更多。杯子数量变了，饮料总量没变。

正弦信号正好相反——所有饮料倒进同一个杯子。200 Hz 正弦波无论用 1 Hz、4 Hz 还是 8 Hz 分辨率，能量都集中在 200 Hz 那一根谱线上（200 恰好被三者整除），杯子里的水位不随杯子总数变化。

这一正一反，决定了 PSD 与 Autopower 的分工。

## 三、PSD 的定义：除以频率分辨率，单位变 g²/Hz

PSD 的定义动作：把 Autopower 每条谱线的幅值（按惯例已是平方量）除以频率分辨率 Δf。


$$
\mathrm{PSD}(f_k) = \frac{G_{xx}(f_k)}{\Delta f}
$$

物理意义：$G_{xx}(f_k)$（单位 g²）是第 $k$ 条谱线的自功率幅值，除以 $\Delta f$（单位 Hz）后得到“每 1 Hz 带宽内的功率”，即密度。按此定义：

- 1 Hz 分辨率：幅值除以 1，不变
- 4 Hz 分辨率：幅值除以 4
- 8 Hz 分辨率：幅值除以 8

除完之后，三条分辨率不同的谱线幅值几乎重合——这才是随机信号在密度表述下的正常形态。

![相同数据转成 PSD 后三条曲线重合](/images/psd-explained/psd-df.png)
*（图源：Simcenter Testing Knowledge Base）*

单位 g²/Hz 拆开读就是它的全部含义：g² 是功率量纲（幅值的平方），/Hz 表示“每 1 Hz 带宽内的功率”——密度。

PSD 曲线在频带 $[f_1, f_2]$ 内的面积（g²/Hz × Hz = g²）开方就是该频段的 RMS：

$$
x_{\mathrm{rms}} = \sqrt{\sum_{f_1 \le f_k \le f_2} \mathrm{PSD}(f_k) \cdot \Delta f}
$$

物理意义：把每条谱线的功率密度乘回 $\Delta f$ 恢复为该线的功率，逐线累加得到带内总功率，开方得到均方根值。规范里典型的道路谱 PSD 曲线，读图方法就是分段面积累加。

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

运行结果要点：Autopower 均值从 0.000483 g² 增大到 0.003870 g²，随分辨率变粗增大 8 倍；除以各自的 Δf 后 PSD 均值稳定在 0.000483 g²/Hz 附近，带内 RMS 三次都在 0.866 g 左右——能量守恒得到数值验证。

## 四、正弦信号是反例：PSD 幅值随分辨率漂移

把上面的白噪声换成 200 Hz 正弦波再跑一遍，结论全部反转：Autopower 峰值不随分辨率变化（三次都是 0.7071 g RMS），PSD 峰值反而被除以 Δf，从 0.5 g²/Hz 一路降到 0.0625 g²/Hz。

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

运行结果要点：正弦的 Autopower 峰值三次都是 0.7071 g，保持不变；PSD 峰值则被分辨率除出 8 倍差距。用公式表达：设正弦的 RMS 为 $A$，其全部功率集中在单根谱线上，PSD 峰值为

$$
\mathrm{PSD}_{\mathrm{peak}} = \frac{A^2}{\Delta f}
$$

物理意义：分子 $A^2$ 固定，分母 $\Delta f$ 从 1 Hz 增到 8 Hz，峰值就缩小 8 倍——这正是上表“PSD 幅值随 Δf 漂移”的定量来源，也说明随机信号里 PSD 的分辨率无关性到正弦这里变成幅值失真。

![200 Hz 正弦转 PSD 后幅值随分辨率变化](/images/psd-explained/psd-sine.png)
*（图源：Simcenter Testing Knowledge Base）*

尽管 PSD 峰值漂移，正弦信号 PSD 的 RMS 求和结果仍然不变——RMS 求和会自动把每条谱线的密度乘回 $\Delta f$ 再累加，补偿除以频率分辨率的操作。这也是手册建议“评估任何谱函数都先看 RMS 求和”的原因。

| 信号类型 | Autopower 随 Δf | PSD 随 Δf | 工程用途 |
| --- | --- | --- | --- |
| **宽带随机**（路噪、风噪） | 幅值差数倍，不可直接对比 | 幅值一致，可叠加对比 | **用 PSD**：随机振动耐久规范、台架路谱复现 |
| **正弦/周期**（发动机谐波、齿轮啮合） | 幅值稳定 | 幅值随 Δf 漂移 | **用 Autopower**：阶次、谐波幅值判读 |
| **瞬态**（关门声、冲击） | 与分辨率和时间都相关 | 仍与采集时长相关 | 用 ESD（能量谱密度，Energy Spectral Density）：PSD 再乘采样时长，分析单事件总能量 |

::: warning 两个常见误判
- **跨数据对比先对格式**：两次测量的谱类型（Linear/Power/PSD/ESD）和幅值模式（Peak/RMS/Peak-Peak）不一致，幅值差 2 倍、4 倍甚至 8 倍都不奇怪——先查格式再谈数据。Testlab 里右键纵轴 → Processing 可改幅值模式，Navigator 工具栏的 FFT Format Conversion 按钮可在 Linear/Power/PSD/ESD 之间互转，但**分辨率转不了**，要改分辨率只能回到时域原始数据重算
- **PSD 里读正弦谐波的绝对值没有意义**：发动机 2 阶、4 阶这类线谱进了 PSD 会被 Δf 除小，分辨率一改数值就变。路谱里混着正弦分量时，判断某根尖峰是随机还是正弦，改一次分辨率看幅值变不变即可
:::

## 五、小结

选函数之前先问一句：这个信号是摊开的还是集中的？

- 能量摊在频段上（路噪、风噪、怠速方向盘抖动）→ PSD，g²/Hz 是唯一能跨分辨率对比、能写进规范的表述
- 能量集中在单根谱线（阶次谐波、共振正弦）→ Autopower，幅值即判据
- 无法判断时改变一次频率分辨率：幅值随之变化的是随机信号，应使用 PSD；幅值不变的是正弦信号，应使用 Autopower
- 任何谱先做 RMS 求和再对比总量——这是唯一对分辨率、对格式都免疫的判据
