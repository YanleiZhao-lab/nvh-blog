---
title: "窗函数修正系数：幅值校正 vs 能量校正"
---

# 窗函数修正系数：幅值校正 vs 能量校正

> 加窗在抑制泄漏（leakage）的同时，也会同时压缩信号的谱线幅值与能量。窗函数修正系数（window correction factor）通过在频域对每条谱线乘一个由窗类型决定的固定系数来补偿这种失真，但幅值校正（amplitude correction）与能量校正（energy correction）的系数并不相等——汉宁窗的幅值修正系数为 2.00，能量修正系数为 1.633，同一条谱线只能取其一。本文从汉宁窗的定义出发分步推导两种系数，给出 Simcenter Testing Knowledge Base 与 LMS 理论手册的完整系数表，说明 Simcenter Testlab 中的设置位置，以及 RMS 计算在后台自动换用能量校正值的行为。

## 一、加窗的代价：幅值与能量同时被压缩

用汉宁窗抑制泄漏是正确的选择，但这一操作本身会引入新的失真。时域上信号乘以窗函数，相当于对样本施加中间高、两端为零的权重：信号的峰值（幅值）与曲线下的面积（能量）同时被削减。

![信号（蓝）乘以汉宁窗（绿）后，幅值与能量同时被压缩（红）](/images/window-correction-factors/fig1-hann-distortion.png)

*（图源：Simcenter Testing Knowledge Base）*

对一个周期正弦信号加汉宁窗，谱峰幅值恰好被压缩为原来的一半。若不补偿，频谱上每条谱线都系统性偏低——做阶次切片、对标声学目标线时，该偏差会一路传递进结论。

::: info 核心概念
- **幅值失真（amplitude distortion）**：加窗后谱线峰值整体降低，「这条频率分量有多大」的读数偏小
- **能量失真（energy distortion）**：频谱曲线下的总面积（对应信号总能量/RMS）同步缩小
- **修正系数（correction factor）**：对窗后频谱的每条谱线统一乘一个固定系数，系数由窗类型决定，在频域实施
:::

## 二、两种修正系数的定义与推导

### 2.1 汉宁窗的幅值修正系数

汉宁窗的时域表达式为

$$
w(n) = \frac{1}{2}\left(1 - \cos\frac{2\pi n}{N}\right), \quad n = 0, 1, \ldots, N-1
$$

其中 $N$ 为窗长（样本数），$w(n)$ 无量纲。信号 $x(n)$ 加窗后为 $x(n)\,w(n)$。

**第一步：求窗序列的均值（相干增益，coherent gain）。**

$$
\mathrm{CG} = \frac{1}{N}\sum_{n=0}^{N-1} w(n)
= \frac{1}{2N}\sum_{n=0}^{N-1}\left(1 - \cos\frac{2\pi n}{N}\right)
= \frac{1}{2} - \frac{1}{2N}\sum_{n=0}^{N-1}\cos\frac{2\pi n}{N}
= \frac{1}{2}
$$

整周期上余弦序列的取和为零，故均值只剩 $1/2$。物理意义：窗的平均权重就是谱线幅值被缩放的倍数——这正是周期正弦加汉宁窗后谱峰减半的解析原因。

**第二步：幅值修正系数取相干增益的倒数。**

$$
K_a = \frac{1}{\mathrm{CG}} = \frac{N}{\sum_{n=0}^{N-1} w(n)} = 2.00
$$

物理意义：把被窗的平均权重压缩的谱线幅值补回原始量级。

### 2.2 汉宁窗的能量修正系数

**第一步：求加窗后信号均方值的缩放倍数（功率增益）。**

$$
\frac{1}{N}\sum_{n=0}^{N-1} w^2(n)
= \frac{1}{4N}\sum_{n=0}^{N-1}\left(1 - 2\cos\frac{2\pi n}{N} + \cos^2\frac{2\pi n}{N}\right)
= \frac{1}{4}\left(1 + \frac{1}{2}\right)
= \frac{3}{8}
$$

其中用到 $\sum\cos(2\pi n/N) = 0$ 与 $\sum\cos^2(2\pi n/N) = N/2$（整周期条件）。物理意义：窗的均方权重即信号功率被缩放的倍数——加汉宁窗后均方值缩至 37.5%。

