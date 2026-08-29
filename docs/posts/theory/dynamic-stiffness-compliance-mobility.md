---
title: "动刚度、柔度与导纳：一族 FRF 的换算关系"
---

# 动刚度、柔度与导纳：一族 FRF 的换算关系

> 锤击测出来的 FRF 默认是加速度除以力（g/N），但悬置供应商只认动刚度（N/m），声学仿真要的是导纳（(m/s)/N），CAE 报告又常用柔度（m/N）。这六种形式本质是同一个复数函数的三种变换——积分、微分、取倒数——彼此可以精确互推。读完这篇，你能在任何一种形式之间自由切换，并知道每种形式在整车 NVH 里对应的典型用途和读法。

## 一、从一条 FRF 到六种形式

频响函数（FRF, Frequency Response Function）定义为响应自由度与参考自由度在频域的比值 $H(f) = X(f)/F(f)$。试验模态分析中最常见的组合是加速度计测响应、力锤测激励，得到**加速度导纳（Accelerance）**，单位 (m/s$^2$)/N 或 g/N。

但"响应"不一定是加速度。位移、速度同样合法；分子分母还可以互换。把所有组合列出来，正好是六种：

| 名称 | 定义 | 单位 | 获得方式（从加速度导纳出发） |
| --- | --- | --- | --- |
| **加速度导纳 Accelerance** | $a/f$ | (m/s$^2$)/N | 直接测量 |
| **导纳 Mobility** | $v/f$ | (m/s)/N | 除以 $j\omega$（频域积分一次） |
| **柔度 Compliance** | $x/f$ | m/N | 再除一次 $j\omega$（积分两次） |
| **动质量 Dynamic Mass** | $f/a$ | kg | 加速度导纳取倒数 |
| **机械阻抗 Impedance** | $f/v$ | Ns/m | 导纳取倒数 |
| **动刚度 Dynamic Stiffness** | $f/x$ | N/m | 柔度取倒数 |

![六种 FRF 形式总览](/images/dynamic-stiffness-compliance-mobility/frf-six-forms.png)

*（图源：Simcenter Testing Knowledge Base）*

为什么频域积分只是一次除以 $j\omega$？从导数定义出发：位移求一次时间导数得到速度，$v(t) = dx/dt$。对简谐运动 $x = X e^{j\omega t}$，求导得 $v = j\omega X e^{j\omega t}$，即 $V = j\omega X$。所以速度是位移乘 $j\omega$，反过来位移是速度除以 $j\omega$。频域里"积分就是除以 $j\omega$、微分就是乘以 $j\omega$"，一次乘除搞定，没有任何数值漂移问题——这和时域积分完全是两回事。

::: info 核心概念
- **积分/微分**：在频域只是乘除 $j\omega$，同时改变幅值（$\omega$ 倍）和相位（90 度）
- **反演（Inversion）**：分子分母互换，共振峰变成谷
- **复数性**：表格只列幅值，实际每种形式都是复数，含幅值和相位两部分
:::

## 二、SDOF 三段论：刚度区、阻尼区、质量区

理解六种形式的关键，是单自由度（SDOF）系统的运动方程。质量-弹簧-阻尼系统在频域的方程：

$$F = (k - \omega^2 m + j\omega c) \cdot X$$

括号里三项分别是弹簧恢复力、惯性力、阻尼力，它们随频率的增长速度不同——弹簧力与频率无关，阻尼力随 $\omega$ 一次方增长，惯性力随 $\omega^2$ 增长。不同频段的主导项因此不同：

![FRF 的三个主导区](/images/dynamic-stiffness-compliance-mobility/frf-regions.png)

*（图源：Simcenter Testing Knowledge Base）*

**低频段（频率趋于零）**：惯性项 $\omega^2 m$ 和阻尼项 $\omega c$ 都趋于零，方程退化为 $F \approx kX$，柔度趋于 $1/k$。物理上激励太慢，质量来不及储能、阻尼没机会耗能，只有弹簧变形——这就是**刚度线**，在柔度图上平行于频率轴。

**共振点**：$\omega_n = \sqrt{k/m}$ 处弹簧力与惯性力正好抵消（$k = \omega_n^2 m$），只剩阻尼力抵抗激励。共振幅值完全由阻尼决定，这就是为什么估阻尼要看峰。

**高频段**：惯性项 $\omega^2 m$ 压倒一切，把位移形式的方程改写成加速度形式 $F \approx ma$，加速度导纳趋于 $1/m$，动质量趋于 $m$。激励太快，弹簧来不及变形，质量整体被"甩"——这是**质量线**。

![加速度导纳的质量线](/images/dynamic-stiffness-compliance-mobility/accelerance-mass-line.png)

*（图源：Simcenter Testing Knowledge Base）*

::: tip 读图判断
- 正演形式（柔度/导纳/加速度导纳）：低频平线 = 刚度线（读 $1/k$），高频趋于 $1/m$（加速度导纳）或下降线（导纳）
- 反演形式（动刚度/阻抗/动质量）：低频平线 = 动刚度（读 $k$），高频平线 = 动质量（读 $m$）
- 峰谷判读：正演形式共振是**峰**，反演形式共振是**谷**
:::

