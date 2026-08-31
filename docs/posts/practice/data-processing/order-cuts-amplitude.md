---
title: "阶次切线幅值：怎样取才是对的"
---

# 阶次切线幅值：怎样取才是对的

> colormap 上斜线一眼就能认出来，可切成阶次切线（Order Cut）后幅值对不对，取决于带宽怎么设。太窄漏能量、太宽吃进邻阶，同一组数据能差出好几个 dB，直接决定你过没过目标线。本文讲清幅值是怎么算出来的、四种带宽模式各自的几何含义，以及在 Simcenter Testlab 里两种切法的关键参数。

## 一、阶次切的幅值是怎么算出来的

阶次切不是"读出某一根谱线"，而是**能量求和**。对每个转速增量（RPM increment），在指定阶次周围取一个频带，把带内的能量按均方根（RMS）加起来，作为该 RPM 点的幅值。

流程分四步：

1. 指定要切的阶次号（不必是整数）；
2. 确定围绕该阶次的频带（带宽）；
3. 对每个跟踪增量，把带内能量按 RMS 求和；
4. 将 RMS 值对 RPM 作图。

![阶次切幅值的计算方法](/images/order-cuts-amplitude/calc-method.png)

*(图源：Simcenter Testing Knowledge Base)*

RMS 求和意味着各谱线幅值先平方、求和、再开方——两相邻谱线各 1.0 m/s² 合出约 1.41 m/s²，而不是算术平均的 1.0。低转速时阶次线密集、谱线分不开，这个求和规则正是带宽问题容易出事的地方。

::: info 核心概念
- **阶次切（Order Cut）**：沿指定阶次带对能量做 RMS 求和，得到幅值随 RPM 的曲线
- **带宽（Bandwidth）**：求和频带的宽度，决定哪些能量被算进这条阶次
- **RMS 求和**：带内各谱线平方求和后开方，能量相加而非幅值相加
:::

## 二、带宽设错，幅值能差好几个 dB

带宽太窄，阶次的能量没全包进来，幅值偏低；太宽，邻近阶次或背景成分被吃进来，幅值偏高。同一阶次用三种带宽切，曲线明显不同——上colormap带宽过宽、中间合适、下colormap过窄。

![同一阶次、三种带宽的切线对比](/images/order-cuts-amplitude/bandwidth-compare.png)

*(图源：Simcenter Testing Knowledge Base)*

手册里明确说：结果可以差出许多 dB，**过没过临界目标可能就取决于阶次是怎么处理的**。所以每切一条阶次都该回头看一眼 colormap，目视确认带宽包住了目标阶次的能量、又没碰邻居。

阶次能量在 colormap 上为什么会"糊"成一条带而不是细线？三个因素：转速变化率（扫速越快糊得越宽）、FFT 窗函数（主瓣把能量摊到邻近谱线）、频率分辨率（谱线越疏、单线能量占比越高）。固定规则不存在，合适带宽只能对着 colormap 找。

::: warning 工程注意
- 报告里给阶次曲线必须同时注明带宽设置，否则别人无法复现你的数值
- 对比两条阶次切线（不同工况、不同软件版本），带宽设置不同就没有可比性
- 扫速快的升速试验，阶次涂抹更宽，用定采样慢扫标定的带宽直接搬过来会漏能量
:::

## 三、四种带宽模式：bandwidth 背后的几何

阶次带宽有四种指定方式：Order、Percentage（%）、Frequency、Lines，频域和阶次域都适用。区别的核心在于**带宽跟着谁走**。

| 模式 | 带宽基准 | 随 RPM 变化（频率轴） | 特点 |
| --- | --- | --- | --- |
| **Order** | 固定阶次宽度 | 频率带宽随 RPM 增大 | 最常用，上下阶次限自动确定 |
| **Percentage** | 阶次值的百分比 | 频率带宽随 RPM 增大 | 高阶自动获得更宽的绝对带宽 |
| **Frequency** | 固定频率区间 | 频率带宽恒定 | 阶次宽度随 RPM 收窄 |
| **Lines** | 固定谱线数 | 取决于频率分辨率 | 分辨率 1 Hz 时与 Frequency 等价 |

### Order 模式

在指定阶次周围取固定的阶次宽度。因为频率 = 阶次 × rpm / 60，同一个阶次宽度对应的频率带宽随 RPM 线性增大——600 rpm 时 ±0.05 阶次只有 ±0.5 Hz，6000 rpm 时就是 ±5 Hz。阶次带宽全程恒定，这是最常用的切法。

![Order 模式：阶次带宽恒定，频率带宽随 RPM 增大](/images/order-cuts-amplitude/order-mode.png)

*(图源：Simcenter Testing Knowledge Base)*

### Percentage 模式

带宽取阶次值的百分比。同样是 10%：切 1 阶，带宽 0.10 阶（0.95~1.05）；切 10 阶，带宽 1.0 阶（9.5~10.5）。单条切线内行为与 Order 模式相同，但**阶次越高、绝对带宽越宽**。高阶在 colormap 上往往涂抹更厉害，百分比模式让高阶自动分到更宽的带宽，一次处理多阶时有用。

