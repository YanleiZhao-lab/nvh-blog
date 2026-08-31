---
title: "测量后才发现灵敏度设错了：校准因子事后修正"
---

# 测量后才发现灵敏度设错了：校准因子事后修正

> 拿错传感器、手滑敲错一位数、赶时间没校准就用了个"大概值"——采完一整车数据才发现通道设置里的灵敏度（Sensitivity）是错的，幅值整体差了 10 倍。重测不可能，数据不能扔。这篇讲清楚电压到工程单位的换算链、为什么一个比例因子就能救回全部数据、Time Signal Calculator 的六步操作与批量处理，以及哪些错误是事后救不回来的。

## 一、错的不是数据，是那把"电压尺子"

SCADAS 采集卡记录的永远是**电压**。加速度、声压这些工程量（Engineering Unit，EU）是软件用传感器灵敏度换算出来的：灵敏度写成 **电压/EU**，比如 10.0 mV/g 的加速度计、53.3 mV/Pa 的传声器。通道设置里的 Actual Sensitivity 栏告诉 Testlab"每多少毫伏对应一个工程单位"，它就是那把把电压刻度翻译成物理量的尺子。

尺子标错刻度，量出来的数自然整体偏掉。社区知识库里的经典案例：本想用 100 mV/g 的 B 型加速度计，实际装的是 10 mV/g 的 A 型，通道设置里却按 100 mV/g 填了。

![两款常见灵敏度的加速度计：100 mV/g 与 10 mV/g](/images/calibration-factor-correction/fig1-two-accel-models.png)

*（图源：Simcenter Testing Knowledge Base）*

![Channel Setup 里的 Actual Sensitivity 栏，就是灵敏度录入处](/images/calibration-factor-correction/fig2-channel-setup.png)

*（图源：Simcenter Testing Knowledge Base）*

后果方向要心里有数：**把传感器报得比实际更灵敏，读数就偏小**。告诉软件"100 mV 是 1 g"，传感器实际 1 g 只输出 10 mV，于是 14 mV 的真实电压被算成 0.14 g——时历峰值只有应有的十分之一（下图应为 1.4 g）。

![按错误灵敏度记录的时域历程，峰值只读到 0.14 g](/images/calibration-factor-correction/fig3-wrong-time-history.png)

*（图源：Simcenter Testing Knowledge Base）*

::: info 核心概念
- **灵敏度（Sensitivity）**：传感器输出电压与工程单位的比值，单位电压/EU（mV/g、mV/Pa），由厂家出厂标定给出
- **工程单位（Engineering Unit, EU）**：被测物理量的单位——g、Pa、m/s²，电压信号经灵敏度换算后的呈现形式
- **Actual Sensitivity**：通道设置里实际生效的灵敏度栏，事后核查与修正都围绕它展开
:::

关键认知先立住：**原始电压数据从头到尾没被破坏**。SCADAS 存下的电压值在修正前后一模一样，要改的只是电压到 EU 的换算系数。这是数据可救的物理基础。

## 二、修正因子：一步推导

设采集到的电压为 $V$（这串数始终不变），录入的错误灵敏度为 $S_{rec}$，传感器真实灵敏度为 $S_{act}$。

软件当时按错误灵敏度换算，存下的工程单位值是：

$$EU_{rec} = V / S_{rec}$$

而真实值应为：

$$EU_{act} = V / S_{act}$$

两式相除消掉 $V$，得到修正关系：

$$EU_{act} = EU_{rec} \times \frac{S_{rec}}{S_{act}}$$

物理意义很直白：错误与真实灵敏度之比是一个**无量纲比例因子**，把记录数据整体乘上它即可。案例里 $100/10 = 10$，幅值放大 10 倍——报得太灵敏，读数太小，当然要放大回去。

![修正比例因子的计算公式](/images/calibration-factor-correction/fig4-scale-formula.png)

*（图源：Simcenter Testing Knowledge Base）*

![代入案例数值：100 mV/g 除以 10 mV/g，比例因子 10](/images/calibration-factor-correction/fig5-scale-factor-calc.png)

*（图源：Simcenter Testing Knowledge Base）*

换成分贝视角更便于快速心算。幅值比例 $k$ 对应 $20\lg k$ dB（幅值平方才是功率，所以是 20 不是 10，推导见《[dB 与对数刻度](../../theory/decibel-basics.html)》）：

