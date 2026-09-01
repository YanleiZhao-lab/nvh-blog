---
title: "声学量Q：体积加速度的物理意义"
---

# 声学量Q：体积加速度的物理意义

> 声学传递路径分析与声源识别文献中经常出现符号 Q，单位 m³/s²——即体积加速度（Volume Acceleration），是声学系统中与"力"对等的输入量。本文依据 Simcenter Testing Knowledge Base，说明 Q 的面积分定义与推导、高频分区测量的物理约束、Q-source 互易法把 12 次敲击测量合并为 1 次激励的原理（P/F 与 A/Q 的量纲一致性），以及 Simcenter Testlab 中的通道配置要点。

## 一、从 F=ma 到 Q→P：声学系统的对偶

结构 NVH 分析的基本框架是牛顿第二定律 $F = ma$：力 $F$（N）输入系统，加速度 $a$（m/s²）是响应输出，中间由质量、刚度、阻尼决定的传递函数连接。锤击法测模态、TPA 测悬置传递率，测量的都是"输入力 → 输出响应"的关系。

声学系统可以套用同一框架，只是输入输出的量不同：与力 $F$ 对等的输入量是体积加速度 $Q$，与加速度 $a$ 对等的输出量是声压 $P$（Pa）。

| 对偶项 | 机械系统 | 声学系统 |
| --- | --- | --- |
| **输入量** | 力 F（N） | 体积加速度 Q（m³/s²） |
| **输出量** | 加速度 a（m/s²） | 声压 P（Pa） |
| **传递函数** | a/F（加速度导纳） | P/Q（Pa·s²/m³） |
| **典型激励设备** | 力锤、激振器 | Q-source |

::: info 核心概念
- **体积加速度（Volume Acceleration，Q）**：声源表面法向加速度沿面积的积分，单位 m³/s²，声学系统中与力 F 对等的输入量
- **体积速度（Volume Velocity，U）**：声源表面法向速度沿面积的积分，单位 m³/s；谐和振动时 $Q = \mathrm{j}\omega U$，两者相差一个频率因子
- **互易性（Reciprocity）**：线性系统中，A 点输入 B 点响应，等于 B 点同样输入 A 点响应——Q-source 互易法测量的物理基础
:::

不用声压作为输入量的原因：声压是响应量，不是声源的固有特性。同一声源在小房间与开阔消声室中产生的声压不同，而其输出的 Q 是声源属性，不随环境声学条件改变。这与结构试验的惯例一致——描述激振器用输出力多少牛顿，而不是"它能把某块平板激励到多少 g"。

## 二、体积加速度 = 面积 × 加速度：从定义出发的推导

"体积加速度"这一名称初看不易直观理解，本节从体积速度的定义出发分步推导。以扬声器纸盆为例：将辐射表面离散为若干面积元 $A_i$（m²），每个面积元中心布置一枚加速度计，测得法向加速度 $a_i$（m/s²）。

**第一步：面积元的体积流量。** 面积元以法向速度 $v_i$（m/s）振动时，单位时间内排开空气的体积为 $A_i v_i$（m³/s），这是该面积元对声源总流量的贡献。

**第二步：整个表面的体积速度。** 各面积元的流量按复数求和（保留相位信息），得到声源的体积速度 $U$（m³/s）：

$$U = \sum_{i} A_i \, v_i$$

**第三步：对时间求导。** 体积加速度是体积速度对时间的导数；面积元位置固定，求导只作用于速度，即 $a_i = \mathrm{d}v_i/\mathrm{d}t$：

$$Q = \frac{\mathrm{d}U}{\mathrm{d}t} = \sum_{i} A_i \, a_i$$

量纲自检：m² × m/s² = m³/s²，与 Q 的单位一致。谐和振动（圆频率 $\omega$，rad/s）时加速度是速度乘以 $\mathrm{j}\omega$，因此：

$$Q = \mathrm{j}\omega U$$

同一声源的 Q 与 U 只差一个频率因子，声源标定必须注明标定的是哪一个量。当表面各点同相位、同幅值振动时（低频"活塞式"辐射），求和退化为乘积，Q 等于总面积乘以加速度：

$$Q = A \, a$$

![扬声器表面分区示意](/images/acoustic-quantity-q/speaker-areas.png)
*（图源：Simcenter Testing Knowledge Base）*