## 三、公式推导：六种形式怎么互推

从运动方程 $F = (k - \omega^2 m + j\omega c) X$ 出发分步推导。

**第一步，写柔度。** 输出除以输入：

$$\frac{X}{F} = \frac{1}{k - \omega^2 m + j\omega c}$$

**第二步，柔度到导纳。** 速度 = 位移乘 $j\omega$，所以 $V = j\omega X$，导纳：

$$\frac{V}{F} = j\omega \cdot \frac{X}{F} = \frac{j\omega}{k - \omega^2 m + j\omega c}$$

分子从常数 1 变成 $j\omega$：幅值随频率线性上升，相位抬 90 度。这就是导纳低频渐近线以 +20 dB/dec 上升、斜率反比于 $k$ 的原因。

**第三步，导纳到加速度导纳。** 再乘一次 $j\omega$：

$$\frac{A}{F} = j\omega \cdot \frac{V}{F} = \frac{-\omega^2}{k - \omega^2 m + j\omega c}$$

$(j\omega)^2 = -\omega^2$，负号只是相位翻转，幅值以 +40 dB/dec 上升。验证高频极限：频率趋于无穷时分子分母都由 $\omega^2$ 主导，$\frac{-\omega^2}{-\omega^2 m} = \frac{1}{m}$。质量线读数就是 $1/m$，这正是用刚体模态质量线反推系统质量的原理。

**第四步，反演。** 把上面三个式子各自取倒数，得到动刚度、机械阻抗、动质量。共振时正演形式的分母 $k - \omega^2 m + j\omega c$ 幅值最小（只剩 $j\omega_n c$），取倒数后峰就变成了**谷**：

$$K_{dyn} = \frac{F}{X} = k - \omega^2 m + j\omega c$$

这个式子值得盯着看：动刚度不是常数，它就是运动方程括号里的那一项，多自由度系统里对应**动刚度矩阵** $Q = K - \omega^2 M + j\omega C$（LMS 理论手册的模态灵敏度分析用的正是这个量）。低频趋于 $k$，高频趋于 $-\omega^2 m$（幅值以 40 dB/dec 上升），共振点幅值跌到 $\omega_n c$——阻尼越小谷越深。

```python
import numpy as np

# SDOF 质量-弹簧-阻尼系统参数
m, k, c = 10.0, 1e6, 100.0     # kg, N/m, Ns/m
f = np.linspace(1, 500, 500)   # 频率轴 Hz
w = 2 * np.pi * f
jw = 1j * w

# 柔度（位移/力）：C = 1 / (k - w^2*m + j*w*c)
compliance = 1.0 / (k - w**2 * m + jw * c)

# 微分 = 乘 jw：柔度 -> 导纳 -> 加速度导纳
mobility = compliance * jw
accelerance = compliance * jw * jw

# 反演 = 取倒数
dyn_stiffness = 1.0 / compliance
impedance = 1.0 / mobility
dyn_mass = 1.0 / accelerance

fn = np.sqrt(k / m) / (2 * np.pi)
print(f"固有频率 fn = {fn:.1f} Hz")
print(f"柔度低频渐近线 1/k = {1/k*1e6:.2f} um/N (刚度线)")
print(f"共振处 |柔度| = {np.abs(compliance).max()*1e6:.0f} um/N, 放大 {np.abs(compliance).max()/(1/k):.0f} 倍")
print(f"加速度导纳高频值 = {np.abs(accelerance)[-1]:.3f} (m/s^2)/N, 渐近线 1/m = {1/m:.3f}")
print(f"高频 |动质量| = {np.abs(dyn_mass)[-1]:.2f} kg -> 趋近 m = 10 kg")
print(f"低频 |动刚度| = {np.abs(dyn_stiffness)[0]:.3e} N/m -> 就是 k")
```

输出里最值得看三个数字：固有频率 50.3 Hz 处柔度从 1 um/N 放大到 29 um/N（共振放大 29 倍）；高频端动质量收敛到 9.90 kg，几乎就是 m 本身；低频端动刚度 9.996e5 N/m，直接读出 k。

## 四、每种形式的工程用途

六种形式不是数学游戏，各自对应具体工程场景。

### 加速度导纳：测试的天然形式

锤击 + 加速度计的组合直接产出 g/N 数据，峰值对准固有频率。利用刚体模态的质量线，Testlab 的 Rigid Body Property Calculator 还能从一组 FRF 反算试验对象的转动惯量——前提是刚体模态与第一阶弹性模态在频率上拉开足够距离，中间留出一段平直质量线。

### 导纳与阻抗：声学与力识别

结构声辐射功率正比于表面速度的平方，所以声学仿真里结构对内力的响应一律用导纳表达——表面导纳越小，同样激励下辐射声越低。机械阻抗则反过来用于工作力识别：已知阻抗 $f/v$，测得工作状态下的速度 $v_{operational}$（常用激光测振），工作力 $f = v \cdot (f/v)$ 就出来了，这是传递路径分析中工况力获取的经典路数。

