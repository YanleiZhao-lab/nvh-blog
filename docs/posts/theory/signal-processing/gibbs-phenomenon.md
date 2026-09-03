---
title: "吉布斯现象：为什么陡峭滤波器会振铃"
---

# 吉布斯现象：为什么陡峭滤波器会振铃

> 测量含突变（不连续）的信号——过坑洞的冲击力、换挡时的扭矩阶跃——时，时域波形在边沿附近常出现振铃（ringing）伪影：过冲（overshoot）与下冲（undershoot）围绕真实信号波动，幅度不固定，各次测量也不一致。这是吉布斯现象（Gibbs phenomenon）：有限带宽无法完整表示需要无限频率内容的信号。本文说明振铃幅度与持续时间分别由什么控制，并给出测试前的滤波器设置判据。

## 一、时域不连续需要无限频率内容

傅里叶变换的基本结论：任何信号都可以分解为一组唯一的正弦波之和，分解出的频率内容决定了信号能被重建的精确程度。

光滑信号（正弦、三角波）的频率内容有限，少数谐波即可准确描述。含突变或阶跃的信号则不同：**时域越陡，频域越宽**。以占空比 50%、幅值 $\pm 1$ 的方波为例，其傅里叶级数只含奇次谐波，幅值按 $1/k$ 衰减：

$$
x_{sq}(t) = \frac{4}{\pi}\left[\sin(2\pi f_0 t) + \frac{1}{3}\sin(6\pi f_0 t) + \frac{1}{5}\sin(10\pi f_0 t) + \cdots\right] = \frac{4}{\pi}\sum_{k \text{ odd}} \frac{1}{k}\sin(2\pi k f_0 t)
$$

其中 $f_0$ 为基频（Hz）。谐波幅值仅按 $1/k$ 衰减、级数不终止，因此理想方波需要无限带宽；理想脉冲同样如此。缺少无穷多的高次谐波，垂直的边沿就无法重建。

![常见信号的时域波形（左）与等效频率内容（右）：方波与脉冲的频谱延伸到无穷](/images/gibbs-phenomenon/fig1-signal-frequency-content.png)
*（图源：Simcenter Testing Knowledge Base）*

而任何采集系统的带宽都是有限的。用有限的频率内容去描述需要无限频率内容的信号，时域上就会在阶跃/过渡处留下振铃伪影——过冲、下冲围绕真实信号波动。这就是吉布斯现象。

![方波边沿处的吉布斯振铃：过冲与下冲围绕真实信号波动](/images/gibbs-phenomenon/fig2-ringing-square-wave.png)
*（图源：Simcenter Testing Knowledge Base）*

整车测试中这类信号常见：悬架过减速带或坑洞的冲击力、安全带张紧器点火的爆炸脉冲、变速箱换挡瞬间的作用力阶跃、关门砰击声。它们的共同点是都含突变，理论频率内容均延伸到无穷。

::: info 核心概念
- **不连续（discontinuity）**：信号幅值的突跳。它要求无限频率内容，是吉布斯现象的源头
- **吉布斯现象（Gibbs phenomenon）**：频率内容被截断后，时域信号在突变处出现的过冲/下冲振铃伪影
- **截断（truncation）**：测量带宽有限，高于带宽的谐波被丢弃
:::

一个重要的反面情形：**纯正弦信号不会出现吉布斯现象**。对单频正弦加低通滤波，只要截止频率高于信号频率，什么都不会发生——因为没有频率内容被截断。吉布斯现象只在信号的一部分频率内容被移除时才出现。

![同一组低通滤波器对方波（产生振铃）与同频正弦（无影响）的不同效果](/images/gibbs-phenomenon/fig6-sine-no-gibbs.png)
*（图源：Simcenter Testing Knowledge Base）*

## 二、振铃时长由频率截断程度决定

吉布斯振铃用两个量描述：**幅度**（过冲/下冲多大）与**持续时间**（振铃多久衰减掉）。

持续时间的控制因素是频率内容的截断程度。以方波为例：把奇次谐波截到 2000 Hz，边沿变缓、振铃出现；截到 750 Hz，更多谐波被丢弃，边沿更缓、振铃持续时间更长。

![方波频谱低通截断：截掉的谐波越多，时域振铃持续越久、边沿越缓](/images/gibbs-phenomenon/fig5-truncation-duration.png)
*（图源：Simcenter Testing Knowledge Base）*

