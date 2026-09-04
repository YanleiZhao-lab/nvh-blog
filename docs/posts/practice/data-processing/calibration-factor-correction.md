---
title: "测量后才发现灵敏度设错了：校准因子事后修正"
---

# 测量后才发现灵敏度设错了：校准因子事后修正

> 传感器拿错型号、灵敏度录入笔误、或未经校准即采用标称值——采集完成后才发现通道设置中的灵敏度（Sensitivity）与传感器实际值不符，全部数据幅值整体偏离。本文说明电压到工程单位的换算链、事后修正比例因子的分步推导、Time Signal Calculator 的六步操作与多 Run 批量处理方法，以及不可事后修正的硬件级错误的边界。

## 一、错误发生在电压—工程单位换算环节

SCADAS 采集卡记录的永远是**电压**。加速度、声压这些工程量（Engineering Unit，EU）是软件用传感器灵敏度换算出来的：灵敏度定义为**电压/EU**，例如 10.0 mV/g 的加速度计、53.3 mV/Pa 的传声器。通道设置中的 Actual Sensitivity 栏告诉 Testlab"每多少毫伏对应一个工程单位"，它决定了电压刻度到物理量的换算比例。

灵敏度录入错误时，换算结果按同一比例整体偏离。Simcenter Testing Knowledge Base 中的典型案例：本意使用 100 mV/g 的 B 型加速度计，实际安装的是 10 mV/g 的 A 型，通道设置中却按 100 mV/g 填写。

![两款常见灵敏度的加速度计：100 mV/g 与 10 mV/g](/images/calibration-factor-correction/fig1-two-accel-models.png)

*（图源：Simcenter Testing Knowledge Base）*

![Channel Setup 里的 Actual Sensitivity 栏，就是灵敏度录入处](/images/calibration-factor-correction/fig2-channel-setup.png)

*（图源：Simcenter Testing Knowledge Base）*

偏离方向有明确规律：**录入灵敏度高于传感器实际值时，读数偏小**。软件被告知"100 mV 对应 1 g"，而传感器实际 1 g 只输出 10 mV，于是 14 mV 的真实电压被换算为 0.14 g——时历峰值仅为应有值的十分之一（下图中真实值应为 1.4 g）。

![按错误灵敏度记录的时域历程，峰值只读到 0.14 g](/images/calibration-factor-correction/fig3-wrong-time-history.png)

*（图源：Simcenter Testing Knowledge Base）*

::: info 核心概念
- **灵敏度（Sensitivity）**：传感器输出电压与工程单位之比，单位为电压/EU（mV/g、mV/Pa），由厂家出厂标定给出
- **工程单位（Engineering Unit, EU）**：被测物理量的单位——g、Pa、m/s²，电压信号经灵敏度换算后的呈现形式
- **Actual Sensitivity**：通道设置中实际生效的灵敏度栏，事后核查与修正均围绕它展开
:::

修正的前提条件在此确立：**原始电压数据从头到尾未被破坏**。SCADAS 存储的电压值在修正前后完全一致，需要修改的只是电压到 EU 的换算系数。这是数据可以事后修正的物理基础。

## 二、修正比例因子：从定义出发推导

设采集到的电压为 $V$（mV，该序列始终不变），录入的错误灵敏度为 $S_{rec}$（mV/g），传感器真实灵敏度为 $S_{act}$（mV/g）。

软件当时按错误灵敏度换算，存储的工程单位值为：

$$EU_{rec} = \frac{V}{S_{rec}}$$

物理意义：每毫伏被折算为 $1/S_{rec}$ 个工程单位。

真实值应为：

$$EU_{act} = \frac{V}{S_{act}}$$

两式相除消去 $V$，得到修正关系：

$$EU_{act} = EU_{rec} \times \frac{S_{rec}}{S_{act}}$$

物理意义：错误与真实灵敏度之比是一个**无量纲比例因子**，对记录数据整体乘该因子即可完成修正。案例中 $100/10 = 10$，幅值放大 10 倍——录入灵敏度偏高导致读数偏小，修正即为放大。

![修正比例因子的计算公式](/images/calibration-factor-correction/fig4-scale-formula.png)

*（图源：Simcenter Testing Knowledge Base）*

