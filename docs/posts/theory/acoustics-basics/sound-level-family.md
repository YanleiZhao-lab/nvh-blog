---
title: "声级家族全解：LAeq/LAS/LAF/SEL 各是什么"
---

# 声级家族全解：LAeq/LAS/LAF/SEL 各是什么

> 同一段枪噪声录音，声级软件可以输出 LAF、LAS、Limpulse、LAeq、SEL 五条曲线，数值各不相同，却没有一个算错。声级指标是一族量：频率计权决定哪些频率计入，时间计权决定读数跟随信号的速度，等效级把一段时间折算成单一数，暴露级把事件能量归一到 1 秒。本文逐个推导 LAF/LAS/Limpulse 的指数平均公式、LAeq 的线性能量平均、SEL/LAE 的 1 秒归一，给出各指标在 Simcenter Testlab 与 Testlab Neo 中的计算设置，以及什么时候看哪个数的选择判据。

同一辆测试车、同一段怠速录音，两位工程师报出的声级却差了 4 dB：一位读的是声级计屏幕上不断跳动的 LAF 瞬时值，另一位抄的是软件自动算出的整个工况段 LAeq。数字都对，口径不同。更常见的纠纷在单次事件上：一个关门声，用 Slow 挡测得 61 dB(A)，用 Impulse 挡测得 71 dB(A)，供应商与主机厂各执一词——差的不是测量误差，是时间计权把 50 毫秒的脉冲"摊薄"还是"抓牢"。要听懂这些数字为什么合法地不一致，得回到声级指标家族的分叉点：频率计权与时间计权两个旋钮。

## 一、为什么会有一个家族：声压级计算的两个旋钮

往下读之前先记住一件事：所有声级公式都在"平方域"干活，最后才取对数变成分贝——因为能量与声压平方成正比，平均的对象是平方，不是声压本身。这条规则会贯穿家族里的每一个公式。

在动公式之前，先用数字建立直觉：人耳听阈对应的声压是 20 微帕，约为一个大气压（100 千帕）的五十亿分之一；正常交谈约 0.02 帕，是听阈的 1000 倍；痛阈附近的锤击噪声约 20 帕，又是交谈的 1000 倍。从听得见到受不了，声压跨度 100 万倍，声压级却只从 0 dB 走到 120 dB——分贝刻度存在的理由，就是把百万倍的线性比值压成百以内的对数刻度。注意 0 dB 不是"没有声音"，而是"恰好等于参考声压"；每上升 6 dB 声压约翻一倍，每上升 20 dB 声压变 10 倍。

单看声压级定义，问题似乎已经解决，但工程现场远比一条定义复杂：同一台风机，稳态段与启停段、白天与夜间、单次冲击与长时运行，报告里需要的"那个声级数字"并不相同。标准化组织把所有自由度收敛为两组设置：频率计权决定"哪些频率算数"，时间计权决定"读数多快跟随信号"。两组设置一经组合，就长出了本文标题里的整族指标。两个真实诉求可以说明家族的必要性：环境噪声法规要的是夜间 8 小时折算成的一个等效连续级，关门声品质评价要的是单次事件抓得住峰值的脉冲读数与可跨事件比较的暴露级——同一支传声器、同一段录音，出口却必须不止一个。在进入公式之前，先把这两组旋钮各自的物理动机看清楚。

值得先留意"家族"这个词的分量：指标之间不是精度高低的关系，而是分工关系——用 LAF 去评估夜间噪声总量、或用 LAeq 去抓关门声峰值，都属于拿错了工具，数字再精确也不回答你要问的问题。

声压级（Sound Pressure Level, SPL）的定义是 $L_p = 20\lg(p/p_0)$，参考声压 $p_0 = 20\ \mu Pa$（1 kHz 处人耳听阈）。定义看似一步完成，但 $p$ 取什么时刻的值、对多长时间取平均、平均之前滤掉哪些频率，答案都不唯一。声级计（Sound Level Meter, SLM）问世百年，从模拟表针（图 1 左、中）走到数字读出（图 1 右），标准化组织把这些自由度固化为两组设置，组合出了整族指标。

这套压缩规则值得用一个具体数演一遍：0.02 帕的交谈声压除以 20 微帕的参考声压得 1000，取常用对数为 3，乘 20 等于 60 dB。三个环节各司其职——比值让刻度归一，对数把量级压扁，系数 20 把声压域的"每 10 倍"变成声级域的"每 20 dB"。