| 错填、实际 | 比例因子 | 幅值偏差 | 典型场景 |
| --- | --- | --- | --- |
| **100 到 10 mV/g** | ×10 | +20 dB | 拿错传感器型号（本文明线案例） |
| **100 到 50 mV/g** | ×2 | +6 dB | 同系列两档灵敏度混用 |
| **10 到 100 mV/g** | ×0.1 | -20 dB | 反向拿错，读数大 10 倍 |
| **53.3 到 50 mV/Pa** | ×1.066 | +0.56 dB | 手滑敲错一位的传声器 |

::: warning 工程注意
方向别搞反：公式是**错填值除以真实值**，错填值在分子。记反了会把数据错上加错——修正前拿一个已知激励（如敲一下已知质量的校准器）核对方向。另外注意灵敏度单位制陷阱：mV/g 与 mV/(m/s²) 相差 9.81 倍，pC 与 mV 的电荷/IEPE 混淆更是常见，先确认错在"数值"还是"单位制"，再套比例因子。
:::

## 三、Python 演示：一个因子贯穿时域、谱与分贝

```python
import numpy as np

# 真实场景：1.4 g 峰值正弦，传感器实际灵敏度 10 mV/g
fs = 10000
t = np.arange(fs) / fs
a_true = 1.4 * np.sin(2 * np.pi * 50 * t)      # 真实加速度 (g)
voltage = a_true * 10.0                          # 传感器输出 (mV)，电压永远不变

# 软件按错误的 100 mV/g 换算，读数缩小 10 倍
a_wrong = voltage / 100.0
factor = 100.0 / 10.0                            # 修正因子 = 错填/真实
a_fixed = a_wrong * factor

print(f"错误读数峰值 {a_wrong.max():.3f} g -> 修正后 {a_fixed.max():.3f} g")
print(f"RMS: 错误 {np.sqrt(np.mean(a_wrong**2)):.4f} -> 修正 {np.sqrt(np.mean(a_fixed**2)):.4f} g")
print(f"幅值偏差 {20*np.log10(a_wrong.max()/a_true.max()):.1f} dB")

# 频谱同样整体缩放：50 Hz 谱线幅值比例应严格等于 factor
A_wrong = np.abs(np.fft.rfft(a_wrong * np.hanning(fs))) * 2 / fs * 4
A_fixed = np.abs(np.fft.rfft(a_fixed * np.hanning(fs))) * 2 / fs * 4
i50 = np.argmax(A_wrong)
print(f"50 Hz 谱线: {A_wrong[i50]:.3f} -> {A_fixed[i50]:.3f} g (比值 {A_fixed[i50]/A_wrong[i50]:.1f})")
```

输出里最值得看的三组数：错误读数 0.140 g 乘因子 10 后精确回到 1.400 g；幅值偏差严格等于 -20.0 dB，与表格心算一致；50 Hz 谱线比值 10.0 说明**同一个因子原封不动作用于时域、RMS 和每一条谱线**——线性换算不改变任何相对结构，阶次、共振峰形状全部保真。

## 四、Testlab 实操六步：Time Signal Calculator

思路就是把第二节的公式落成一行 TSC 公式：新建 trace = 原始通道 × 比例因子。Time Signal Calculator 的启用与函数体系在《[Time Signal Calculator 实用技巧](../../practice/time-signal-calculator-tips.html)》里讲过，这里只走校准修正这条流程。

1. **装载数据**：Navigator 里右键 .LDSF 文件，选 Add to Input Basket，数据进 Time Data Selection 工作表；
2. **启用插件**：Tools -> Add-ins 勾选 Time Signal Calculator，公式表出现在工作表底部；
3. **写公式**：新建 trace，原始数据乘上比例因子（错填值/正确值）；

![公式行：原始通道乘以 100/10 的比例因子](/images/calibration-factor-correction/step3-tsc-formula.png)

*（图源：Simcenter Testing Knowledge Base）*

4. **Calculate**：新 trace 生成，橙色显示表示尚未保存；
5. **删除原通道**：点行号选中整行、Remove Channel(s)。这步别省——不删的话错误数据和修正数据会一起存进新文件，后患无穷；
6. **Save As**：给修正数据一个新 Run 名，与原始数据分开存放。

