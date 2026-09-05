---
title: "Time Signal Calculator：时域公式处理实用技巧"
---

# Time Signal Calculator：时域公式处理实用技巧

> 采集完成后才发现低通滤波未加、通道间需要相减、转速通道存在毛刺、频谱中混入 8 Hz 电源谐波——重新组织试验成本高，这批数据能否在数据端补救？Simcenter Testlab 的 Time Signal Calculator 以逐行公式的方式对时域 trace 执行加减、积分、滤波、信号生成与转速换算，是测试数据后处理的主要工具之一。本文按工程问题组织，说明高频函数的使用方法、参数含义与工程注意事项。

## 一、定位与启用

Testlab 界面里大部分工作表是"流程式"的——选通道、设参数、点 Calculate。Time Signal Calculator 的组织方式不同：在一张公式表里逐行填写表达式，每一行的输入可以是原始通道，也可以是上一行的输出，处理链像电子表格一样逐行搭建。

典型应用场景包括：

- 两个加速度通道相减，得到两点之间的**相对振动**；
- 对加速度做积分得到速度、再积分得到位移——直接积分会引入漂移，处理方法见第二节任务 2；
- 对某段信号施加低通/带通滤波，单独观察某个频率成分的贡献；
- 用公式**生成**一个并不存在的信号——正弦、方波、扫频，再换算成 RPM 通道。

启用路径固定两步：菜单 **Tools -> Add-ins** 勾选 **Time Signal Calculator**（占用 26 tokens），它就出现在 Time Data Selection 工作表下方。点 **f(x)** 按钮弹出函数选择器，左侧按用途分组：Conditioning（信号调理类）、Tacho（转速类）、Trigonometry（三角函数）、Statistics（统计类）等。选完函数，参数在公式行内就地填写。

::: info 核心概念
- **Function1/Function2**：公式里引用的输入通道，可以填通道号（CH1、CH2）或通道名（Tacho、Acc_Left），也可以引用别的公式行的输出
- **f(x) 按钮**：函数选择器入口，按分组浏览所有可用函数
- **Save As**：把公式结果存成新 trace 而不覆盖原始数据——养成习惯，不要在原始数据上直接修改
:::

::: warning 工程注意
公式计算默认在**整个 trace** 上执行。数据里若有坏段（过载、断线、毛刺），先用 Time Data Editor 处理干净再进公式表——数学运算不会发现数据本身是坏的，对坏数据乘上错误因子只会让错误更难察觉。
:::

## 二、四个高频任务的做法

### 任务 1：滤波——低通去掉转速通道的高频噪声

Conditioning 组里的 FILTER_LP、FILTER_HP、FILTER_BP 分别对应低通（low-pass）、高通（high-pass）、带通（band-pass）。以 FILTER_LP 为例，添加函数后在菜单里指定滤波器类型（IIR 还是 FIR）、方法（Butterworth、Bessel、Chebyshev 等）、阶数与截止频率。

![Time Signal Calculator 的滤波函数列表](/images/time-signal-calculator-tips/filter-list.png)

*（图源：Simcenter Testing Knowledge Base）*

![滤波函数的参数菜单：类型、方法、阶数、截止频率](/images/time-signal-calculator-tips/filter-formula-menu.png)

*（图源：Simcenter Testing Knowledge Base）*

两个容易出问题的细节：

- 菜单里的 **Sample Frequency** 只用于设定滤波器形状的显示频率范围，对滤波器本身的性能和属性没有影响——不能指望调整它改变截止特性；
- 点 **Show** 按钮可以预览滤波器的幅频、相位与群延迟（group delay）形状，确认无误再执行。IIR 滤波器在截止频率附近群延迟最大，FIR 各频率延迟恒定——这是相位敏感场合的选型依据，详见《[FIR 与 IIR：滤波器怎么选](../../theory/signal-processing/fir-vs-iir.html)》。

### 任务 2：通道运算——相减、平均、积分

最基础也最常用。两通道相减：`CH1 - CH2`，直接得到差分信号；多通道平均用求和除以通道数。

积分是最容易出问题的运算，问题出在累积效应上。加速度积分一次得到速度，这是速度的定义式：

$$v(t) = v_0 + \int_0^t a(\tau)\,\mathrm{d}\tau$$

若加速度信号含直流偏置 $\bar{a}$（传感器零偏或调理电路漂移），这部分常量单独积分，得到随时间线性增长的速度漂移：

$$\Delta v(t) = \int_0^t \bar{a}\,\mathrm{d}\tau = \bar{a}t$$

速度漂移再积分到位移，漂移项变为时间的二次函数：

$$\Delta x(t) = \int_0^t \bar{a}\tau\,\mathrm{d}\tau = \frac{1}{2}\bar{a}t^2$$