这一规律可以从部分和（partial sum）的数学形式直接看出。只保留前 N 个奇次谐波时，重建信号为：

$$
S_N(t) = \frac{4}{\pi}\sum_{n=1}^{N} \frac{1}{2n-1}\sin\big(2\pi (2n-1) f_0 t\big), \qquad f_{max} = (2N-1)\, f_0
$$

其中 $f_0$ 为基频（Hz），$f_{max}$ 为保留到的最高谐波频率（Hz）。在上升沿附近（$t$ 很小），把谐波频率看成连续变量，做代换 $u = 2\pi f t$，离散求和可用积分近似：

$$
S_N(t) \approx \frac{2}{\pi}\int_0^{2\pi f_{max} t} \frac{\sin u}{u}\, du = \frac{2}{\pi}\, \mathrm{Si}\big(2\pi f_{max} t\big)
$$

其中 $\mathrm{Si}(x)$ 为正弦积分（sine integral）。这一步的物理意义：边沿附近的波形形状只取决于乘积 $f_{max} t$——截断频率越高，振铃在时间上被压缩得越窄，但形状（幅度）不变。

正弦积分在 $x = \pi$ 处取得最大值 $\mathrm{Si}(\pi) \approx 1.852$，而其收敛值为 $\mathrm{Si}(\infty) = \pi/2 \approx 1.571$。因此部分和在边沿后的第一个峰值为：

$$
S_{max} = \frac{2}{\pi}\, \mathrm{Si}(\pi) \approx 1.179
$$

即过冲量 $\delta = \frac{2}{\pi}\mathrm{Si}(\pi) - 1 \approx 0.179$：约为单边幅值的 17.9%，即跳变高度（幅值从 -1 跳到 +1，跳变高度为 2）的约 8.95%。关键结论是：谐波数 $N$ 增大时过冲仍收敛于该常数、不随 $N$ 减小，只是振铃区域越来越窄——这正是吉布斯现象的数学本质。

振铃的持续时间也可由 $\mathrm{Si}(x)$ 估计：其极值点位于 $x = m\pi$（$m = 1, 2, \ldots$），相邻极值间隔 $\Delta x = \pi$，换算回时间即振铃主瓣宽度：

$$
\tau_{lobe} \approx \frac{\pi}{2\pi f_{max}} = \frac{1}{2 f_{max}}
$$

即振铃时长与截断频率成反比：截到 2000 Hz 时主瓣约 0.25 ms，截到 750 Hz 时约 0.67 ms——与上图的观察一致。

用 numpy 按定义直接叠加方波谐波，保留不同数量的奇次谐波，验证边沿处的行为：

```python
import numpy as np

# 方波 = 无穷奇次谐波之和：sin(wt) + sin(3wt)/3 + sin(5wt)/5 + ...
# 只保留前 N 个奇次谐波，看边沿处会发生什么
t = np.linspace(0, 0.2, 400001, endpoint=False)
f0 = 50.0

for N in [3, 10, 100]:
    sig = np.zeros_like(t)
    for k in range(1, 2 * N, 2):          # 1,3,5,... 奇次谐波
        sig += np.sin(2 * np.pi * f0 * k * t) / k
    sig *= 4.0 / np.pi                     # 归一化：高电平 = 1.0
    fmax = f0 * (2 * N - 1)                # 保留到的最高频率
    m = (t > 0) * (t < 2.0 / fmax)         # 边沿后的振铃窗口
    overshoot = (sig[m].max() - 1.0) * 100
    seg = sig[(t >= 0) * (t < 0.005)]      # 10%~90% 上升时间
    t10 = t[np.argmax(seg > 0.1)]
    t90 = t[np.argmax(seg > 0.9)]
    print(f"保留 {N:3d} 个谐波(至{fmax:6.0f}Hz): 过冲 +{overshoot:.1f}% | "
          f"上升时间 {1000*(t90-t10):.3f} ms")
```

实测输出（numpy 2.4.6）：

```text
保留   3 个谐波(至  250Hz): 过冲 +18.8% | 上升时间 0.782 ms
保留  10 个谐波(至  950Hz): 过冲 +18.0% | 上升时间 0.235 ms
保留 100 个谐波(至 9950Hz): 过冲 +17.9% | 上升时间 0.023 ms
```