另一个阻抗的用法是**耦合匹配检查**：把两个待装配部件连接点的阻抗 FRF 叠到一张图上，两条曲线幅值离得远，装配后互不干扰；贴在一起，装配处会发生动态耦合，谁也别想独善其身。

### 柔度与动刚度：位移思维与悬置设计

柔度直观——工程师对"一牛的力压下去几微米"有天然感觉，CAE 报告常用它。但要给安装点定刚度目标，动刚度更好用，因为它低频平坦，可以压成一个单值指标。

![SDOF 动刚度曲线](/images/dynamic-stiffness-compliance-mobility/dynamic-stiffness-sdof.png)

*（图源：Simcenter Testing Knowledge Base）*

悬置与隔振是动刚度最重要的应用场景。橡胶悬置供应商的技术规格书几乎全用动刚度表述，整车厂评估悬置安装点（车身侧/副车架侧）也用动刚度。经验法则是：

![悬置安装点刚度匹配](/images/dynamic-stiffness-compliance-mobility/mount-attachment-rule.png)

*（图源：Simcenter Testing Knowledge Base）*

**安装点动刚度至少要达到悬置动刚度的 10 倍**。道理是串联弹簧的变形分配：力流过悬置再流进支架，谁软谁吸收变形。悬置软、支架硬，变形全部消耗在橡胶里，振动被隔离；两者一样硬，各分一半变形，悬置形同虚设。通用机械安装的常见刚度目标在 1e7 N/m 量级，厂家会把目标曲线和实测 FRF 叠在一起检查。

```python
import numpy as np

# 悬置(橡胶垫)与安装点(支架)串联：同一个传递力流过两者
k_mount = 1e5      # 悬置动刚度 1e5 N/m (100 N/mm 级)
ratio = np.array([1, 2, 5, 10, 100])   # 支架/悬置刚度比
k_att = k_mount * ratio

# 传递力 F 下各自的变形分配：软簧承担绝大部分变形
d_mount = 1.0 / k_mount        # 单位力下悬置变形
d_att = 1.0 / k_att            # 单位力下支架变形
share = d_mount / (d_mount + d_att)   # 悬置变形占总变形比例

print("支架/悬置刚度比   悬置承担变形占比   串联总刚度 N/m")
for r, s, kt in zip(ratio, share, k_mount*k_att/(k_mount+k_att)):
    print(f"{r:>10d}x        {s*100:8.1f}%         {kt:10.3e}")
# 变形集中在悬置 -> 振动能量消耗在橡胶里而非传进车身
```

刚度比 1 倍时悬置只承担 50% 变形，隔振失效；10 倍时承担 90.9%，隔振基本到位；100 倍时 99%——10 倍法则就是这条曲线上的工程折中点。

![安装点刚度目标检查](/images/dynamic-stiffness-compliance-mobility/stiffness-target.png)

*（图源：Simcenter Testing Knowledge Base）*

## 五、在 Testlab 里切换形式

Simcenter Testlab 里六种形式之间切换不需要重新计算：右键点击 FRF 图的 Y 轴选 "Processing"，即可对显示做积分或微分；积分/微分的组合加上反转，覆盖全部六种。

![Testlab 中积分微分切换](/images/dynamic-stiffness-compliance-mobility/testlab-integrate.png)

*（图源：Simcenter Testing Knowledge Base）*

另外锤击试验工作簿（Impact Testing）可以在 Measure 页签的 All Settings 下 Data Storage 里勾选 "Dynamic Stiffness"，采集时直接存出动刚度曲线，省去后处理。

::: warning 工程注意
- **不要在时域做积分推位移**：时域数值积分对低频漂移和传感器零偏极其敏感，频域除以 $j\omega$ 没有这个问题，但会把低频噪声放大——频率趋零时除以趋近零的数，柔度低频段的可信度取决于加速度计的低频响应和信噪比
- **反演形式的谷不是反共振**：动刚度/动质量曲线的深谷是共振点（正演形式的峰），别按反共振解读
- **单位陷阱**：加速度导纳在 g/N 和 (m/s$^2$)/N 之间差 9.81 倍，跨数据源对比前先统一单位
- **隔振要求远不止刚度匹配**：10 倍法则是变形分配角度的必要条件，还要校核悬置系统固有频率避开主要激励阶次
:::

## 六、小结

六种 FRF 形式，就是三种响应量（位移/速度/加速度）配合两种方向（正演/反演）的全部组合，频域互推只需乘除 $j\omega$ 和取倒数。选择哪种形式看你要读什么：读刚度选动刚度或柔度，读质量选加速度导纳或动质量，做声学和力识别选导纳/阻抗。悬置安装点评估记住一条硬指标：安装点动刚度至少 10 倍于悬置动刚度，通用机械安装参考 1e7 N/m 量级。