多 Run 批量处理是同一套动作的放大：把所有要修的 Run 一并加进 Input Basket，在 Time Data Selection 切到 **Channels Pivot** 视图——通道横排、Run 竖列，一条公式对所有 Run 同时生效。保存时选 **Use original run name, append:** 加后缀，批量落盘。

![Channels Pivot 视图：四个 Run 的同一通道一屏排开](/images/calibration-factor-correction/multi-channels-pivot.png)

*（图源：Simcenter Testing Knowledge Base）*

![批量保存对话框：沿用原名加后缀，一次存完](/images/calibration-factor-correction/multi-batch-save.png)

*（图源：Simcenter Testing Knowledge Base）*

## 五、修正前先侦查：当时到底用了什么灵敏度

动手前先确认"错在哪"。官方工程师在文章评论区给了两个核查入口：

- **Archived Settings**：Navigator 选中 Run，中栏找到 Archived Settings，右键 View Channel Setup——测量时刻生效的完整通道设置原样归档，横向滚动找到 Actual Sensitivity 栏；
- **Data Properties**：显示窗里右键曲线，选 Data Properties，同样能看到采数时用的灵敏度。

社区还补了一个轻量替代：右键 Throughput，选 **Edit Properties**，可直接改灵敏度、Point ID、方向、Y 轴量纲，还能整表粘贴。两条限制要清楚：只对 SCADAS Mobile 采的数据有效（SCADAS XS 不行），且每个 Run 要单独改。批量任务，还是 Time Signal Calculator 顺手。

| 修正途径 | 适用范围 | 批量能力 | 备注 |
| --- | --- | --- | --- |
| **Time Signal Calculator** | 任意来源时域数据 | 多 Run 一条公式 | 首选；同时改量纲/方向要靠公式组合 |
| **Edit Properties** | 仅 SCADAS Mobile 数据 | 逐 Run 手改 | 可整表粘贴灵敏度，顺手改 Point ID/方向 |
| **重新测量** | 任何错误 | - | 过载削波、量程错误等硬件级问题唯一解 |

::: tip 怎么选
- 拿错型号、敲错数字这类**纯灵敏度错误**，走 TSC 比例因子，几分钟救回一批数据
- 只改少量 Run 且要连带改量纲/方向，用 Edit Properties
- 数据本身坏了（过载、量程不当），任何系数都救不了，见第六节
:::

## 六、救得回与救不回的边界

TSC 修正只作用于**时域历程**。之前算好的频谱、阶次切片、自功率谱不会跟着变——它们的幅值同样错了，必须用修正后的时域数据重新处理一遍。好在时历是所有后续分析的源头，源头正了，重算一遍谱水到渠成。

真正救不回的是**硬件层面已经损失的信息**：过载削波砍掉的峰值、量程过大导致的量化粗噪，这些在电压变成数字的那一刻就定型了，任何后处理系数只能缩放、不能还原。判断依据见《[信号过载：削波如何毁掉频谱](../../theory/overload-clipping-distortion.html)》与《[量化与量程](../../theory/gain-range-quantization.html)》。

::: warning 工程注意
修完别急着交付：拿一条修正后的数据与同测点正常通道做量级交叉核对（比如悬置上下方加速度、左右对称点），比例因子敲反这种低级错误靠交叉核对十分钟就能暴露。修正记录也要留档——Run 后缀、修正因子、原灵敏度、真实灵敏度四项写进试验记录，半年后有人翻数据时不至于一头雾水。
:::

预防的成本永远低于补救：测试前逐通道校准、能用 **TEDS**（传感器电子数据表，芯片里存着灵敏度，接线自动读入）就用 TEDS、装机完成后截一张 Channel Setup 全景图存档——开头案例里工程师正是靠翻试验现场照片才发现拿错了传感器型号。

## 七、小结

灵敏度错误的本质是尺子刻度错，电压数据完好，比例因子 $S_{rec}/S_{act}$ 一步修正：错填 100 实际 10 就是乘 10（+20 dB），反过来就是乘 0.1。单 Run 走 TSC 六步，多 Run 上 Channels Pivot 批量；修完的只有时历，谱要重算；过载与量化损失不在可救范围内。事前校准加 TEDS，才是让这套补救手艺永远用不上的正解。
