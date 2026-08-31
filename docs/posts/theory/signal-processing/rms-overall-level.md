---
title: "RMS 与总级：从时域到频域的能量守恒"
---

# RMS 与总级：从时域到频域的能量守恒

> 同一段信号，时域计算的 RMS 与频域全部谱线平方和开根号的结果在理论上完全一致——这是 Parseval 定理保证的能量守恒关系。工程实践中两者经常不一致，原因通常有三：未做能量校正、谱线不是 RMS 格式、或直接拿平方单位的自功率谱参与计算。本文分三层说明 RMS 幅值格式、谱的总级（Overall Level）与跟踪总级（Tracked Overall Level）三个概念，并给出手动复算必须满足的三项前置条件。

## 一、为什么平均值为零的信号也有能量

声压波在正负帕斯卡之间振荡，一个周期内的平均值为零。如果仅以平均值衡量信号强度，将得不到任何有效信息——平均值不是衡量信号能量（做功能力）的统计量。

真正代表信号做功能力的是**均方根值（Root Mean Square, RMS）**：将波形平方（负半周翻为正值）、取平均、再开根号。对时间长度 $T$（单位 s）的连续信号 $x(t)$（单位 Pa 或 g 等），RMS 定义为

$$x_{rms} = \sqrt{\frac{1}{T}\int_{0}^{T} x^2(t)\,dt}$$

即信号的等效稳态值。对峰值幅度为 $A$ 的单一正弦波：

$$x_{rms} = \frac{A}{\sqrt{2}} \approx 0.707A$$

其物理含义是：幅度为 $0.707A$ 的稳定直流量与该正弦波等效发热，因此 RMS 又称**等效稳态值（equivalent steady state value）**。

![正弦信号的 RMS 是其等效稳态值](/images/rms-overall-level/rms-equivalent-steady-state.png)
*（图源：Simcenter Testing Knowledge Base）*

频谱里的每条谱线本质上都是一个正弦波，因此谱线同样有 Peak、RMS、Peak-Peak 三种**幅值格式（Amplitude Format）**：峰值格式取 $A$，RMS 格式取 $A/\sqrt{2}$，峰峰值格式取 $2A$。峰值 1.000 g 的谱线，换算为 RMS 格式即 0.707 g——数据本身不变，只是幅值的表达方式不同。

![同一份频谱数据可用不同幅值格式显示，RMS 格式谱线为峰值格式的 0.707 倍](/images/rms-overall-level/amplitude-formats-peak-rms.png)
*（图源：Simcenter Testing Knowledge Base）*

::: info 核心概念
- **RMS**：信号平方平均后开根号，代表振荡信号的等效稳态能量；正弦波为其峰值的 0.707 倍
- **幅值格式（Amplitude Format）**：谱线幅值的线性表达方式，分 Peak / RMS / Peak-Peak 三种，属显示层概念，不改变数据本身
- **总级（Overall Level）**：一个频段内全部谱线平方求和再开根号得到的单一数值，即一个频谱的 RMS
:::

## 二、谱的 RMS：把所有谱线的能量加回去

整条频谱的 RMS 是一个单一数值：对关心频段 $f_1$ 到 $f_2$ 内的每条谱线幅值 $A_k$（线性单位、RMS 格式）平方求和、再开根号（Root Sum Square, RSS）：

$$X_{rms} = \sqrt{\sum_{k=0}^{K} A_k^2}$$

其中 $A_0$ 是频段内第一条谱线，$A_K$ 是最后一条谱线，$A_k$ 的单位与被测量一致（Pa、g 等）。它回答的问题是"这个频段内总共含有多少能量"，与单根谱线的高度是两个概念——一条平坦低矮的宽带谱，其总级可能超过一根高耸的窄带谱线。

![频谱的总级（Overall Level）是单一数值，即整条谱的 RMS](/images/rms-overall-level/rms-of-spectrum-overall.png)
*（图源：Simcenter Testing Knowledge Base）*

为什么各谱线能量可以直接平方相加？因为不同频率的正弦波相互**正交（orthogonal）**，互不贡献能量，各谱线能量简单叠加——这与分贝计算中的"能量叠加"是同一条物理规律。理论根基是 **Parseval 定理（Parseval's Theorem）**：时域平方的积分等于频域各分量平方之和，因此时域计算 RMS 与频域计算总级殊途同归。

手动复算时有三项前置条件，任何一项不满足结果即出错：

| 前置条件 | 错误做法 | 后果 |
| --- | --- | --- |
| **谱线必须是线性单位** | 拿 Pa² 或 g² 单位（自功率谱）直接计算 | 单位混乱，结果无意义，须先开根号变回 Pa / g |
| **谱线必须是 RMS 格式** | 拿 Peak 格式谱线平方求和 | 结果偏大 1.414 倍（约 +3 dB） |
| **必须施加能量校正** | 加了汉宁窗却未乘 1.633 | 总 RMS 系统性偏低 |

其中第三项的能量校正（Energy Correction）：加窗会压低谱线的能量，须乘回固定系数——汉宁窗（Hanning）为 1.633，平顶窗（Flattop）为 2.225，只有矩形窗（Uniform，等效不加窗）校正系数为 1。

