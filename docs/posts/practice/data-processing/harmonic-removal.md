---
title: "谐波去除：从信号中剥离已知干扰"
---

# 谐波去除：从信号中剥离已知干扰

> 数据里常有一些成分，来源明确但并不需要：zebra 盘偏心引入的虚假 1 阶、50 Hz 电力谐波族、运行模态分析数据中斜穿的发动机阶次线。Simcenter Testlab 的 Harmonic Removal（谐波去除）不走滤波路线，而是把角域循环平均得到的同步成分从原信号中减去。本文说明其四步算法、六个参数与三类典型应用。

## 一、滤波器处理不了的问题

先看三个工程场景：

- 扭振测试中，zebra 盘安装略偏心。每转一圈条纹先密后疏，转速通道里混入一个虚假的"每转一次"波动。它与真实的 1 阶扭振在**同一频段**，带通滤波无法区分；
- 做运行模态分析（Operational Modal Analysis, OMA），激励本应是宽带随机，结果 colormap（彩色谱图）上发动机阶次斜线密集，模态识别受到严重干扰；
- 台架数据被 8 Hz 及其倍频污染（电力谐波 50/60 Hz 同理），竖条带贯穿整张 colormap。

三件事的共同点：干扰是**某个已知转速（或已知频率）的整数倍离散成分**，即谐波（Harmonics）。普通滤波器难以处理它们，原因有二。

第一，阶次随转速斜向变化，定频滤波器无法跟踪；即使采用跟踪滤波，一次也只能处理一条阶次线，而谐波是一整族（1、2、3…阶）。第二，也是更根本的：需要去除的成分与想保留的信号常常**共用同一频段**——偏心 runout（径向跳动）的虚假 1 阶叠加在真实扭振上，阶次线覆盖在共振峰上。频域里分不开的成分，需要换到角域里寻找判据。

::: info 核心概念
- **谐波（Harmonics）**：与参考转速成整数倍关系的离散频率成分，由旋转部件产生
- **角域（Angle Domain）**：横轴从时间换成转角的表示法，转速波动时同步成分在角域严格周期重复
- **同步平均（Synchronous Averaging）**：按循环对齐后平均，只保留与参考轴同步的成分，非同步成分被平均掉
:::

## 二、四步算法：不滤波，而是"先估计再减"

Harmonic Removal 的思路不是滤掉谐波，而是**先把谐波估计准确，再从原信号中逐点减去**。整个流程四步，一次 HARMONIC_FILTER 操作内部全部完成：

**1. 时域变角域。** 用转速通道把数据按转角重采样。转速波动时，每转一次的事件在时域里间隔不均匀，到了角域全部均匀对齐——这是后续"按循环对齐"的前提。

**2. 角域循环平均。** 取滑动窗口（窗长 = nr_of_cycles_for_avg 个循环），把窗口内的循环逐点平均成一个"平均循环"。与参考轴整数倍同步的成分每循环严格重复，原样保留在平均里；不同步的成分循环间相位漂移，随平均逐渐趋于零。

**3. 逐循环相减。** 把平均循环从每个实际循环里减去——同步的谐波族被剥离，剩下的就是"其他一切"。

**4. 角域变回时域。** 变回时域继续使用，或直接输出角域数据。

![循环平均：滑动窗口内只有与轴同步的 1 阶留在平均里，2.3 阶被平均掉](/images/harmonic-removal/cycle-averaging.png)

*（图源：Simcenter Testing Knowledge Base）*

手册里的经典例子：信号含 1 阶和 2.3 阶两个成分。平均循环里只剩 1 阶（以及 1 阶的整数倍，如果存在），2.3 阶因不同步被平均掉；原信号减去平均循环，剩下的恰好是干净的 2.3 阶。一减一得，两个成分彻底分离。

![去除谐波前（红）后（绿）的频谱对比](/images/harmonic-removal/spectrum-before-after.png)

*（图源：Simcenter Testing Knowledge Base）*

## 三、Testlab 操作：六个参数的工程含义

入口在 Time Signal Calculator：主菜单 Tools -> Add-ins 勾选 **Harmonic Removal**（15 tokens）和 **Time Signal Calculator**（26 tokens），然后在 Time Data Selection 界面按 f(x) 找到 **HARMONIC_FILTER** 函数。