![从模拟表针到数字读出的声级计](/images/sound-level-family/fig1_slm_history.png)

*（图源：Siemens Simcenter Testing Knowledge Base）*

图 1 中老式声级计靠指针摆幅指示声级，读数快慢由表针的机械惯性决定；现代数字声级计用算法复现同样的响应特性，模拟时代的旋钮在软件里变成了参数：

::: info 两个旋钮
- **时间积分常数（Time Integration Constant）**：又称时间平均帧（Time Averaging Frame），决定读数多快跟随信号变化。选项有快挡（Fast，0.125 s）、慢挡（Slow，1 s）、脉冲挡（Impulse，上升沿 0.035 s / 下降沿 1.5 s）。
- **频率计权（Weighting）**：求有效值之前对频谱乘的计权函数，有线性（Linear，不计权）、A、B、C 等。A 计权近似人耳的平均频响，是环境与整车噪声测量的默认项。
:::

回到开头那两个纠纷：怠速录音"差 4 dB"是因为一个报的是快挡瞬时读数、一个报的是全工况等效级——前者盯眼前、后者算总账，本来就不是同一个数；关门声"61 对 71"是因为 Slow 挡的 1 秒记忆窗把 50 毫秒脉冲摊到了 20 倍长的时间上，能量被稀释约 10 dB。两个纠纷的共同根源都在时间计权。带着这个结论，下面把两个旋钮逐个展开。

先打个贯穿全文的比方：声级指标家族就像一个家庭的水表与电表。老式指针水表（图 1 左）指针摆得快，你盯着它能看到"此刻"流量，但读不稳；电表走字慢，月底抄一次总数，单看数字抓不到谁在偷偷用电。LAF/LAS 就是"水表性格"——指数平均给过去的声音打折扣，看的是眼前；LAeq 是"电表性格"——线性平均把每个样本等权计入，算的是总账；SEL 则像把整月用电折算成"如果全部挤在一秒内烧掉，功率得多大"，专用于给不同时长的事件排座次。一个指标管眼前，一个指标管总量，一个指标管归一化比较，谁也替代不了谁。

把旋钮组合写进指标名，就是本文的主角：LAF = A 计权 + Fast，LAS = A 计权 + Slow，Limpulse = A 计权 + Impulse，LAeq = A 计权 + 等效（线性）平均，LAE/SEL = A 计权或线性 + 暴露归一。名字里的 L 来自级（Level），A 来自计权，最后一个字母来自时间属性。
## 二、标准声级 LAF、LAS、Limpulse：指数平均的三种时间常数

### 公式与物理意义

LAF 与 LAS 共用一个公式，区别只在时间常数。对瞬时 A 计权声压做指数加权积分，取平方根再取对数，得到时刻 t 的计权声级。Simcenter 知识库原文给出的形式如图 2：积分号内是计权声压平方，指数因子即时间计权，tau 是时间常数（Slow 取 1 s，Fast 取 0.125 s），p0 是参考声压 20 微帕。

![LAF 与 LAS 的计算公式](/images/sound-level-family/fig3_eq_laf_las.png)

*（图源：Siemens Simcenter Testing Knowledge Base）*

把公式里的指数权重展开看物理意义：它给过去的声音打折扣。离当前时刻 t 越久的声样本，权重按指数衰减——发生在当前时刻的声音权重 100%，一个时间常数前的权重降到约 37%，两个时间常数前约 14%，三个时间常数前只剩 5%。所以指数平均是一种有记忆的均方估计器：Fast 挡记忆窗口 125 ms，读数跳得快；Slow 挡记忆窗口 1 s，读数稳。
**导读**：这个公式回答的问题是"带记忆的声级怎么算"——当前时刻 t 的读数由多长的历史决定？其中指数因子 $e^{-(t-\xi)/\tau}$ 对应物理里的"遗忘速度"：发生得越早的声音权重越低，tau 越大记忆越长（Fast 的 0.125 s 只记得住刚刚半秒内的事，Slow 的 1 s 能记 5 秒的旧账）。

用数学语言写全（式 1）：