即使 $\bar{a}$ 只有量程的千分之一，几秒后位移曲线也会漂出显示范围——这就是直接积分"越积越飘"的定量根源。工程做法：积分前先高通滤波（去除直流与低频漂移），积分后检查曲线首尾是否闭合。Testlab 也提供了积分相关的内置函数，配合 FILTER_HP 一起使用。

::: tip 相减与积分的组合
想量化"底盘传递到方向盘的振动衰减了多少"，不必分别评估两个通道——先 `CH1 - CH2` 得到相对振动，或对加速度积分到位移后再比，一条曲线直接给出传递效果。相减要求两通道在同一坐标系、同一采样率下采集，采样率不同的通道先重采样再运算。
:::

### 任务 3：RPM 相关——毛刺清洗与转速生成

Tacho 组函数服务于旋转机械分析。上一篇讲过 TACHO_MOMENTS_SPIKEREMOVAL_TO_RPM 按统计判据剔除每转固定位置的毛刺（见《[RPM 信号去毛刺](./rpm-spike-removal.html)》），这里补充另一种用法：**用公式生成一个 RPM 通道**。

场景：台架数据频谱里混进了 8 Hz 及其倍频的干扰谐波——典型的电源或接地环路污染。想去掉它们需要 HARMONIC_FILTER 函数，而谐波滤除**必须有 RPM 通道**做基准，可这批数据根本没接转速。谐波是固定 8 Hz，那就造一个：第一步用公式生成 8 Hz 方波，第二步把方波换算成 RPM——一个"虚拟转速计"就有了，HARMONIC_FILTER 拿它当基准，把 8 Hz 基频及各阶倍频整族扣除。

![两行公式造出虚拟转速通道：先生成 8 Hz 方波，再换算成 RPM](/images/time-signal-calculator-tips/create-tacho-rpm.png)

*（图源：Simcenter Testing Knowledge Base）*

![上：原始数据 colormap 中 8 Hz 谐波族竖条带；下：谐波滤除后的干净图谱](/images/time-signal-calculator-tips/harmonics-removed.png)

*（图源：Simcenter Testing Knowledge Base）*

注意启用条件：HARMONIC_FILTER 除了 Time Signal Calculator（26 tokens）之外，还需在 **Tools -> Add-ins** 中同时勾选 **Harmonic Removal**（15 tokens）插件，否则函数不可用。

谐波滤除按基准转速的阶次（order）工作。阶次定义为信号频率与基准转频之比：

$$\text{order} = \frac{f}{f_{\mathrm{ref}}}$$

8 Hz 固定频率谐波配上 8 Hz 方波生成的 RPM 基准，各倍频正好落在 1、2、3……整数阶上——族内所有谐波一次扣除。函数的主要参数与手册对齐：samples_per_rev 决定角域每转采样点数，可滤除的最大阶次为其一半；nr_of_cycles_for_avg 决定计算平均谐波所用的循环数，阶次分辨率等于其倒数（如 10 个循环对应 0.1 阶分辨率）。

同一方法更换基准即可扩展：数据被 50 Hz（欧洲）或 60 Hz（美国）电源谐波污染时，把方波频率改成 50 或 60；分不清某阶成分来自泵还是发电机时，只要两者转速比不是整数倍（如 2.3、1.4、4.6），分别以各自的转速为基准做谐波滤除，就能把阶次"归属"拆开。

::: warning 工程注意
谐波滤除的前提是干扰频率稳定：固定频率谐波配同频方波基准，整族落在整数阶上一次扣净；但如果干扰频率会漂移（例如变频器开关频率随工况移动），固定基准就扣不准了。执行前先在 colormap 上确认干扰条纹是定频竖线。
:::

### 任务 4：合成信号——正弦、扫频、噪声

Trigonometry 与信号生成函数可以按公式生成标准正弦、方波、扫频甚至随机噪声，典型用途：

- **演示与培训**：给新人一组"成分已知"的信号练手，谱分析完成后对照标准答案；
- **方法验证**：生成一个 30 Hz 正弦加噪声，跑一遍自己的滤波流程，检查幅值恢复精度——处理真实数据前先在已知信号上验证，是成本最低的质量控制；
- **缺失通道补位**：分析流程需要 RPM 而实车数据没测转速，虚拟转速（见任务 3）补位。

## 三、Python 演示：毛刺剔除的统计逻辑

Tacho 组毛刺剔除函数的核心判据是**中值绝对偏差 MAD（Median Absolute Deviation）**：对窗口内的数据序列 $x$，MAD 定义为各点到中值的绝对偏差的中值：

$$\mathrm{MAD} = \mathrm{median}\left(\left| x_i - \mathrm{median}(x) \right|\right)$$