谐波从 3 个增加到 100 个，过冲稳定在 +18% 附近（与上节 $\delta \approx 0.179$ 的推导一致），但上升时间缩短为约 1/34、振铃衰减更快。**增加带宽改善的是振铃时长和边沿陡度，无法改变过冲幅度**；幅度由滤波器形状决定，见下一节。

::: warning 工程注意
数字采集系统里，振铃在信号各阶跃处的表现**不一致**——同一次测量，有的台阶振、有的不振，幅度也各不相同，原因是瞬态时刻与采样点的相对时序在变。因此振铃偏置无法通过标定扣除，它不可标定。吉布斯现象的影响主要在时域，频域数据基本不受影响，判读谱时不必担心它。
:::

## 三、振铃幅度由滤波器形状决定

幅度的主要控制因素是采集链路里低通滤波器（典型如抗混叠滤波器，anti-aliasing filter）的形状。**滤波器越陡，时域振铃越大**。

原因在于滤波器的时域特性：对频域形状做傅里叶反变换，得到滤波器的脉冲响应（impulse response）。频域越宽的滤波器，时域脉冲越窄；时域脉冲越短促，与信号卷积出来的振铃越突出。

极端例子是砖墙滤波器（brick-wall filter）——通带内全 1、截止点外全 0，频域里最陡的形状。取同一截止频率，对比砖墙与缓滚降高斯滤波器：

```python
import numpy as np

# 同一个方波，过两种同截止频率(2 kHz)的低通：砖墙(陡) vs 高斯缓滚降(缓)
fs = 51200
n = 2 ** 16
t = np.arange(n) / fs
sq = np.sign(np.sin(2 * np.pi * 100.0 * t))    # 幅值 ±1 的方波

freq = np.fft.rfftfreq(n, 1 / fs)
spec = np.fft.rfft(sq)
fc = 2000.0

wall = (freq <= fc).astype(float)               # 砖墙：截止点硬切
gauss = np.exp(-0.5 * (freq / (fc / 2.0)) ** 2) # 高斯：缓滚降

edge = round(0.01 * fs)                         # t = 10 ms 处的上升沿
for name, filt in [("砖墙(陡)", wall), ("高斯(缓)", gauss)]:
    rec = np.fft.irfft(spec * filt, n)
    after = rec[edge + 1 : edge + 300]          # 边沿之后：过冲
    before = rec[edge - 300 : edge]             # 边沿之前：前置振铃
    print(f"{name} 滤波: 边沿后过冲 +{(after.max()-1.0)*100:.1f}% | "
          f"边沿前下探 {before.min():.2f}（无振铃时应为 -1.00）")
```

实测输出（numpy 2.4.6）：

```text
砖墙(陡) 滤波: 边沿后过冲 +18.0% | 边沿前下探 -1.18（无振铃时应为 -1.00）
高斯(缓) 滤波: 边沿后过冲 +0.0% | 边沿前下探 -1.00（无振铃时应为 -1.00）
```

同样是 2 kHz 截止：砖墙在边沿后过冲 +18%，且在边沿**之前**就提前下探到 -1.18；高斯缓滚降则基本干净。频域形状的陡直接换算成了时域的振。

工程中对应两款经典滤波器：Bessel 与 Butterworth。两者可以设计成相同的 3 dB 截止点，但 Bessel 滚降（roll-off）更缓、Butterworth 更陡——而 Butterworth 本身就是按固定过冲特性设计的。

![Bessel 与 Butterworth 滤波器形状对比：3dB 点相同，滚降一缓一陡](/images/gibbs-phenomenon/fig7-bessel-vs-butterworth.png)
*（图源：Simcenter Testing Knowledge Base）*

![同一方波过两种滤波器：缓滚降的 Bessel 几乎无振铃，陡峭的 Butterworth 振铃明显](/images/gibbs-phenomenon/fig8-filter-shape-ringing.png)
*（图源：Simcenter Testing Knowledge Base）*

前置振铃（pre-ringing）出现与否取决于滤波器的实现方式：模拟滤波器是因果系统，脉冲响应在激励到来之前为零，不可能产生前置振铃；数字滤波器工作在零相位（zero phase）模式时——数据先正向、再反向各滤波一次以消除相位畸变——等效的非因果脉冲响应就会在突变之前留下振铃。上例中砖墙滤波在边沿前下探到 -1.18，正是这种非因果形状的表现。