$$
L_{A\tau}(t) = 20\lg\left[\frac{1}{\tau}\int_{-\infty}^{t} p_A^2(\xi)\, e^{-(t-\xi)/\tau}\, d\xi\right]^{1/2}\bigg/ p_0
$$

其中 p_A 是瞬时 A 计权声压（帕），xi 是积分区间内的时刻（秒），d-xi 是积分微元。方括号内是一个加权均方声压：离当前 t 越远的 xi，其声压平方被指数因子压得越低。这个积分从负无穷积到当前时刻 t，工程上等价于一个平方域的一阶低通滤波器，时间常数就是 tau。

### 三挡响应对比

图 3 是同一段声信号（黑）激励下三种时间计权的输出叠加：LAF（红）上升最快、回落也快；LAS（黄）爬坡到满幅要将近 5 秒、衰减也慢；Limpulse（紫）上升最快、衰减最慢。

![LAF/LAS/Limpulse 对同一信号的响应](/images/sound-level-family/fig2_time_weighting_response.png)

*（图源：Simcenter Testing Knowledge Base）*

三挡的响应参数来自声级计标准（IEC 651 / ANSI S1.4 一脉），数值为：

| **指标** | **时间常数/平均帧** | **上升速度** | **衰减速度** | **适用信号** |
| --- | --- | --- | --- | --- |
| **LAF（A 计权快挡）** | 0.125 s | 不足 0.5 s 达满幅 | 约 34.7 dB/s | 快变、瞬态信号 |
| **LAS（A 计权慢挡）** | 1 s | 约 5 s 达满幅 | 慢于 LAF | 平稳噪声 |
| **Limpulse（A 计权脉冲挡）** | 上升 0.035 s / 下降 1.5 s | 三者最快 | 三者最慢 | 枪声、冲击等单次事件 |

Limpulse 的不对称设计有历史原因：它本质是峰值检波器（Peak Detector），35 ms 的上升时间常数让它抓得住枪声、冲击这类毫秒级的突升；1.5 s 的长衰减时间常数让模拟表针慢落，操作者来得及把峰值抄下来。数字时代不需要抄表，但指标保留了下来，用于单次冲击事件的量化与比对。

图 4 是 Simcenter Testlab 对同一段录音（上：红色声压时程）计算出的三条曲线：LAF（蓝）贴得最紧、LAS（绿）最平滑、Limpulse（黑）峰值最高且拖尾最长。

![Testlab 输出的 LAF/LAS/Limpulse 曲线](/images/sound-level-family/fig4_laf_las_limpulse_output.png)

*（图源：Simcenter Testing Knowledge Base）*

### 工程判据

- 关门声、敲击声等单次事件：优先 Limpulse 或后文的 SEL，Slow 挡会因 1 s 记忆窗把脉冲摊薄，读数偏低可达 10 dB 量级。
- 怠速、稳态工况噪声：LAS 平滑显示便于读数，LAF 用于观察调制与波动。
- 法规测量（如通过噪声、环境噪声）：标准会强制规定时间计权，先查标准再选挡。

## 三、平均声级 RMS 与 LAeq：把一段时间折成一个数

### 线性平均与指数平均的分野

**导读**：这个公式回答的问题是"整段时间的平均声级是多少"——不再区分早晚，每个瞬间的声压平方权重完全相同。其中 $T$ 对应物理里的"总账周期"：积分区间拉多长，LAeq 就算到哪一刻为止。

LAeq（Level A-weighted Equivalent，等效连续 A 计权声压级）不再给历史打折扣，而是在积分区间内对声压平方做线性平均——每个样本权重相同（式 2）：

$$
L_{Aeq,T} = 10\lg\left[\frac{1}{T}\int_{t_1}^{t_2}\left(\frac{p_A(\xi)}{p_0}\right)^2 d\xi\right], \quad T = t_2 - t_1
$$

Simcenter 知识库原文公式如图 5。

![LAeq 的计算公式](/images/sound-level-family/fig5_eq_laeq.png)

*（图源：Simcenter Testing Knowledge Base）*

物理意义：LAeq 是与实际时变声在相同时间 T 内携带相同声能量的稳态声级。一个在 70 与 90 dB(A) 之间剧烈波动的车间，其 LAeq 由能量主导——90 dB 段占的时间再短也主导结果，因为能量按 10 的 L/10 次方增长，90 dB 的能量是 70 dB 的 100 倍。