关键在高频段。结构弯曲波波长随频率升高而变短，相邻面积元可能出现反相振动——一个向上拱、一个向下凹，加速度相位接近相反。面积乘加速度是带符号的复数求和，反相区块的贡献互相抵消，总 Q 随频率升高显著减小。

因此用加速度计阵列测 Q 时，**分析的频率越高，面积元必须划分得越小**，否则大面积元内部的相位抵消会使积分结果明显偏小。Simcenter 手册给出的仪表板分区示例说明了这一点：要在更高频段还原准确的 Q，需将板面划分为更小的面积元，逐块布置加速度计。

![仪表板分区测量 Q](/images/acoustic-quantity-q/dash-panel-areas.png)
*（图源：Simcenter Testing Knowledge Base）*

下面用一段 numpy 定量演示相位抵消的影响——两块等面积的板，加速度幅值相同，仅改变相位关系：

```python
import numpy as np

# 将一块板划分为两个 0.02 m2 的补丁，加速度幅值均为 1 m/s2
area = np.array([0.02, 0.02])          # 面积，m2
amp  = np.array([1.0, 1.0])            # 加速度幅值，m/s2

# 低频：结构波长远大于补丁尺寸，两块近似同相
phase_low  = np.deg2rad([0, 5])
# 高频：结构波长与补丁尺寸相当，相邻补丁接近反相
phase_high = np.deg2rad([0, 170])

def q_of(area, amp, phase):
    # 复数加速度按相位合成，Q = sum(面积 × 加速度)（复数求和）
    a = amp * np.exp(1j * phase)
    return np.sum(area * a)

Q_low, Q_high = q_of(area, amp, phase_low), q_of(area, amp, phase_high)

print(f"同相振动: |Q| = {abs(Q_low):.4f} m3/s2  （两块贡献几乎直接相加）")
print(f"反相振动: |Q| = {abs(Q_high):.4f} m3/s2  （大面积元内部自我抵消）")
print(f"幅值损失: {20*np.log10(abs(Q_high)/abs(Q_low)):.1f} dB")
```

输出中最值得注意的是最后一行：加速度幅值不变，仅因相邻补丁相位差从 5 度变为 170 度，Q 下降约 21 dB。这就是高频必须细分面积元积分的原因——这是物理上的相消，不是测量精度问题。

## 三、Q-source 与互易法：12 次敲击变 1 次测量

Q 的工程价值集中体现在传递路径测量效率上。

传统测结构声传递路径的做法：用力锤在悬置安装点逐点敲击，麦克风放在响应点（如驾驶员耳位）接收声压，得到声压/力（P/F）传递函数。一台电机通过四个悬置安装在结构上，每个悬置三个方向都要敲，即 4 × 3 = 12 次独立的敲击测量，得到 12 条 P/F 传递函数。悬置更多、方向更全时，工作量线性增长。

Q-source 互易法把激励与响应的位置互换：将 Q-source 置于声学响应点（驾驶员耳位），使其发出标定过的体积加速度；同时在各悬置安装点布置加速度计。一次激励即可在所有通道并行测得加速度/体积加速度（A/Q）传递函数。

![中高频 Q-source，喷嘴尖端产生标定 Q](/images/acoustic-quantity-q/qsource-nozzle.png)
*（图源：Simcenter Testing Knowledge Base）*

A/Q 之所以能替代 P/F，先看量纲。声压 $P$（Pa，即 N/m²）、力 $F$（N）、加速度 $A$（m/s²）、体积加速度 $Q$（m³/s²）：

$$\frac{P}{F} = \frac{\mathrm{N/m^2}}{\mathrm{N}} = \frac{1}{\mathrm{m^2}}$$

$$\frac{A}{Q} = \frac{\mathrm{m/s^2}}{\mathrm{m^3/s^2}} = \frac{1}{\mathrm{m^2}}$$

两个传递函数都约化为 1/m²，量纲一致。这不是数值巧合——对满足互易性的线性声振系统，"悬置点加力、耳位产生声压"与"耳位注入 Q、悬置点产生加速度"两条路径的传递函数相等。Simcenter 手册中的对比实验确认：Q-source 互易法测得的 FRF 与力锤逐点敲击结果一致，测量时间明显缩短。

![Q-source 互易测量现场：声源置于响应点，加速度计布置在各传递路径安装点](/images/acoustic-quantity-q/reciprocal-photo.png)
*（图源：Simcenter Testing Knowledge Base）*

