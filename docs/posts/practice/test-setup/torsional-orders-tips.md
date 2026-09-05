---
title: "扭振阶次实操三则：通道组、纵轴量纲与扭振动画"
---

# 扭振阶次实操三则：通道组、纵轴量纲与扭振动画

> 扭振（torsional vibration）数据采回来后，常卡在三个环节：tacho 通道的 throughput 数据进不了谱分析流程、阶次切片纵轴只有 RPM 波动一种量纲、想看扭振沿轴系的分布却只有曲线。本文整理 Simcenter Testlab 的三个操作要点——通道组改为 Vibration、纵轴 Integrate 与 Section Scaling、Torsional Node 圆盘动画——操作都停留在右键菜单级别，分别解决数据流程、量纲换算与结果表达三个问题。

## 一、通道组设置：让 tacho 通道进入振动处理流程

用激光/磁电传感器测扭振（torsional vibration）时，信号接进的是一个 tacho 通道。而 tacho 通道的定位是转速解算：采完的 throughput 数据在后续处理里做 colormap（彩色图）、做阶次（order）切片时，通道经常选不进去——它属于"转速通道"，不在"振动数据"的处理流程里。

传统解法需要硬件分线：把传感器信号物理分成两路，一路接 tacho 通道，一路接普通动态通道。硬件上多一根线、通道表里多一个点名，标定还要做两遍。

Simcenter Testing 知识库给出的做法更直接：**不改接线，只改 ChannelGroupId**。

1. Channel Setup 里照常打开一个 tachometer 通道；
2. 把该通道的 ChannelGroupId 下拉框从 Tacho 改成 Vibration。

![Channel Setup 中把 ChannelGroupId 从 Tacho 改为 Vibration 的下拉菜单](/images/torsional-orders-tips/channel-groupid.png)
*（图源：Simcenter Testing Knowledge Base）*

改完之后系统会同时算出两个结果：tachometer 通道照常解算转速，vibration 通道则把原始脉冲波形当作一路"振动"数据保留——一份信号，两种通道，无需分线。

![ChannelGroupId 改为 Vibration 后即可对扭振信号做彩色图与阶次切片](/images/torsional-orders-tips/colormap-tacho.png)
*（图源：Simcenter Testing Knowledge Base）*

按知识库说明，改组后即可从 throughput 数据创建阶次切片（order cuts）与 FFT——彩色图、切片、谱分析全流程可用。

::: info 核心概念
- **ChannelGroupId（通道组）**：Testlab 里决定通道身份的字段，控制该通道的数据能进入哪些后处理流程；
- **Throughput 数据**：采集时连续写入磁盘的原始时域流，事后可以反复做 FFT、阶次分析。
:::

::: warning 工程注意
改组之后扭振分析走的是"振动通道"的路线：zebra 带（斑马带）接缝误差、盘偏心 runout 这些转速侧的误差会原样进入振动数据。清洗要分两类做：毛刺剔除（Time Signal Calculator 的 TACHO_MOMENTS_SPIKEREMOVAL_TO_RPM）针对个别错误脉冲，接缝修正（ZEBRA_MOMENTS_TO_RPM）针对斑马带搭接处——手册明确两者不能互相替代，必要时先后都要做。先清洗 RPM 信号，再改组做谱分析，顺序别反。
:::

## 二、纵轴量纲：从 RPM 波动换算成角度

扭振阶次切片默认的纵轴是 RPM 波动——每一转速点上的转速交变幅度。X 轴是整体 RPM，Y 轴是波动量，发动机 run-up（升速）过程中曲轴的扭振一目了然。

![发动机 run-up 的 2 阶扭振切片](/images/torsional-orders-tips/torsional-order-cut.png)
*（图源：Simcenter Testing Knowledge Base）*

但很多验收规范和耐久评估要的不是"转速抖多少"，而是"轴扭了多少度"。Testlab 里不用导出数据，右键纵轴三步完成：**Processing -> Integrate (Single)**。

![右键纵轴 Integrate (Single) 将角速度波动积分成角度](/images/torsional-orders-tips/integrate-menu.png)
*（图源：Simcenter Testing Knowledge Base）*

### 积分的分步推导