分贝域不能直接平均：80 与 70 dB 各占一半时间的 LAeq 是 77.4 dB，不是算术平均 75 dB。分贝是能量比的对数，必须回到平方域（声压平方）平均后再取对数。

RMS（Root Mean Square，均方根）与 LAeq 同属线性平均：RMS 对 A 计权信号在时间平均帧内等权平均，LAeq 用 0.1 s 时间平均帧、任意时间增量输出。对同一段 A 计权信号、同一段时长，RMS 与 LAeq 数值相等，差别只在输出方式。

### 累积与瞬时：LAeqT 与 LAeqt

Simcenter Testlab 对 LAeq 提供两种输出（图 6）：**LAeqT（Cumulative，累积）** 从测量起点积分到当前时刻，输出一条随时间收敛的曲线；**LAeqt（Instantaneous，瞬时）** 只在相邻两个输出点之间积分，反映局部声级。图 6 上图为声压时程（红），下图蓝线为 LAeqT、红线为 LAeqt。

![Testlab 的 LAeqT 累积与 LAeqt 瞬时输出](/images/sound-level-family/fig6_laeq_cumulative_instant.png)

*（图源：Simcenter Testing Knowledge Base）*

两者的分工：LAeqT 是从开始测到现在总账折算的等效级，时间越长越稳定，适合报告单一数值；LAeqt 反映眼下这一小段像什么，适合定位时间轴上的事件（如车辆驶过时的峰值区段）。做整车通过噪声时，窗内声级随车辆接近与远离起伏，看 LAeqt 找事件，取 LAeqT 出结果。

## 四、声暴露级 SEL 与 LAE：把事件能量归一到 1 秒

### 为什么要归一

**导读**：这个公式回答的问题是"这个事件总共携带多少声能量"——把积分窗口内的总能量除以固定的 1 秒，而不是除以事件实际时长。其中 $T_0 = 1\ \mathrm{s}$ 对应物理里的"统一量杯"：0.5 秒的关门声与 8 秒的列车通过都被折算到同一个口径上才能比大小。

LAeq 依赖测量时长 T：同一段事件声，T 拉长一倍，能量被稀释，LAeq 降 3 dB。要比较一个 0.5 s 的关门声和一个 8 s 的列车通过事件谁总能量大，直接比 LAeq 不公平。声暴露级（Sound Exposure Level, SEL；A 计权时记 LAE，Level A-weighted Exposure）把事件总能量折算到统一的 1 秒参考时间上（式 3）：

$$
L_{AE} = 10\lg\left[\frac{1}{T_0}\int_{t_1}^{t_2}\left(\frac{p_A(\xi)}{p_0}\right)^2 d\xi\right], \quad T_0 = 1\ \mathrm{s}
$$

公式如图 7：与 LAeq 唯一的差别是分母的 T 换成了固定参考时间 T0 = 1 s。

![LAE 的计算公式](/images/sound-level-family/fig7_eq_lae.png)

*（图源：Simcenter Testing Knowledge Base）*

**导读**：这个换算式回答的问题是"总账和归一账差多少"——同一事件，LAeq 除以真实时长、LAE 除以 1 秒，差别就是时长比的对数。其中 $10\lg(T/T_0)$ 对应物理里的"稀释修正"：账期 T 拉长 10 倍，平均级被稀释 10 dB，归一级不变。

由此得到 LAE 与 LAeq 的换算关系：

$$
L_{AE} = L_{Aeq,T} + 10\lg\frac{T}{T_0}
$$

数值例子：一个事件在 8 秒内 LAeq = 80 dB(A)，则 LAE = 80 + 10 lg 8 约为 89 dB。SEL 与 LAE 的差别仅在计权：SEL 用线性计权，LAE 用 A 计权，两者都用 0.1 s 时间平均帧。

图 8 是 Simcenter Testlab 对同一录音的 LAE 输出：累积量 LAET（蓝）随时间单调不减——暴露只会累积，不会减少；瞬时量 LAEt（红）跟随局部声级起伏。

![Testlab 的 LAET 累积与 LAEt 瞬时输出](/images/sound-level-family/fig8_lae_sel_output.png)

*（图源：Simcenter Testing Knowledge Base）*

### 工程判据

