---
title: "谱与自功率谱的区别"
---

# 谱与自功率谱的区别

> Simcenter Testlab 中 Spectrum 与 Autopower 的数学差别只是一个复共轭乘法，但多次平均之后两者的结果差异显著：一个幅值逐次衰减，一个稳定收敛。本文说明两者的数学关系、相位在平均中扮演的角色，以及各使用场景下的函数选择方法——包括 ODS 分析中幅值与相位需要兼得时使用的相位参考谱（Phase Referenced Spectrum）。

## 一、问题从哪来

在 Testlab 中新建测量时，Function 一栏的下拉菜单里同时提供 Spectrum 和 Autopower 两个选项。刚上手的工程师往往不加区分地任选其一，因为两者输出的都是"幅值-频率"曲线，外观相近。

单次测量、不加平均时，两者的幅值部分完全相同，唯一区别是 Spectrum 带相位、Autopower 相位恒为零。两者的实质差异出现在**多次平均**：同一个宽带随机信号，用 Autopower 平均 10 次、25 次、100 次，幅值波动越来越小、总量不变；用 Spectrum 平均，幅值随平均次数**逐渐降低**。

这不是软件缺陷，而是相位在复数平均中互相抵消的必然结果。

::: info 核心概念
- **谱（Spectrum, Sx）**：FFT 输出的复数函数，每根谱线都有幅值和相位（a+ib 形式），只保留 0 Hz 以上的单边（single-sided）部分
- **自功率谱（Autopower, Gxx）**：谱乘以自身的复共轭（complex conjugate）Gxx = Sx · Sx*，相位被消去，只剩幅值信息，单位变为原单位的平方（如 g²）
- **自功率线性（Autopower Linear）**：对 Gxx 开平方，恢复线性单位（如 g），"Linear"即指开过方
:::

## 二、相位：被丢弃的那一半信息

FFT 把时域信号分解成一组唯一的正弦波，每根正弦波除幅值外还有相位——相位相对于时间块（time block）起点计量。两个幅值相同、相位差 45° 的正弦波，在时域波形上一目了然；做 FFT 后，Spectrum 能把 45° 的差别原样保留，Autopower 则完全无法区分两者。

对纯幅值分析（例如查看某阶次的转速跟踪水平、比较隔振前后的振动量级），相位是冗余信息，丢弃无损。但一旦涉及**多通道联合分析**——运行振型分析（ODS, Operational Deflection Shape）、传递路径分析（TPA, Transfer Path Analysis）、模态分析——相位就是核心数据：不知道两个测点振动的相对相位，就无法绘制结构的振型，也找不到振动抵消或叠加的来源。

![Spectrum 保留相位，Autopower 相位恒为零](/images/spectrum-vs-autopower/fig2-bode.png)
*（图源：Simcenter Testing Knowledge Base）*

## 三、数学上差一步：复共轭乘法

数字信号处理中 FFT 先得到双边谱（double-sided spectrum，关于 0 Hz 镜像），折叠成单边谱后就是 Spectrum——复数形式，幅值与相位兼备。对第 k 根谱线：

$$S_x(f_k) = a_k + i\,b_k = \left|S_x(f_k)\right| \, e^{\,i\phi_k}$$

其中 $a_k$、$b_k$ 分别为实部与虚部（单位与输入一致，如 g），$\left|S_x(f_k)\right|=\sqrt{a_k^2+b_k^2}$ 为幅值，$\phi_k$ 为相位（rad 或 °）。每个频率处的幅值与相位由 FFT 唯一确定，使全部正弦波之和等于原信号。

Autopower 在此基础上多做一步：在每个频率线上，用谱乘以它自己的复共轭：

$$G_{xx}(f_k) = S_x(f_k) \cdot S_x^{*}(f_k)$$

把复数形式代入并展开，分步推导：

$$G_{xx}(f_k) = (a_k + i\,b_k)(a_k - i\,b_k) = a_k^2 + b_k^2$$

- 复数乘以自己的共轭，交叉项 $+i\,a_k b_k$ 与 $-i\,a_k b_k$ 相消，虚部归零；
- 结果 $a_k^2+b_k^2$ 为实数且恒非负——这就是 Autopower 的相位处处为零的原因：$\phi_G = \arctan\!\big(0\,/\,(a_k^2+b_k^2)\big) = 0$；
- 代价是单位被平方：输入单位 g，输出 g²（功率单位）。

工程上习惯再开根号恢复线性单位，即 Autopower Linear：

$$G_{xx}^{\mathrm{lin}}(f_k) = \sqrt{G_{xx}(f_k)} = \left|S_x(f_k)\right|$$