角速度波动与角位移是积分关系，从运动学定义出发分三步推。

**第一步**，角位移是角速度波动对时间的积分——转速波动每个瞬间都在累积角度偏移：

$$\theta(t) = \int \Delta\omega(t)\,dt$$

**第二步**，设某阶扭振的角速度波动为正弦 $\Delta\omega(t) = \hat{\omega}\sin(2\pi f t)$，其中 $f = O \cdot f_{rot}$（阶次 $O$ 乘转频 $f_{rot}$，即该阶分量在时域的振荡频率）。代入积分：

$$\theta(t) = \int \hat{\omega}\sin(2\pi f t)\,dt = -\frac{\hat{\omega}}{2\pi f}\cos(2\pi f t) + C$$

积分会产生待定常数 $C$（直流项）。手推不定积分时丢掉 $C$ 不影响波动幅值，但数值积分从零初值起步会把直流项带进结果——后面代码要靠去均值把它去掉。

**第三步**，取波动的幅值，即余弦项的系数：

$$\hat{\theta} = \frac{\hat{\omega}}{2\pi f} = \frac{\hat{\omega}}{2\pi \cdot O \cdot f_{rot}}$$

物理意义：同样的角速度波动幅值，阶次越高、转速越高，折算出的角度越小——振荡周期越短，每个半周期内可供积累角度的时间窗越短。

低转速区扭振角度更大还有第二重原因：四冲程发动机相邻燃烧事件之间曲轴减速更充分，转速波动幅值本身在低转速就更大。公式解释的是"同样波动幅值折算出更大角度"，燃烧事件间隔解释的是"波动幅值本身更大"，两个因素在低转速区叠加。

```python
import numpy as np

# 模拟：2600 RPM 附近的 2 阶扭振，转速波动幅值正负 25 RPM
rpm0, order, d_rpm = 2600.0, 2.0, 25.0
f_rot = rpm0 / 60                 # 转频 Hz
f_tors = order * f_rot            # 2 阶扭振频率 Hz
dw = d_rpm * 2 * np.pi / 60       # 角速度波动幅值 rad/s

t = np.linspace(0, 0.1, 100001)   # 0.1 s，1e-5 s 步长
dwave = dw * np.sin(2 * np.pi * f_tors * t)
theta = np.cumsum(dwave) * (t[1] - t[0])   # 数值积分（矩形法）
theta -= theta.mean()                      # 去掉积分引入的直流项 C
theta_pk = np.abs(theta).max()             # 角度波动峰值 rad

print(f"转频 {f_rot:.2f} Hz，2 阶扭振频率 {f_tors:.2f} Hz")
print(f"25 RPM 波动 -> 角度峰值 {np.degrees(theta_pk):.3f} deg")
print(f"理论值      -> 角度峰值 {np.degrees(dw / (2*np.pi*f_tors)):.3f} deg")
print(f"峰峰值      -> {2*np.degrees(theta_pk):.3f} deg")
```

运行结果要点：正负 25 RPM 的波动在 2600 RPM、2 阶下折合约 0.28 度峰值（波动分量，理论值 0.275 度）、0.55 度峰峰值——去掉直流项后数值积分与理论值的偏差在 2% 以内（0.1 s 窗口不含整数个扭振周期，留有少量截断残差）。换算成角度后，"RMS 多少"和"扭多少度"两套验收语言就打通了。

::: warning 工程注意
积分会放大低频漂移。转速信号若有缓变趋势（油门变化、接缝残留的每转一次分量），积分后趋势项会淹没真实的扭振角度。做 Integrate 之前先确认 RPM 已去毛刺、去接缝，必要时先做高通或去趋势；积分之后同样要检查直流项是否已去除。
:::

## 三、纵轴口径：RMS、峰值与峰峰值切换

角度量纲确定后，报告还需写明幅值口径：同一份数据，RMS、峰值（Peak）、峰峰值（Peak-to-Peak）三种表述相差达 2.8 倍。Testlab 里仍是右键纵轴：**Processing -> Section Scaling**，在三者之间切换。

![右键纵轴 Section Scaling 切换幅值表述](/images/torsional-orders-tips/section-scaling.png)
*（图源：Simcenter Testing Knowledge Base）*