![代入案例数值：100 mV/g 除以 10 mV/g，比例因子 10](/images/calibration-factor-correction/fig5-scale-factor-calc.png)

*（图源：Simcenter Testing Knowledge Base）*

换算为分贝便于快速估算。幅值比例 $k$ 对应的分贝修正量为：

$$L = 20\,\lg k = 20\,\lg\!\left(\frac{S_{rec}}{S_{act}}\right)\ \mathrm{dB}$$

系数取 20 而非 10 的原因：功率与幅值的平方成正比，幅值比须先平方再取对数，即 $10\,\lg k^2 = 20\,\lg k$（推导见《[dB 与对数刻度](../../theory/acoustics-basics/decibel-basics.html)》）。工程上常见的几组组合如下：

| 错填值、实际值 | 比例因子 | 修正量 | 典型场景 |
| --- | --- | --- | --- |
| **100 与 10 mV/g** | x10 | +20 dB | 拿错传感器型号（本文案例） |
| **100 与 50 mV/g** | x2 | +6 dB | 同系列两档灵敏度混用 |
| **10 与 100 mV/g** | x0.1 | -20 dB | 反向拿错，读数大 10 倍 |
| **53.3 与 50 mV/Pa** | x1.066 | +0.56 dB | 录入笔误的传声器 |

::: warning 工程注意
方向不可颠倒：公式为**错填值除以真实值**，错填值位于分子。方向记反会使数据错误加倍——修正前应使用已知激励（如声校准器或已知质量的振动校准器）核对修正方向。另需注意灵敏度的单位制差异：mV/g 与 mV/(m/s²) 相差 9.81 倍，pC 与 mV 的电荷式/IEPE 混淆也很常见。应先确认错误属于"数值"还是"单位制"，再应用比例因子。
:::