开方后幅值与 Spectrum 的幅值完全一致，差异只在相位：$S_x$ 是复数，$G_{xx}^{\mathrm{lin}}$ 是纯实数。

```python
import numpy as np

fs, N = 1024, 1024
t = np.arange(N) / fs
x = 2.5 * np.cos(2*np.pi*80*t + np.deg2rad(30))      # 80 Hz，幅值 2.5 g，初相 30 度
X = np.fft.fft(x)[:N//2]                             # 单边复数谱（含相位）
Gxx = X * np.conj(X)                                 # 自功率 = 谱 × 其共轭
k = int(80 * N / fs)                                 # 80 Hz 所在谱线

print(f"谱      ：幅值 {np.abs(X)[k]*2/N:.3f} g，相位 {np.degrees(np.angle(X[k])):.0f} 度")
print(f"自功率  ：{Gxx[k].real:,.0f} g2，相位 {np.degrees(np.angle(Gxx[k])):.0f} 度")
print(f"自功率线性：{np.sqrt(Gxx[k].real)*2/N:.3f} g   <- 幅值恢复，相位归零")
```

运行结果要点：谱读出幅值 2.500 g、相位 30 度；乘完复共轭后相位精确归零、单位变 g 的平方；开方后幅值 2.500 g 原样恢复——一步乘法，相位信息就此消失。

## 四、平均：实质性差异在这里

设想两帧信号：同一个正弦波，第二帧与第一帧相位差 180 度。

时域直接平均，正负抵消，结果为零。频域用 Spectrum 平均结果相同——对 M 帧复数谱逐线取平均时，

$$\bar{S}(f_k) = \frac{1}{M}\sum_{m=1}^{M} S_x^{(m)}(f_k)$$

实部与虚部各自相加。以上述两帧为例，设 $S_x^{(1)} = A$、$S_x^{(2)} = A\,e^{\,i\pi} = -A$，则 $\bar{S} = (A-A)/2 = 0$，完全抵消。宽带随机信号没有这么极端，但原理相同：每帧相位不一致，复数平均后幅值逐次衰减，平均次数越多降低越明显。

Autopower 为什么不受影响？复共轭乘法等价于对信号"取平方"——正弦波平方后全为正，不可能互相抵消：

$$\bar{G}_{xx}(f_k) = \frac{1}{M}\sum_{m=1}^{M} \left|S_x^{(m)}(f_k)\right|^2 = \frac{A^2 + A^2}{2} = A^2$$

手册中的对比图直观展示了这一点：两条反相正弦波平方后完全重合，平均之后幅值分毫未变。

![反相正弦波平方后全为正，无法互相抵消](/images/spectrum-vs-autopower/fig8-square.png)
*（图源：Simcenter Testing Knowledge Base）*

宽带随机数据的实测效果：10/25/100 次平均，Autopower 谱形越来越光滑、总幅值稳定；Spectrum 幅值则持续降低。

![宽带随机信号平均 10/25/100 次：Autopower 越平均越稳，Spectrum 越平均越小](/images/spectrum-vs-autopower/fig9-averaging.png)
*（图源：Simcenter Testing Knowledge Base）*

```python
import numpy as np

fs, N = 1024, 1024
t = np.arange(N) / fs
f = 100.0                                            # 恰好落在频率线上
s1 = np.sin(2*np.pi*f*t)                             # 第1帧：相位 0 度
s2 = np.sin(2*np.pi*f*t + np.pi)                     # 第2帧：相位 180 度
X1, X2 = np.fft.fft(s1), np.fft.fft(s2)              # 复数谱（含相位）
k = int(N * f // fs)                                 # 峰值所在谱线

spec_avg = np.abs((X1 + X2) / 2) * 2 / N             # 复数谱先平均再取模
auto_avg = np.sqrt((np.abs(X1)**2 + np.abs(X2)**2) / 2) * 2 / N  # 自功率先平均再开方

print("真实幅值：1.0000 g")
print(f"复数谱平均 2 帧：{spec_avg[k]:.4f} g   <- 相位互相抵消")
print(f"平均自功率谱开方：{auto_avg[k]:.4f} g   <- 幅值不受影响")
```

运行结果要点：真实幅值 1 g 的信号，复数谱两帧平均后读数 0.0000 g——完全抵消；自功率谱平均后开方仍是 1.0000 g。这是"函数选择错误时平均幅值完全丢失"的极端演示。