三者的换算关系建立在正弦假设上：正弦波的 RMS 是峰值的 $1/\sqrt{2}$，峰峰值是峰值的两倍。

```python
import numpy as np

# 正弦假设下三种幅值表述的换算（扭振切片纵轴）
t = np.linspace(0, 1, 10000, endpoint=False)
x = 0.30 * np.sin(2 * np.pi * 10 * t)   # 峰值 0.30 deg 的正弦角度波动

rms = np.sqrt(np.mean(x**2))
print(f"峰值 Peak       : {np.abs(x).max():.4f} deg")
print(f"有效值 RMS      : {rms:.4f} deg")
print(f"峰峰值 Peak-Peak: {np.ptp(x):.4f} deg")
print(f"检查 2*1.414*RMS: {2*np.sqrt(2)*rms:.4f} deg = Peak-to-Peak")
```

运行结果要点：0.30 度峰值的正弦，RMS 是 0.2121 度，峰峰值 0.60 度。审阅报告时看到"扭振 0.2 度"，先确认是 RMS 还是峰值——两者相差 1.4 到 2.8 倍，对照验收限值时必须统一口径。

| 表述 | 与 RMS 的关系（正弦） | 典型用途 |
| --- | --- | --- |
| **RMS** | $1$ | 能量口径对比、随机成分评估 |
| **Peak** | $\sqrt{2}$，约 1.414 | 与许用值/限值比较 |
| **Peak-to-Peak** | $2\sqrt{2}$，约 2.828 | 间隙/干涉校核、轴系扭角报告 |

::: tip 怎么选
- 对外报告齿轮轴系扭角、校核配合间隙，用峰峰值；
- 与振动烈度、声学能量做同口径对比，用 RMS；
- 和图纸上的许用角度比较，用峰值，并注明换算假设。
:::

## 四、Torsional Node：扭振的圆盘动画

曲线与切片之外，评审场景中旋转动画更直观。Testlab 的 Geometry 里内置了扭振专用的节点类型——Torsional Node，做法：

1. Geometry worksheet 里创建/导入几何；
2. 打开 **Torsional node** 子工作表；
3. 点 **Add Disc...**，填节点名、旋转件半径、圆盘朝向，Apply 后关闭。

![Add Disc 窗口：节点名、半径与圆盘朝向](/images/torsional-orders-tips/add-disc-window.png)
*（图源：Simcenter Testing Knowledge Base）*

圆盘节点会出现在几何显示区，之后谱、阶次、时域数据都能像驱动普通节点变形一样驱动这些圆盘转动——扭振在轴系各位置的相位关系、幅值分布直接以旋转动画呈现。

![几何显示区中的 torsional node 圆盘节点](/images/torsional-orders-tips/torsional-node.png)
*（图源：Simcenter Testing Knowledge Base）*

::: info 核心概念
- **Torsional Node（扭振节点）**：几何模型中代表旋转件的圆盘节点，动画时绕自身轴转动，用于可视化扭振变形；
- **ODS（Operational Deflection Shape，工作变形）**：工作状态下结构实际变形随时间的分布，扭振动画本质是轴系的扭转 ODS。
:::

::: warning 工程注意
Add Disc 时填的半径要和真实旋转件一致——圆盘的视觉转动幅度按半径缩放绘制，半径随意填写会让不同位置的扭角看起来失真。另外动画是展示工具而非测量工具，定量结论仍以切片数据为准。
:::

## 五、小结

三个操作要点的适用边界：通道组改 Vibration 解决 tacho 数据进不了谱分析的流程问题，不改动硬件接线；纵轴 Integrate 解决量纲问题，RPM 波动除以 $2\pi O f_{rot}$ 换算成角度，前提是转速信号已清洗、积分后已去直流；Section Scaling 解决口径问题，RMS、峰值、峰峰值相差 1.414 到 2.828 倍，报告中必须注明；Torsional Node 解决表达问题，用一段可旋转的动画呈现扭振沿轴系的分布。操作都在右键菜单里，但每个菜单项背后是一次量纲换算或一次数据身份切换——知道自己在换什么，比记住点哪里更重要。