**第二步：均方根量级缩放为其平方根。**

$$
\sqrt{\frac{3}{8}} \approx 0.612
$$

LMS 理论手册中「加窗后信号的能量仅为原信号能量的 61%」即按此均方根量级表述。

**第三步：能量修正系数。**

$$
K_e = \sqrt{\frac{N}{\sum_{n=0}^{N-1} w^2(n)}} = \sqrt{\frac{8}{3}} \approx 1.633
$$

物理意义：把被窗的均方权重压缩的能量/RMS 量级补回原始值。手册据此给出「加汉宁窗后的数据需倍乘 1.63 以校正能量」。

### 2.3 各窗型的修正系数表

Simcenter Testing Knowledge Base 的 Window Correction Factors 一文与 LMS 理论手册表 1.2 给出了一致的系数表：

| 窗类型 | 幅值修正系数 | 能量修正系数 | 典型用途（据 LMS 理论手册） |
| --- | --- | --- | --- |
| **Uniform（矩形/不加窗）** | 1.00 | 1.00 | 唯一两种系数相同的窗；瞬态信号、整周期采样 |
| **Hanning** | 2.00 | 1.63 | 随机信号的一般目的分析 |
| **Hamming** | 1.85 | 1.59 | 最高旁瓣低，适用动态范围约 50 dB |
| **Blackman** | 2.80 | 1.97 | 检测强信号中的弱分量 |
| **Kaiser-Bessel** | 2.49 | 1.86 | 区分幅值差别大的多音信号 |
| **Flattop（平顶）** | 4.18 | 2.26 | 纯音信号的精确幅值测量、系统标定 |

![Simcenter Testing Knowledge Base 给出的窗函数修正系数表](/images/window-correction-factors/fig2-correction-table.png)

*（图源：Simcenter Testing Knowledge Base）*


三点说明。其一，只有 Uniform 窗（等价于不加窗）的两种系数相同且等于 1，其余窗型两者必然不等。其二，Knowledge Base 的 RMS 计算专题文章在能量校正语境下给 Flattop 窗的系数为 2.225，与上表的 2.26 略有出入，源于 Flattop 窗定义变体的取法不同，不影响本文的方法与结论。其三，LMS 手册表 1.2 还给出重复加窗的情形：汉宁窗施加两次（x2）系数为 2.67/1.91，三次（x3）为 3.20/2.11，即修正系数取决于窗类型与施加次数。

## 三、幅值校正与能量校正只能取其一

两种失真对应两种修正系数，但 $K_a \neq K_e$，同一条谱线不可能同时乘两个系数，因此**幅值校正与能量校正只能二选一**。

选幅值校正（汉宁窗乘 2.00），谱峰回到真实值——校正后谱峰与原始信号一致；但峰值补齐后，曲线下面积随之过补偿，能量偏大。

![幅值校正（乘 2）后谱峰与原始信号一致，但曲线下面积偏大](/images/window-correction-factors/fig4-amplitude-corrected.png)

*（图源：Simcenter Testing Knowledge Base）*

改用能量校正（乘 1.633），曲线下面积与原始信号一致，总能量得到补偿；代价是谱峰只回到

$$
0.5 \times 1.633 \approx 0.816
$$

即真实峰值的 82% 左右，单条谱线的峰值读数偏低。

![能量校正（乘 1.63）后曲线下面积与原始信号一致，但谱峰偏低](/images/window-correction-factors/fig5-energy-corrected.png)

*（图源：Simcenter Testing Knowledge Base）*

两种校正的偏差可以定量给出。取两系数之比：

$$
\frac{K_a}{K_e} = \frac{2.00}{1.633} \approx 1.225
$$

::: warning 偏差的量级
用幅值校正后的频谱做能量类计算（部分频段 RMS、总声压级合成），结果系统性偏大——汉宁窗下 RMS 偏差约 +22.5%；反之，用能量校正的谱读单条谱峰，峰值偏低约 18%。该差异不是舍入误差，而是校正模式的选择问题。
:::

::: tip 选择依据
- 读单条谱线幅值（阶次幅值、峰值对标、标定）：幅值校正
- 算能量类指标（频段 RMS、声压级、PSD）：能量校正
- Simcenter Testlab 默认的 Automatic 模式即按此逻辑分配：Spectrum/Autopower/Orders 用幅值校正，Power Spectral Density 用能量校正
:::