- 单事件排序与限值：SEL/LAE 是标准口径。航空噪声单事件暴露、关门声能量、冲击工具单次冲击，都用 SEL 或 LAE。
- 全天剂量评估：日暴露量按 LAE 逐事件累加，或直接用长时 LAeq 折算，注意口径一致。
- 报告标注：SEL/LAE 必须注明线性还是 A 计权、积分起止时间，不同口径差出的几 dB 直接改变结论。

::: warning 报告常见错误
LAeq 与 SEL 混标。一个 30 s 测量得到 LAeq = 75 dB(A)，直接当成声暴露级 75 dB 写入报告是错的：换算成 1 s 归一的 LAE 应为 75 + 10 lg 30 约等于 89.7 dB。两指标相差 10 lg T，时间越长差越大。
:::

## 五、全家福：一表选对指标

| **指标** | **计权** | **平均方式** | **时间参数** | **回答的问题** | **典型场景** |
| --- | --- | --- | --- | --- | --- |
| **LAF** | A | 指数 | tau = 0.125 s | 眼下声级多高（快响应） | 快变噪声、调制观察 |
| **LAS** | A | 指数 | tau = 1 s | 眼下声级多高（平滑） | 稳态工况读数 |
| **Limpulse** | A | 峰值检波 | 升 0.035 s / 降 1.5 s | 突升峰值多高 | 枪声、冲击、关门声 |
| **RMS** | 可选 | 线性 | 时间平均帧 | 信号有效值多大 | 通用有效值监测 |
| **LAeq** | A | 线性能量平均 | 帧 0.1 s，增量任选 | 整段时间平均能量 | 法规报告、工况对比 |
| **SEL/LAE** | 线性/A | 线性能量平均 + 1 s 归一 | 帧 0.1 s | 事件总能量多大 | 单事件排序、剂量累加 |

::: tip 选择原则
- 默认从 LAeq 出报告：多数法规与整车内部噪声目标以 LAeq 为口径。
- 关注瞬态事件加看 Limpulse 与 SEL：两者互补，前者抓峰值、后者算总能量。
- LAF/LAS 用于过程监控与现象观察，一般不作为最终限值判据。
- 任何指标都随报告注明：计权方式、时间常数或平均帧、积分时长。
:::

## 六、Python 演示：同一段信号五种指标各得多少

```python
import numpy as np

fs = 1000            # 采样率 Hz
t = np.arange(0, 10, 1/fs)
# 背景 60 dB 稳态 + 50 ms 90 dB 短脉冲（模拟冲击事件）
bg = 20e-6 * 10**(60/20) * np.sqrt(2) * np.sin(2*np.pi*200*t)
pulse_mask = (t >= 4) & (t < 4.05)
p = bg.copy()
p[pulse_mask] += 20e-6 * 10**(90/20) * np.sqrt(2) * np.sin(2*np.pi*200*t[pulse_mask])
p0 = 20e-6

def spl(pa):        # 声压级 dB
    return 20*np.log10(np.sqrt(np.mean(pa**2))/p0)

def expo(pa, tau, dt=1/fs):   # 指数时间计权（平方域一阶惯性）
    s = (pa**2).copy()
    a = np.exp(-dt/tau)
    for i in range(1, len(pa)):
        s[i] = a*s[i-1] + (1-a)*pa[i]**2
    return 20*np.log10(np.sqrt(np.maximum(s, 1e-24))/p0)

print("LAeq(10s)     = %.1f dB" % spl(p))
print("LAeq(脉冲段)   = %.1f dB" % spl(p[pulse_mask]))
print("Limpulse 峰值 = %.1f dB" % expo(p, 0.035).max())
print("LAF 峰值      = %.1f dB" % expo(p, 0.125).max())
print("LAS 平稳段读数 = %.1f dB" % np.median(expo(p[t < 3.5], 1.0)))
print("LAE(1s归一)   = %.1f dB" % (spl(p) + 10*np.log10(10.0)))
```

运行结果要点：50 ms 的 90 dB 短脉冲只占 10 s 测量的 0.5%，却把 LAeq 从 60 抬到 68.0 dB——能量按 10 的 L/10 次方计权，短促高声压主导总能量；Limpulse 峰值 89.1 dB 比 LAF 峰值 85.5 dB 高 3.6 dB，35 ms 上升时间常数抓得住毫秒级突升，125 ms 平均帧则把脉冲摊薄；LAS 平稳段读数 59.2 dB 贴合背景；LAE 比 LAeq 恰好高 10 lg 10 = 10 dB，即 1 秒归一的换算差。