MAD 对离群点稳健——毛刺本身既不抬高中值、也几乎不抬高 MAD，这正是它优于标准差作为"尺度"的原因。但 MAD 直接使用会低估正态数据的散布：对标准正态分布 $\mathrm{median}(|x|) \approx 0.6745\sigma$，需乘一致性校正因子 $1/0.6745 \approx 1.4826$ 才与标准差 $\sigma$ 相当。判据阈值取：

$$\theta = k \cdot 1.4826 \cdot \mathrm{MAD}$$

Testlab 默认 $k = 3.5$，工程常用范围 2～100，阈值越低剔除越激进。偏离局部中值超过 $\theta$ 的点判为坏点、替换为局部中值。整个逻辑用 numpy 二十行就能复现，用于清洗自己的 CSV 数据同样成立（下例为教学复现：采用全序列中值与全局 MAD，比软件的逐转滑窗实现更简单）：

```python
import numpy as np

fs = 2000.0
t = np.arange(0, 3.0, 1/fs)                  # 3 秒仿真振动数据
sig = 1.5*np.sin(2*np.pi*30*t) + \
      np.random.default_rng(7).normal(0, 0.2, len(t))  # 30 Hz 成分 + 噪声
x = sig.copy()
x[1500:1520] += 40                           # 注入一个毛刺（模拟转速尖峰）

win = 201                                    # 滑动窗口，约 0.1 秒
pad = np.pad(x, win//2, mode='edge')         # 边缘延拓，防越界
med = np.array([np.median(pad[i:i+win]) for i in range(len(x))])
mad = np.median(np.abs(x - med))             # 中值绝对偏差（简化：全局尺度）
thr = 3.5 * 1.4826 * mad                     # 3.5 倍 MAD，对齐 Testlab 默认阈值
x_clean = np.where(np.abs(x - med) > thr, med, x)  # 坏点替换为中值

print(f"毛刺段峰值 清洗前 {x[1500:1520].max():6.2f} -> 清洗后 {x_clean[1500:1520].max():6.2f}")
print(f"全信号 RMS 清洗前 {np.sqrt(np.mean(x**2)):6.3f} -> 清洗后 {np.sqrt(np.mean(x_clean**2)):6.3f}")
print(f"30 Hz 正弦的理论 RMS = 1.5/sqrt(2) = {1.5/np.sqrt(2):.3f}")
```

值得对照的是 RMS 的变化：清洗前约 2.5——毛刺虽然只占 20 个样点，能量按平方累积，把整体 RMS 顶得偏高；清洗后回到 1.07 左右，与 30 Hz 正弦的理论值 1.06 基本一致。这正是统计判据的价值：不用人工圈选毛刺，不改动原始数据主体，坏点按判据自动出局。

## 四、函数选择速查

| 工程问题 | 函数/做法 | 关键参数 | 注意 |
| --- | --- | --- | --- |
| **去高频噪声** | FILTER_LP | 方法/阶数/截止频率 | Sample Frequency 仅影响预览显示 |
| **积分去漂移** | FILTER_HP + 积分 | 高通截止要低于信号最低频率 | 先滤后积，积分后查首尾闭合 |
| **相对振动** | CH1 - CH2 | 通道同采样率 | 采样率不同先重采样 |
| **每转毛刺** | TACHO_MOMENTS_SPIKEREMOVAL_TO_RPM | threshold 默认 3.5（常用 2～100） | 替换为直线会丢失真实扭振波动；Rev 17 引入 |
| **接缝修正** | ZEBRA_MOMENTS_TO_RPM | Pulses_per_rev | 16A 起支持多接缝 |
| **定频谐波族** | 造 RPM + HARMONIC_FILTER | 方波频率等于干扰基频 | 需另启用 Harmonic Removal 插件；干扰须定频 |
| **成分归属** | 双基准谐波滤除 | 两转速比须非整数倍 | 整数比时阶次重叠不可分 |
| **缺失通道补位** | 信号生成函数 | 频率/幅度/扫频范围 | 合成数据勿与实测混存 |

::: tip 三条工作习惯
- 公式表搭好后**保存为模板**：同一台架的固定处理链（滤波、相减、积分）下次直接调用，参数只改截止频率
- 所有结果走 **Save As** 存新 trace，原始数据永远只读
- 拿不准处理链是否可靠时，先生成一段成分已知的合成信号从头跑一遍，输出对得上再处理真实数据
:::

## 五、小结

Time Signal Calculator 的价值不在函数数量，而在"可组合"：滤波、运算、生成、转速换算在一个公式表里串成处理链，测试数据的大部分后天补救都能在这里完成。判断标准就一条——**能在数据端解决的，不动测试资源**：重新跑一次整车转毂试验的成本，远高于把公式表配置并验证一遍的投入。