![加窗后的谱线须乘能量校正系数：汉宁窗 1.633、平顶窗 2.225](/images/rms-overall-level/window-energy-correction.png)
*（图源：Simcenter Testing Knowledge Base）*

Simcenter Testlab 在后台统一处理了上述换算：无论屏幕上显示的是 Peak 格式还是幅值校正格式，软件计算 RMS 时一律自动转换为**线性、RMS、能量校正**数值，因此计算结果与显示格式无关。

::: warning 工程注意
从其他软件或自编脚本导出的谱，没有这层后台保护，三项前置条件须逐一核对：单位开根号了吗？是 Peak 还是 RMS 格式？加窗了吗、能量校正系数乘了吗？最常见的错误是拿汉宁窗幅值校正（×2.00）谱线直接算总级——幅值校正系数与能量校正系数（×1.633）只能二选一，总级因此偏大约 22%（2.00/1.633 ≈ 1.22），详见[窗函数修正系数](./window-correction-factors.html)。
:::

## 三、跟踪总级：让能量随转速变化

怠速抖动、巡航噪声、加速轰鸣——整车的 NVH 问题几乎都随工况变化。单看某一次平均的频谱无法回答"哪个转速能量最大"，于是有了**跟踪总级（Tracked Overall Level）**：按转速或时间切片，每个增量计算一次频谱及其 RMS，再把一串 RMS 对转速画成曲线。

例如在 3500 至 4000 RPM 之间每 25 rpm 计算一次频谱，对每张频谱求总级，再将这些 RMS 值对转速绘图。这样即可定量识别能量异常的转速区间——哪个峰值对应哪一阶激励、与主观感受的"轰鸣点"（boom）是否吻合，判断便有了定量依据。相比在彩色云图上目测扫描，这种方法客观得多，也是阶次切片、传递路径分析定位前的常规第一步。

![声学信号的总级随转速跟踪曲线](/images/rms-overall-level/tracked-overall-vs-rpm.png)
*（图源：Simcenter Testing Knowledge Base）*

在 Testlab 中的操作路径：测量模式设为 **Tracked**，Section Settings 对话框的 Overall Level 标签页勾选 Overall level，数据存到 Sections 目录下的 Overall Level 文件夹。若只对已有图形读总级：图例右键 Options 里在 Calculated Content 标签页添加 RMS（全频段）；或添加双光标框住频段后，右键光标选 Calculations → RMS（部分频段）。

## 四、Python 演示：时域、频域、格式转换三处对账

用一段可复现的合成信号验证：时域直接计算的 RMS、按前置条件正确合成的频域总级、以及错误做法（拿 Peak 格式直接求和）的结果，三者并列对比。

```python
import numpy as np

N, fs = 8192, 8192.0
t = np.arange(N) / fs
# 怠速进气噪声风格: 300 Pa 峰值正弦 + 宽带随机
x = 300.0*np.sin(2*np.pi*180.0*t) + 90.0*np.random.RandomState(7).randn(N)

rms_time = np.sqrt(np.mean(x**2))              # 时域直接算 RMS（真值）
w = 0.5 - 0.5*np.cos(2*np.pi*np.arange(N)/N)   # 手写汉宁窗
eng = np.sqrt(N / (w**2).sum())                # 能量校正系数（应为 1.633）

X = np.abs(np.fft.rfft(x*w)) * 2/N * eng       # 加窗+能量校正，单边 Peak 格式谱
X[0] = np.abs(np.fft.rfft(x*w))[0] / N * eng   # 0 Hz 谱线无镜像配对，不乘 2
X_rms = X / np.sqrt(2)                         # 谱线换算成 RMS 格式

overall_ok  = np.sqrt((X_rms**2).sum())        # 正确: RMS 格式谱线合成总级
overall_err = np.sqrt((X**2).sum())            # 错误: Peak 格式未换算直接求和

print(f"时域 RMS（真值）        = {rms_time:8.3f} Pa")
print(f"频域总级（RMS 格式）    = {overall_ok:8.3f} Pa  偏差 {abs(overall_ok-rms_time)/rms_time*100:.2f}%")
print(f"频域总级（Peak 未换算） = {overall_err:8.3f} Pa  偏差 {(overall_err/rms_time-1)*100:+.1f}%")
```

实测输出：

```text
时域 RMS（真值）        =  229.526 Pa
频域总级（RMS 格式）    =  230.319 Pa  偏差 0.35%
频域总级（Peak 未换算） =  325.720 Pa  偏差 +41.9%
```

时域真值与按前置条件合成的频域总级偏差 0.35%，残余误差来自汉宁窗能量校正后谱线间的能量分配；而拿 Peak 格式谱线直接求和的结果偏大 1.419 倍，即 +3.0 dB——对应前置条件表中第二条的后果。

## 五、小结

RMS 是能量的语言：单条谱线谈 RMS 格式，整条谱谈总级，随工况变化的谱谈跟踪总级。判断标准有四条——比较能量永远用 RMS；手动合成总级前核对线性单位、RMS 格式、能量校正三项前置条件；Testlab 图例中的 RMS 可信，后台已自动换算；能量随转速如何变化，用 Tracked 模式的 Overall Level 曲线回答，不宜在彩色云图上靠目测估计。