## 七、在 Simcenter Testlab 里算这些量

### Testlab Neo：采集时实时监看

在 Simcenter Testlab Neo Time Data Acquisition 的 Measure 工作表中，SCADAS 未武装状态下选中包含传声器的采样率组，点击工具栏中带表针图案的 dB 图标，列表中出现 SPL 条目；选中 SPL 并点省略号按钮，即可定义要在采集同时监看的声级类型（SEL、LAeq、LAF 等），武装系统后在 Active Run 透视表中展示（图 9）。

![Testlab Neo 采集界面实时声级监看](/images/sound-level-family/fig9_neo_online.png)

*（图源：Simcenter Testing Knowledge Base）*

### Testlab Neo Process Designer：后处理复算

在 Process Designer 方法库中找到 SPL 方法（图标即模拟声级计的表针），其属性面板列出全部声级类型及各自固定或可调的时间参数（图 10）：LAF 每 0.025 s 出一点、基于 0.125 s 平均帧；LAS 每 0.02 s 一点、基于 1 s 帧；Limpulse 默认每 0.2 s 一点（可改）；LAeq/RMS 与 LAE/SEL 默认每 0.1 s 一点（可改）、平均帧 0.1 s。默认设置的取向是尽量用上全部样本、不留间隙。

![Testlab Neo SPL 方法的声级类型选项](/images/sound-level-family/fig10_neo_spl_method.png)

*（图源：Simcenter Testing Knowledge Base）*

::: warning 增量与末点不到头
暴露类指标（LAE/SEL）的输出增量影响累积总量与终点时刻：9.862 s 录音用 0.1 s 增量，最后一个输出点只到 9.8 s；用 0.005 s 增量才能到 9.860 s。峰值落在两个输出点之间时，勾选 Maximum hold 可在下一采样点补报。
:::

### Testlab Classic：在线与回放

Signature 在线采集时，在 Online Processing 工作表的 Level Calculation 标签页添加要计算的声级指标（图 11）；跟踪增量在 Tracking Setup 工作表中设置（图 12）。已录好的时域数据走 Signature Throughput Processing：Navigator 中右键时程选 Replace in Input Basket，Time Data Selection 加入数据集，再到 Time Data Processing 的 Change Settings 打开 Level Calculation 标签页选择指标并 Calculate（图 13）。

Classic 的跟踪增量由转速步长等跟踪参数决定，输出点之间可能留有数据间隙；时间平均帧（0.125 s/1 s 等）两个平台一致，跟踪增量则各设各的，两者不能混淆。

![Testlab Classic 在线 Level Calculation 标签页](/images/sound-level-family/fig11_classic_level_calc.png)

*（图源：Simcenter Testing Knowledge Base）*

![Testlab Classic 跟踪增量设置](/images/sound-level-family/fig12_classic_tracking.png)

*（图源：Simcenter Testing Knowledge Base）*

![Testlab Classic Throughput Processing 声级计算设置](/images/sound-level-family/fig13_classic_throughput.png)

*（图源：Simcenter Testing Knowledge Base）*

## 一句话记住

声级家族是一套"记账系统"：LAF/LAS 是打折扣记眼前的流水账（指数遗忘，tau 决定记性），LAeq 是等权记整段的总账（平方域线性平均），SEL/LAE 是把总账归一到 1 秒的事件能量账——换算只差 $10\lg T$；报告任何数字，指标名、计权、时间参数、积分时长四要素缺一不可。

## 八、小结

- 声级指标族 = 频率计权乘时间属性：LAF/LAS/Limpulse 用指数平均看眼前，LAeq 用线性能量平均算总账，SEL/LAE 用 1 秒归一比事件。
- 换算核心只有一条：LAE = LAeqT + 10 lg (T/T0)；分贝永远回平方域平均，不能算术平均。
- 时间常数决定读数性格：Fast 125 ms 贴信号、Slow 1 s 求稳、Impulse 35 ms 与 1.5 s 快上慢下；测脉冲用 Slow 挡必偏低。
- 报告任何声级数字，四个信息缺一不可：指标名、计权、时间常数或平均帧、积分时长。