## 四、Testlab 的设置与 RMS 计算的后台换算

在 Simcenter Testlab 中，`Tools -> Options -> General` 下的 **2D Correction Mode** 决定二维图（FrontBack、Bode、UpperLower 等）以哪种校正模式显示：

![Simcenter Testlab 中 Tools -> Options -> General 下的 2D Correction Mode 设置](/images/window-correction-factors/fig6-2d-correction-mode.png)

*（图源：Simcenter Testing Knowledge Base）*

| 选项 | 行为 |
| --- | --- |
| **Automatic**（默认） | 按数据类型自动分配：Spectrum/Autopower/Orders 用幅值校正，PSD 用能量校正 |
| **Fixed Amplitude** | 所有谱一律按幅值校正显示 |
| **Fixed Energy** | 所有谱一律按能量校正显示 |
| **Not Corrected** | 不修正，幅值是所有模式中最低的 |
| **Original** | 按采集时保存的校正模式显示 |

需要特别注意的是 RMS 计算：在图上右键 `Add Double Cursor -> X`，再 `Calculations -> RMS` 取某频段的均方根值时，**Testlab 会在后台自动把数据换算成能量校正值再计算**——即使屏幕上显示的是幅值校正的谱。按照 Knowledge Base 对 RMS 计算前提的说明，软件在后台统一完成三项换算：谱线取线性格式（功率单位先开方）、幅值格式取 RMS、以及加窗数据施加能量校正。

![幅值校正显示下，双游标间 RMS 读数仍与原始信号一致](/images/window-correction-factors/fig7-rms-identical.png)

*（图源：Simcenter Testing Knowledge Base）*

因此会出现图上「两条曲线面积明显不同、RMS 读数却相同」的现象。这不是软件缺陷，而是软件在计算中统一换用能量校正值，避免了校正模式选择不一致带来的能量偏差。若需要手工计算 RMS，必须自行完成上述三项换算。

## 五、Python 数值验证：一个系数补不齐两个量

手写汉宁窗，用周期正弦验证：幅值系数与能量系数各补偿一个量，无法同时恢复峰值与 RMS。

```python
import numpy as np

N, fs = 4096, 4096.0
t = np.arange(N) / fs
x = np.sin(2*np.pi*100.0*t)                     # 峰值 1.0 的周期正弦

w = 0.5 - 0.5*np.cos(2*np.pi*np.arange(N)/N)    # 手写汉宁窗
amp_corr = N / w.sum()                          # 幅值修正系数 Ka
eng_corr = np.sqrt(N / (w**2).sum())            # 能量修正系数 Ke
print(f"window amp corr = {amp_corr:.3f}  energy corr = {eng_corr:.3f}")

X = np.abs(np.fft.rfft(x*w)) * 2/N              # 加窗未修正的单边幅值谱
for name, k in (("raw", 1.0), ("amp", amp_corr), ("energy", eng_corr)):
    peak = X.max() * k                          # 谱线峰值
    rms  = np.sqrt(((X*k)**2).sum() / 2)        # 由全部谱线能量合成总 RMS
    print(f"{name}: peak = {peak:.4f}, rms = {rms:.4f}")
print(f"true:   peak = 1.0000, rms = {np.sqrt(np.mean(x**2)):.4f}")
```

运行结果：两个系数分别为 2.000 与 1.633，与手册一致。幅值校正把谱峰精确恢复到 1.0000，但总 RMS 为 0.8660，比真值 0.7071 偏大 22%（$2/\sqrt{8/3} \approx 1.225$）；能量校正把 RMS 恢复到 0.7071，谱峰停在 0.8165（真实峰值的 82%）。两个系数各补偿一个量，无法兼顾另一个。

## 六、小结

判据有三条：读单条谱线幅值选幅值校正，算能量与 RMS 用能量校正；Testlab 的 Automatic 默认已按数据类型分配，不应随意改为 Fixed；RMS 计算软件永远在后台换用能量校正值，图上曲线面积不同而 RMS 相同属于正常行为。手工计算 RMS 时，须自行完成「线性格式、RMS 幅值格式、能量校正」三项前置换算。