![左：无前置振铃的方波；右：出现前置振铃的方波（零相位数字滤波所致）](/images/gibbs-phenomenon/fig13-pre-ringing.png)
*（图源：Simcenter Testing Knowledge Base）*

| 控制量 | 由什么决定 | 规律 |
| --- | --- | --- |
| **振铃时长** | 频率内容的截断程度 | 截掉的谐波越多，振铃持续越久、边沿越缓 |
| **振铃幅度** | 滤波器形状的陡峭程度 | 越陡振铃越大：高斯/Bessel < Butterworth < 砖墙 |
| **是否发生** | 信号本身 | 正弦类光滑信号不发生；含突变的信号才发生 |

| 特性 | **Bessel** | **Butterworth** |
| --- | --- | --- |
| **滚降** | 缓 | 陡 |
| **时域振铃** | 几乎无 | 固定过冲（设计特性） |
| **适用场景** | 时域波形保真、瞬态测量 | 频域选择性优先 |

::: tip 取舍原则
- 看时域波形、测瞬态（冲击、爆炸、阶跃）：选缓滚降滤波（Bessel、低阶）
- 看频谱、对抗混叠要求高：陡峭滤波器没有问题，吉布斯主要影响时域而非频域
- 两者都要：带宽留足余量（少截谐波、缩短振铃时长）+ 入口加缓滚降低通（压低振铃幅度）
:::

## 四、Simcenter Testlab 中的对策

SCADAS 默认的抗混叠滤波器很陡，遇到方波类信号振铃明显。Testlab 支持在通道设置里给输入信号追加一个低通 Bessel 滤波器，把吉布斯现象大幅压低。

开启路径：Channel Setup 工作表，进入 **Tools 菜单的 Channel Setup Visibility**，把 `LPCutoff`、`LPFilterCharacteristics`、`LPFilterOn`、`LPFilterOrder` 四个字段 Add 进可见列。

| 参数 | 含义 | 工程建议 |
| --- | --- | --- |
| **LPCutoff** | 低通截止频率 | 经验法则：取采样率的 1/10 |
| **LPFilterCharacteristics** | 滤波器特性 | 选 Bessel（滚降缓） |
| **LPFilterOn** | 滤波开关 | ON |
| **LPFilterOrder** | 滤波器阶数 | 越低越缓，2 阶是最缓档 |

![方波信号：默认抗混叠滤波(红)振铃明显，追加二阶 Bessel(绿)后大幅收敛](/images/gibbs-phenomenon/fig12-testlab-bessel.png)
*（图源：Simcenter Testing Knowledge Base）*

注意这套低通设置依赖硬件支持——Simcenter SCADAS 的 VB8-E 与 V8-E 系列采集卡可用，其他卡型请查产品资料页或咨询本地支持。

::: warning 工程注意
追加低通会滤除高频段的真实内容，带宽损失需要计入。设置 LPCutoff 前先确认关心的最高频率（例如悬架冲击力谱常在 1~2 kHz 以上仍有能量），截止频率不应随意压到分析带宽以内。
:::

::: info 补充：ADC 类型与吉布斯无关
Sigma-Delta 型模数转换器常配很陡的抗混叠滤波器，容易让人把振铃归因于转换器类型。实际上陡峭滤波器并不是 Sigma-Delta 的固有属性——无论 SAR 还是 Sigma-Delta 转换器都可以配缓滚降滤波器；决定吉布斯振铃的是滤波器形状，而不是 ADC 类型。对已含振铃的采集后数据，事后追加低通滤波同样可以消除该现象。
:::

## 五、小结

三条判断要点：

1. **先看信号**：正弦类光滑信号不受影响，不会出现吉布斯现象；含突变/阶跃的瞬态信号（冲击、爆炸、换挡、砰击）才需要关注。
2. **时域判读注意**：突变附近约 9% 量级的过冲（相对跳变高度，数学上收敛于 8.95%）是正常物理现象，不是传感器或安装问题；且各阶跃处表现不一致，不可标定扣除。频域数据基本不受影响。
3. **压振铃靠形状、不靠带宽**：加带宽只缩短振铃时长（主瓣宽度约 $1/(2 f_{max})$），幅度基本不变；要压幅度需用缓滚降滤波器——Testlab 里开 2 阶 Bessel，截止频率按采样率的 1/10 取，前提是硬件（VB8-E/V8-E 系列）支持。