## 三、Python 演示：同一因子作用于时域、谱与分贝

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
# 单边谱折算乘 2/fs，再除以汉宁窗相干增益 0.5（即再乘 2）
A_wrong = np.abs(np.fft.rfft(a_wrong * np.hanning(fs))) * 2 / fs * 2
A_fixed = np.abs(np.fft.rfft(a_fixed * np.hanning(fs))) * 2 / fs * 2
i50 = np.argmax(A_wrong)
print(f"50 Hz 谱线: {A_wrong[i50]:.3f} -> {A_fixed[i50]:.3f} g (比值 {A_fixed[i50]/A_wrong[i50]:.1f})")
```

输出中的三组关键数值：错误读数 0.140 g 乘因子 10 后精确恢复为 1.400 g；幅值偏差严格等于 -20.0 dB，与上表估算一致；50 Hz 谱线由 0.140 g 恢复至 1.400 g，比值 10.0，与时域峰值一致。这说明**同一比例因子原封不动地作用于时域、RMS 与每一条谱线**——线性缩放不改变任何相对结构，阶次、共振峰形状均保持不变。

## 四、Testlab 实操六步：Time Signal Calculator

时域信号计算器（Time Signal Calculator，TSC）的思路是把第二节的公式落实为一行 TSC 语句：新建 trace = 原始通道 x 比例因子。TSC 的启用方法与函数体系在《[Time Signal Calculator 实用技巧](./time-signal-calculator-tips.html)》中已有说明，此处仅走校准修正流程。

1. **装载数据**：Navigator 中右键 .LDSF 文件，选 Add to Input Basket，数据进入 Time Data Selection 工作表；
2. **启用插件**：Tools -> Add-ins 勾选 Time Signal Calculator，公式表出现在工作表底部；
3. **写公式**：新建 trace，原始数据乘上比例因子（错填值/真实值）；

![公式行：原始通道乘以 100/10 的比例因子](/images/calibration-factor-correction/step3-tsc-formula.png)

*（图源：Simcenter Testing Knowledge Base）*

4. **Calculate**：新 trace 生成，橙色显示表示尚未保存；
5. **删除原通道**：点行号选中整行、Remove Channel(s)。此步不可省略——否则错误数据与修正数据会一同存入新文件，造成后续数据混用；
6. **Save As**：为修正数据指定新 Run 名，与原始数据分开存放。

多 Run 批量处理是同一套动作的扩展：把所有待修正的 Run 一并加入 Input Basket，在 Time Data Selection 切换到 **Channels Pivot** 视图——通道横排、Run 竖列，一条公式对所有 Run 同时生效。保存时选 **Use original run name, append:** 加后缀，批量落盘。

![Channels Pivot 视图：四个 Run 的同一通道一屏排开](/images/calibration-factor-correction/multi-channels-pivot.png)

*（图源：Simcenter Testing Knowledge Base）*

![批量保存对话框：沿用原名加后缀，一次存完](/images/calibration-factor-correction/multi-batch-save.png)

*（图源：Simcenter Testing Knowledge Base）*

## 五、修正前先核查：测量时刻实际生效的灵敏度

动手修正前应先确认"错在哪里"。官方工程师在知识库文章评论区给出两个核查入口：

- **Archived Settings**（归档设置）：Navigator 选中 Run，中栏找到 Archived Settings，右键 View Channel Setup——测量时刻生效的完整通道设置被原样归档，横向滚动即可找到 Actual Sensitivity 栏；
- **Data Properties**（数据属性）：显示窗中右键曲线，选 Data Properties，同样可以查看采数时使用的灵敏度。

社区还补充了一个轻量替代方案：右键 Throughput 文件，选 **Edit Properties**，可直接修改灵敏度、Point ID、方向、Y 轴量纲，并支持整表粘贴。两条限制需要明确：仅对 SCADAS Mobile 采集的数据有效（不适用于 SCADAS XS），且每个 Run 需单独修改。批量任务仍以 Time Signal Calculator 为宜。

| 修正途径 | 适用范围 | 批量能力 | 备注 |
| --- | --- | --- | --- |
| **Time Signal Calculator** | 任意来源时域数据 | 多 Run 一条公式 | 首选；同时修改量纲/方向需公式组合 |
| **Edit Properties** | 仅 SCADAS Mobile 数据 | 逐 Run 手改 | 可整表粘贴灵敏度，并可同时修改 Point ID/方向 |
| **重新测量** | 任何错误 | - | 过载削波、量程错误等硬件级问题的唯一解决途径 |

::: tip 选择依据
- 拿错型号、录入笔误等**纯灵敏度错误**，走 TSC 比例因子，可高效修正一批数据
- 只改少量 Run 且需连带修改量纲/方向时，用 Edit Properties
- 数据本身已损坏（过载、量程不当），任何系数均无法恢复，见第六节
:::

## 六、可修正与不可修正的边界

TSC 修正只作用于**时域历程**。此前已计算好的频谱、阶次切片、自功率谱不会随之更新——它们的幅值同样存在错误，必须用修正后的时域数据重新处理。由于时历是所有后续分析的源头，源头修正后重新计算谱即可。

真正无法修正的是**硬件层面已损失的信息**：过载削波损失的峰值、量程过大导致的量化噪声，这些在电压转换为数字量的一刻已经定型，任何后处理系数只能缩放、不能还原。判断依据见《[信号过载：削波如何毁掉频谱](../../theory/signal-processing/overload-clipping-distortion.html)》与《[量化与量程](../../theory/signal-processing/gain-range-quantization.html)》。

::: warning 工程注意
修正完成后不宜立即交付：取一条修正后的数据与同测点正常通道做量级交叉核对（如悬置上下方加速度、左右对称点），修正方向敲反这类错误通过交叉核对即可暴露。修正记录应留档——Run 后缀、修正因子、原灵敏度、真实灵敏度四项写入试验记录，以保证数据半年后仍可追溯。
:::

预防的成本低于补救：测试前逐通道校准，支持 **TEDS**（Transducer Electronic Data Sheet，传感器电子数据表，芯片内存储灵敏度，接线后自动读入）的传感器应启用 TEDS，装机完成后保存一张 Channel Setup 截图存档——开篇案例中工程师正是通过翻查试验现场照片才发现拿错了传感器型号。

## 七、小结

灵敏度错误的本质是换算系数错误，电压数据完好，比例因子 $S_{rec}/S_{act}$ 一步修正：错填 100 实际 10 即乘 10（+20 dB），反向则乘 0.1。单 Run 走 TSC 六步，多 Run 用 Channels Pivot 批量处理；修正只作用于时历，谱需重算；过载与量化损失不在可修正范围内。事前校准与 TEDS 是避免此类事后修正的根本措施。