::: warning 工程注意
对随机信号做谱平均时选 Spectrum，平均次数越多幅值越低——这不是测量问题，而是函数选错。除非用触发（trigger）或类似措施保证每帧相位一致，否则应避免 Spectrum 与平均同时使用。ODS/TPA 等既需要相位又需要平均的场合，使用相位参考谱。
:::

## 五、既要相位又要平均：相位参考谱

ODS 分析要绘制结构振型，相位必不可少；现场数据又必须平均抑制噪声。Spectrum 保留相位但平均后幅值失真，Autopower 平均稳定但相位已被消去——单独使用任何一个都无法同时满足要求。

出路在于更换相位基准。Spectrum 的相位相对于**每次采集的起点**，起点随机导致每帧相位不一致。而振动结构上不同测点之间的**相对相位**由结构本身决定，每次采集都固定：手册示例中 plate 15:Z 与 plate 13:Z 始终相差 180 度，与采集何时开始无关。

相位参考谱（Phase Referenced Spectrum）的做法：指定一个活跃通道作参考，每次采集后、在每个频率线上，把参考通道的相位旋到零，其他所有通道旋转同样的角度：

$$\hat{S}_x^{(m)}(f_k) = S_x^{(m)}(f_k)\cdot e^{-\,i\,\phi_{\mathrm{ref}}^{(m)}(f_k)}$$

其中参考通道相位取自该帧、该谱线上参考通道复数谱的辐角：$\phi_{\mathrm{ref}}^{(m)}(f_k) = \arg\left[S_{\mathrm{ref}}^{(m)}(f_k)\right]$。

旋转后参考通道自身相位为零，各通道之间的相对相位保持不变；基准统一后，各帧数据变得一致，平均即可正确进行。注意两点：该操作对每根谱线独立执行、每次采集后单独执行；被减去的相位可以是任意角度（33 度、48 度、56 度等），并不限于 0、90、180 度。

![相位参考把各帧不一致的数据变为一致，从而可以正确平均](/images/spectrum-vs-autopower/fig12-phase-ref.png)
*（图源：Simcenter Testing Knowledge Base）*

::: tip 参考通道选择
- 必须选**结构上振动活跃**的通道，如发动机缸体、变速箱壳体测点
- 不要选振动微弱的通道（例如实验室地板上的测点）——信噪比差，参考相位本身不可靠；手册明确指出：参考通道若在实验室地板上，而数据通道在车辆上，相位参考将失效
- 参考通道与被平均通道之间无固定相位关系的成分（如互不相关的随机振动）会在平均中被削弱，因此相位参考谱与 Autopower 的幅值未必完全一致
:::

Testlab 中的设置：Measurement Function 选 Spectrum，勾选 Phase Referenced Spectrum，在 References 下点击 Define 按钮指定单一参考通道。

![Simcenter Testlab 中 Phase Referenced Spectrum 的设置界面](/images/spectrum-vs-autopower/fig13-prs-settings.png)
*（图源：Simcenter Testing Knowledge Base）*

## 六、怎么选：按需求对号入座

| 需求 | 推荐函数 | 原因 |
| --- | --- | --- |
| **只看幅值，需平均** | **Autopower（Linear）** | 相位消去，平均稳定收敛 |
| **幅值+相位，单次测量** | Spectrum | 无平均，幅值相位都可靠 |
| **幅值+相位，需平均（ODS/TPA）** | 相位参考谱 Spectrum | 参考通道统一相位基准 |
| **比较不同分辨率的谱** | Autopower + RMS 总量 | 谱线幅值随分辨率变化，RMS 总和不变 |

分辨率的影响单独说明：同一宽带信号分别用 1 Hz 与 8 Hz 分辨率测量（带宽 6000 Hz 时分别对应 6000 条与 750 条谱线），谱线数越多，分摊到每根谱线上的能量越少、单线幅值越低——三种结果都正确，全频段 RMS 总和完全一致。横向对比时要么统一分辨率，要么比较 RMS 总量。

| 特性 | Spectrum | Autopower |
| --- | --- | --- |
| 幅值 | 有 | 有 |
| 相位 | **有** | 无（恒为零） |
| 单位 | 原单位（g） | 平方单位（g 的平方），Linear 版恢复 g |
| 多帧平均 | **幅值衰减** | 幅值稳定收敛 |
| 典型用途 | ODS、TPA、模态 | 阶次分析、水平监测、谱形对比 |

## 七、小结

只要幅值，用 Autopower——平均越多越准。要相位，用 Spectrum，但平均前必须用触发等措施保证相位一致，否则幅值不可信；既要相位又要平均，用相位参考谱，参考通道选结构上振动最活跃的点。分辨率不同的谱不比较谱线幅值，比较 RMS 总量。