![HARMONIC_FILTER 在 Time Signal Calculator 的函数列表里](/images/harmonic-removal/tsc-harmonic-filter.png)

*（图源：Simcenter Testing Knowledge Base）*

设置一共六项，每一项都有明确的工程含义：

| 参数 | 含义 | 工程要点 |
| --- | --- | --- |
| **function1** | 要去谐波的数据通道 | 处理对象 |
| **tacho** | 参考转速通道 | 与它同步的谐波族会被去除 |
| **samples_per_rev** | 角域每转采样点数 | 可去除的最大阶次 = 其一半 |
| **cycle_definition** | 每循环转数 | 四冲程发动机 = 2 转/循环 |
| **nr_of_cycles_for_avg** | 滑动平均的循环数 | 阶次分辨率 = 1/循环数 |
| **mode** | 输出域 | 时域或角域 |

![Harmonic Filter 的六个设置项](/images/harmonic-removal/harmonic-filter-settings.png)

*（图源：Simcenter Testing Knowledge Base）*

两个参数最容易出问题：

::: warning 参数设置注意
- **cycle_definition 忘记改为 2**：四冲程发动机一个完整工作循环是 2 转（720 度），若按默认 1 转去平均，进气行程与做功行程被错位对叠，燃烧相关的 0.5 阶族信息会被打乱；
- **nr_of_cycles_for_avg 需要权衡**：10 个循环平均得到 0.1 阶分辨率，不同步成分分离更彻底；但窗口越长，对瞬态变化的跟踪越迟钝。稳态数据可取长些，快变的瞬态（tip-in/out）不宜超过信号实际平稳的长度。
:::

## 四、分离机制的定量分析：为什么 1 阶留下、2.3 阶消失

循环平均的分离机制可以定量推导。设参考轴转频对应 1 阶，角域信号中的任一成分可写成阶次 $k$ 的正弦：

$$
x(\theta) = A \sin(k\,\theta + \varphi_0)
$$

其中 $\theta$ 为转角，$k$ 为阶次，$A$ 为幅值，$\varphi_0$ 为初始相位。从定义出发：**整数阶与转角严格同步**，即 $k$ 为整数时，相邻循环（转角增加 $2\pi$）的相位增量为

$$
\Delta\varphi = k \cdot 2\pi \;\equiv\; 0 \pmod{2\pi} \quad (\text{当且仅当 } k \text{ 为整数})
$$

这一步的物理意义：整数阶成分每循环波形完全重复，$N$ 个循环平均后幅值保持不变，衰减比为 $1$。

**非整数阶**的情形：设 $k = m + \delta$（$m$ 为整数部分，$0 < \delta < 1$ 为小数部分），相邻循环相位差等于小数部分对应的相角：

$$
\Delta\varphi = \delta \cdot 2\pi = (\text{frac}(k)) \cdot 360^\circ
$$

这一步的物理意义：非整数阶成分在循环间错开 $\Delta\varphi$，等幅矢量求和将部分抵消。$N$ 个循环等幅平均后，幅值衰减为

$$
\left| \frac{1}{N}\sum_{n=0}^{N-1} e^{\,j\,n\Delta\varphi} \right| = \frac{\left| \sin(N\Delta\varphi/2) \right|}{N\,\left| \sin(\Delta\varphi/2) \right|}
$$

这一步的物理意义：衰减比即 Dirichlet 核归一化幅值，随 $N$ 增大以近似 $1/N$ 的速率收缩；仅当 $\Delta\varphi \to 0$（即 $k$ 接近整数）时衰减失效，残留幅值接近 1。

由 $\Delta\varphi$ 公式可直接读出阶次分辨率的定量来源：循环平均能够区分的最小阶次间隔约为

$$
\Delta k_{\min} \approx \frac{1}{N} \quad (\text{阶次分辨率} = 1/\text{平均循环数})
$$

这一步的物理意义：与 Testlab 手册"10 个循环平均对应 0.1 阶分辨率"的说明一致——两个阶次差小于 $1/N$ 时，二者在 $N$ 循环平均下的衰减比都接近 1，无法区分。