| 对比项 | 力锤直接法（P/F） | Q-source 互易法（A/Q） |
| --- | --- | --- |
| **激励位置** | 悬置安装点（结构侧） | 声学响应点（如耳位） |
| **激励量** | 力 F（N） | 体积加速度 Q（m³/s²） |
| **测量响应** | 声压 P（麦克风） | 加速度 A（加速度计） |
| **4 悬置 × 3 向** | 12 次独立敲击 | 1 次激励，12 通道并行 |
| **适用场景** | 少数关键路径 | 多路径 TPA、批量排查 |

再用一段代码建立 Q 与声压级之间的量级联系。自由场中，单极子声源在距离 $r$（m）处的声压幅值由远场公式 $|p| = \omega \rho_0 |U| / (4\pi r)$（$\rho_0$ 为空气密度，kg/m³）与 $Q = \mathrm{j}\omega U$ 得到：

$$|p(r)| = \frac{\rho_0 \, |Q|}{4 \pi r}$$

即声压与 Q 成正比、与距离成反比：

```python
import numpy as np

# 自由场单极子近似：从 Q 估算距离 r 处的声压级
rho0  = 1.204                     # 空气密度，kg/m3
Q     = 1.0                       # Q 幅值，m3/s2（Q-source 典型量级）
p_ref = 20e-6                     # 声压参考值，Pa

for r in [1.0, 0.1]:              # 距离源 1 m 与 0.1 m
    p   = rho0 * Q / (4 * np.pi * r)     # |p| 近似为 rho0*Q/(4*pi*r)
    spl = 20 * np.log10(p / p_ref)
    print(f"r = {r:>4} m: |p| = {p:.3f} Pa, SPL ≈ {spl:.1f} dB")

# 对比：Q 减半（比如标定填错一档），声压级掉多少
spl_half = 20 * np.log10(0.5)
print(f"\nQ 若减半: SPL 下降 {spl_half:.1f} dB —— 灵敏度填错直接体现在每一根谱线上")
```

两点观察：其一，1 m³/s² 的点源在自由场 1 m 处约 75 dB，距离缩至 0.1 m 声压增大 20 dB——用 Q-source 测 FRF 时，源到响应点的距离是首要敏感参数；其二，Q 减半声压级下降 6 dB，标定灵敏度填错一档，整条传递函数整体平移。（注：单极子公式是自由场近似，车内混响场实际值会偏离，用于量级判断。）

## 四、Testlab 里配置 Q-source 的要点

硬件连接：SCADAS 的源输出经内置功放电缆接 Q-source，Q-source 上的 BNC 输出端回接到一个数据通道，采回实际发出的 Q 信号。

软件设置按标定单逐项填写：

1. **Channel Setup**：Measured Quantity 选 VolumeAcceleration；Input Mode 按 Q-source 类型选 ICP 或 Voltage（标定单上注明）；Actual Sensitivity 填标定单给的灵敏度，单位 mV/(m³/s²)
2. **Spectral Acquisition 的 Scope**：源设为 Random
3. **Test Setup**：勾选 FRF 的 Measure + Save
4. 测量完成后在显示页右键 Y 轴选 Unit，可将 A/Q 切换为 P/F 按力传递函数读数

::: warning 工程注意
- 灵敏度、Input Mode 一律以 Q-source 随附的**标定单**为准，不要沿用上一个项目的通道设置——不同型号 Q-source 供电方式（ICP/Voltage）不同，填错会导致 Q 幅值整体偏差 6 dB 量级
- 市面上常将这类声源称作 Volume Velocity source，但它输出的测量量是 Volume Acceleration——名称存在混用，认准单位 m³/s² 才能正确配置通道
:::

![力锤法与 Q-source 互易法实测对比](/images/acoustic-quantity-q/impact-vs-qsource.png)
*（图源：Simcenter Testing Knowledge Base）*

## 五、小结

- Q（体积加速度，m³/s²）= 法向加速度沿辐射面积的面积分，是声学系统中与力 F 对等的输入量；P/Q 之于声学，如同 a/F 之于结构
- 用加速度计阵列积分求 Q 时，频率越高分区要越细——相邻区块相位反转带来的相消是 dB 级损失，不是小误差
- 多路径结构声 TPA 优先考虑 Q-source 互易法：响应点放源、悬置点放加速度计，一次激励并行获得所有 P/F（即 A/Q）传递函数；力锤逐点敲击适用于少数路径的复核