### Frequency / Lines 模式

两者非常接近：Frequency 用固定频率带宽，Lines 用固定谱线数。频率带宽全程恒定，阶次轴上的宽度随 RPM 反比收窄。Lines 模式强烈依赖频率分辨率——分辨率越细，同样谱线数对应的带宽越窄。分辨率恰为 1 Hz 时两法等价，否则结果不同。

![Frequency/Lines 模式：频率带宽恒定](/images/order-cuts-amplitude/freq-lines-mode.png)

*(图源：Simcenter Testing Knowledge Base)*

::: tip 选择原则
- 默认用 **Order 模式**，对着 colormap 目视调宽度：包住目标阶次的涂抹带、不碰邻阶
- 一次切几十条阶次做全景对比 → Percentage 模式，让高阶自动拿更宽带宽
- 关心固定频段内的贡献（如窄带共振放大区）→ Frequency 模式
- 用 Lines 模式前先确认频率分辨率，谱线数相同、分辨率不同，带宽完全两回事
:::

## 四、Python 演示：带宽怎么影响幅值

```python
import numpy as np

# 模拟一段 colormap 里某转速增量下的频谱数据
# 2 阶涂抹带（主能量）+ 2.3 阶邻近成分，转速 3000 rpm
rpm = 3000.0
f_ref = rpm / 60.0            # 转频 50 Hz
f_axis = np.linspace(0.0, 500.0, 501)   # 1 Hz 分辨率
amp = np.zeros_like(f_axis)

# 2 阶能量涂抹在 100±3 Hz（扫速+窗函数造成的展宽）
band2 = (f_axis >= 97) & (f_axis <= 103)
amp[band2] = 1.0              # 带内每根谱线 1.0 m/s^2
# 2.3 阶（115 Hz）是邻居，不该被算进来
amp[np.abs(f_axis - 115.0) < 1.0] = 3.0

def cut_rms(f, a, order, bw_order, rpm):
    """按 Order 模式带宽对谱线做 RMS 求和"""
    fc = order * rpm / 60.0
    lo, hi = fc - bw_order * rpm / 120.0, fc + bw_order * rpm / 120.0
    m = (f >= lo) & (f <= hi)
    return np.sqrt(np.sum(a[m] ** 2)), m.sum()

print("带宽(阶)  谱线数  切线幅值(m/s^2)")
for bw in [0.05, 0.12, 0.60]:
    val, n = cut_rms(f_axis, amp, 2.0, bw, rpm)
    print(f"  {bw:4.2f}     {n:2d}       {val:5.2f}")

ideal = np.sqrt(np.sum(amp[band2] ** 2))
print(f"\n2 阶真实能量（不含 2.3 阶）: {ideal:.2f} m/s^2")
```

0.05 阶带宽只包住 3 根谱线，幅值 1.73 m/s²，漏掉一半还多的能量；0.12 阶包住全部 7 根，得 2.65 m/s²，与 2 阶真实能量严丝合缝；0.60 阶一口气包进 31 根谱线，幅值跳到 4.00 m/s²——多出来的正是 2.3 阶那根 3.0 m/s² 的强谱线被吃了进来。三个设置对应约 7.3 dB 的差距（20·log10(4.00/1.73)），这就是"带宽没设对、目标过没过全看运气"的定量版本。

## 五、在 Simcenter Testlab 里切阶次

两种途径：**Signature Throughput Processing** 和 **处理光标（Processing Cursor）**。

### Signature Throughput Processing

加载插件（36 tokens）→ Time Data Processing 工作簿 → Section 栏点 Change Settings → Order Sections 页签。白框里填阶次号，多个用分号隔开，不必是整数。参数含义：

| 参数 | 含义 |
| --- | --- |
| **Order** | 要切的阶次号 |
| **Mode** | 带宽指定方式（Order / % / Frequency / Lines） |
| **Bandwidth** | 带宽数值 |
| **Lower / Upper** | 阶次积分上下限，软件按上两项自动算出 |
| **Offset** | 阶次中心在 0 rpm 处的频率偏移，默认 0 |

### 处理光标

在 Navigator 的 colormap 上右键 → Add Processing Cursor → Order，弹出 Cursor Processing 窗口；右键块选 Parameters，即可设置 Width（带宽）和 Width Unit（模式），把块拖进显示窗。光标在 colormap 上移动时切线实时更新，双击光标还能设 Offset——调带宽时用这种方式对着 colormap 边看边调，比盲填数字高效得多。

::: info Offset 的用途
- 阶次线不从原点出发、在频率轴上有起始偏移时用（典型：电机的 PWM 开关频率族）
- 源文示例为 2500 Hz 偏移的阶次线，机械阶次不会这样，PWM 类才会
:::

## 六、判断标准

切阶次前先看 colormap 定带宽，再选模式：单阶精切用 Order，多阶全景用 Percentage，定频段用 Frequency。报告里带宽设置与阶次号并列给出，对比数据先核对两边带宽。Offset 只给不从原点出发的线（PWM）用。带宽影响的是能量的"进出账"，不重新处理数据就无法修正——第一次就设对。