典型数值：2.5 阶相位差 180 度，只需两个循环就完全抵消；而 2.02 阶相位差仅 7.2 度，短窗内近似对齐，会向平均里泄漏——这正是 nr_of_cycles_for_avg 决定阶次分辨率的定量原因。下面用 numpy 复现这套分离：

```python
import numpy as np

spr, ncyc = 64, 40                       # 每转采样数、总循环数
angle = np.arange(ncyc * spr) / spr * 2 * np.pi
sig = 1.0*np.sin(1*angle) + 0.5*np.sin(2.3*angle)   # 1 阶 + 2.3 阶

# 相邻循环相位差 = 360 度 * 阶次的小数部分
for k in (1.0, 2.0, 2.3, 2.5):
    d = (k % 1) * 360
    tag = "对齐保留在平均里" if min(d, 360-d) < 1 else "漂移被平均掉"
    print(f"{k:>4} 阶: 相位差 {d:5.1f} 度  {tag}")

cyc = sig.reshape(ncyc, spr)             # 按循环切齐（角域对齐的等价形式）
avg = cyc.mean(axis=0)                   # 平均循环：只剩同步的 1 阶
resid = cyc - avg                        # 相减：只剩 2.3 阶

rms = lambda x: np.sqrt(np.mean(x**2))
print(f"平均循环 RMS = {rms(avg):.3f}  (1 阶理论值 {1/np.sqrt(2):.3f})")
print(f"残差 RMS    = {rms(resid):.3f}  (2.3 阶理论值 {0.5/np.sqrt(2):.3f})")
```

对照两个数：平均循环 RMS 0.707 精确等于 1 阶正弦的理论 RMS $A/\sqrt{2}$——同步成分完整保留；残差 RMS 0.354 精确等于 2.3 阶的理论 RMS——40 个循环足以把该非同步分量的平均残留压到零。理论衰减公式给出的定量结论与数值实验一致。

## 五、三类典型应用

### 修正 zebra 盘偏心的 runout

zebra 盘安装偏心时，条纹间距每转一次密一次疏，转速估计中出现虚假的每转一次波动。它以 1 阶及其整数谐波的形式污染扭振数据。用 HARMONIC_FILTER 以该转速通道自身为参考，把虚假 1 阶族剥离，剩下的才是真实扭振。注意这里 tacho 与 function1 是同一个通道——通道以自身为参考做谐波去除。

### 分离多个旋转部件的贡献

整车或台架上液压泵、发电机、压缩机各自旋转，colormap 中阶次线交织。对每个部件的转速分别做谐波去除，即可确定各条阶次线的来源部件。**前提是各部件转速比不能是整数倍**——若泵转速恰为发电机的 2 倍，相对发电机它们全是整数阶，在循环平均中无法区分；2.3、1.4、4.6 这类非整数比才可以分离。

### 扣除定频污染：没有转速通道就构造一个

8 Hz、50/60 Hz 电力谐波是定频干扰，现场往往没有对应的"转速通道"。办法是在 Time Signal Calculator 里构造一个：生成 8 Hz 方波再转换成 RPM 通道，将它作为 tacho 输入 HARMONIC_FILTER（具体做法在[上一篇 TSC 技巧](./time-signal-calculator-tips.html)中已有说明）。定频谐波相对这个虚拟转速永远是整数阶，同样可以被去除：

![8 Hz 谐波族去除前（上）后（下）的 colormap 对比](/images/harmonic-removal/colormap-8hz-removed.png)

*（图源：Simcenter Testing Knowledge Base）*

::: tip 使用判断
- 干扰与某根轴（或某个定频）严格整数倍同步：HARMONIC_FILTER 是首选
- 想保留的成分恰好也是该轴整数阶（比如就是想分析 2 阶本身）：不宜使用，会连同目标成分一起剥离
- 没有物理转速通道：定频干扰用虚拟 RPM；转速未知的旋转件需先提取 RPM
:::

## 六、小结

谐波去除的本质是把"频域分不开、角域分得开"的判据用足：同步成分循环间对齐、非同步成分循环间漂移，一次循环平均即可把两类成分拆开，再加一步减法各取所需。参数上重点核对两处——四冲程机 cycle_definition 记得填 2，平均循环数在分辨率与跟踪能力之间按数据平稳长度取舍；多部件分离前先确认转速比不是整数。数据被已知干扰污染时，优先考虑这个工具，再考虑重测。
