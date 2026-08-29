---
title: "扭振阶次实操三招：通道组、纵轴量纲与三维动画"
---

# 扭振阶次实操三招：通道组、纵轴量纲与三维动画

> 扭振数据采回来了，却卡在三个地方：tacho 通道的 throughput 做不了彩色图、阶次切片纵轴只有 RPM 波动一种量纲、想看扭振在轴系上怎么扭却只有曲线。本文给出 Simcenter Testlab 的三个实操解法——通道组改成 Vibration、纵轴积分与 Section Scaling、Torsional Node 动画——每个都是右键菜单级别的操作，却直接决定报告能不能交出去。

## 一、第一招：把 tacho 通道"伪装"成振动通道

用激光/磁电传感器测扭振时，信号接进的是一个 tacho 通道。问题来了：tacho 通道天生是给转速解算用的，采完的 throughput 数据在后续处理里做 colormap、做阶次切片，经常发现通道根本选不进去——它在"转速通道"的圈子里，进不了"振动数据"的处理流程。

传统解法很笨：把传感器信号物理分成两路，一路接 tacho 通道，一路接普通动态通道。硬件上多一根线、通道表里多一个点名，标定还要做两遍。

官方知识库给的招数简单得多：**不改接线，只改 ChannelGroupId**。

1. Channel Setup 里照常打开一个 tachometer 通道；
2. 把该通道的 ChannelGroupId 下拉框从 Tacho 改成 Vibration。

![Channel Setup 中把 ChannelGroupId 从 Tacho 改为 Vibration 的下拉菜单](/images/torsional-orders-tips/channel-groupid.png)
*（图源：Simcenter Testing Knowledge Base）*

改完之后系统会同时算出两个结果：tachometer 通道照常解算转速，vibration 通道则把原始脉冲波形当作一路"振动"数据保留。一份信号，两种身份，不用分线。

![ChannelGroupId 改为 Vibration 后即可对扭振信号做彩色图与阶次切片](/images/torsional-orders-tips/colormap-tacho.png)
*（图源：Simcenter Testing Knowledge Base）*

::: info 核心概念
- **ChannelGroupId（通道组）**：Testlab 里决定通道身份的字段，控制该通道的数据能进入哪些后处理流程；
- **Throughput 数据**：采集时连续写入磁盘的原始时域流，事后可以反复做 FFT、阶次分析。
:::

::: warning 工程注意
改组之后扭振分析走的是"振动通道"的路线：zebra 带接缝误差、盘偏心 runout 这些转速侧的误差会原样进入振动数据。先把 RPM 信号清洗干净（毛刺剔除、接缝修正），再改组做谱分析，顺序别反。
:::

## 二、第二招：纵轴从 RPM 波动换成角度

扭振阶次切片默认的纵轴是 RPM 波动——每一转速点上的转速交变幅度。X 轴是整体 RPM，Y 轴是波动量，发动机 run-up 过程中曲轴的扭振一目了然。

![发动机 run-up 的 2 阶扭振切片](/images/torsional-orders-tips/torsional-order-cut.png)
*（图源：Simcenter Testing Knowledge Base）*

但很多验收规范和耐久评估要的不是"转速抖多少"，而是"轴扭了多少度"。角速度波动积分就是角位移，这步换算 Testlab 不用导数据，右键纵轴即可：**Processing -> Integrate (Single)**。

![右键纵轴 Integrate (Single) 将角速度波动积分成角度](/images/torsional-orders-tips/integrate-menu.png)
*（图源：Simcenter Testing Knowledge Base）*

### 积分背后的一步推导

角速度波动与角位移是积分关系，从定义出发推。

设某阶扭振的角速度波动为正弦 $\\Delta\\omega(t) = \\hat{\\omega}\\sin(2\\pi f t)$，其中 $f = O \\cdot f_{rot}$（阶次 $O$ 乘转频）。角位移是它的积分：

$$\\theta(t) = \\int \\hat{\\omega}\\sin(2\\pi f t)\\,dt = -\\frac{\\hat{\\omega}}{2\\pi f}\\cos(2\\pi f t)$$

所以角位移幅值 $\\hat{\\theta} = \\dfrac{\\hat{\\omega}}{2\\pi f} = \\dfrac{\\hat{\\omega}}{2\\pi \\cdot O \\cdot f_{rot}}$。

物理意义：同样的转速波动幅值，发生在越高阶、越高转速，折算成的角度越小——因为可供"积累位移"的时间窗越短。这也解释了为什么低转速区的扭振角度反而更值得关注。

```python
import numpy as np

# 模拟：2600 RPM 附近的 2 阶扭振，转速波动幅值正负 25 RPM
rpm0, order, d_rpm = 2600.0, 2.0, 25.0
f_rot = rpm0 / 60                 # 转频 Hz
f_tors = order * f_rot            # 2 阶扭振频率 Hz
dw = d_rpm * 2 * np.pi / 60       # 角速度波动幅值 rad/s

t = np.linspace(0, 0.1, 100001)   # 0.1 s，1e-5 s 步长
dwave = dw * np.sin(2 * np.pi * f_tors * t)
theta = np.cumsum(dwave) * (t[1] - t[0])   # 数值积分，得到角度

theta_pk = np.abs(theta).max()            # 角度峰值 rad
print(f"转频 {f_rot:.2f} Hz，2 阶扭振频率 {f_tors:.2f} Hz")
print(f"25 RPM 波动 -> 角度峰值 {np.degrees(theta_pk):.3f} deg")
print(f"理论值      -> 角度峰值 {np.degrees(dw / (2*np.pi*f_tors)):.3f} deg")
print(f"峰峰值      -> {2*np.degrees(theta_pk):.3f} deg")
```

运行结果要点：正负 25 RPM 的波动在 2600 RPM、2 阶下折合约 0.275 度峰值、0.55 度峰峰值——数值积分与理论值对得齐。换算成角度后，"RMS 多少"和"扭多少度"两套验收语言就打通了。

::: warning 工程注意
积分会放大低频漂移。转速信号若有缓变趋势（油门变化、接缝残留的每转一次分量），积分后趋势项会淹没真实的扭振角度。做 Integrate 之前先确认 RPM 已去毛刺、去接缝，必要时先做高通或去趋势。
:::

## 三、第三招：Peak、RMS、峰峰值一键切换

角度量纲有了，报告里写"峰值"还是"峰峰值"还是老问题。同一份数据三种说法差着倍数，Testlab 里还是右键纵轴：**Processing -> Section Scaling**，在 RMS / Peak / Peak-to-Peak 之间切换。

![右键纵轴 Section Scaling 切换幅值表述](/images/torsional-orders-tips/section-scaling.png)
*（图源：Simcenter Testing Knowledge Base）*

三者的换算关系建立在正弦假设上：正弦波的 RMS 是峰值的 $1/\\sqrt{2}$，峰峰值是峰值的两倍。

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

运行结果要点：0.30 度峰值的正弦，RMS 是 0.2121 度，峰峰值 0.60 度。审报告时看到别人写"扭振 0.2 度"先问清是 RMS 还是峰值——差着 1.4 到 2.8 倍，验收红线面前这不是小事。

| 表述 | 与 RMS 的关系（正弦） | 典型用途 |
| --- | --- | --- |
| **RMS** | 1 | 能量口径对比、随机成分评估 |
| **Peak** | $\\sqrt{2}$，约 1.414 | 与许用值/限值比较 |
| **Peak-to-Peak** | $2\\sqrt{2}$，约 2.828 | 间隙/干涉校核、轴系扭角报告 |

::: tip 怎么选
- 对外报告齿轮轴系扭角、校核配合间隙，用峰峰值；
- 与振动烈度、声学能量做同口径对比，用 RMS；
- 和图纸上的许用角度比较，用峰值，并注明换算假设。
:::

## 四、加一个会转的圆盘：Torsional Node 动画

曲线再漂亮，评审会上最直观的还是动画。Testlab 的 Geometry 里内置了扭振专用的节点类型——Torsional Node，做法：

1. Geometry worksheet 里建/导入几何；
2. 打开 **Torsional node** 子工作表；
3. 点 **Add Disc...**，填节点名、旋转件半径、圆盘朝向，Apply。

![Add Disc 窗口：节点名、半径与圆盘朝向](/images/torsional-orders-tips/add-disc-window.png)
*（图源：Simcenter Testing Knowledge Base）*

圆盘节点会出现在几何显示区，之后谱、阶次、时域数据都能像给普通节点赋变形一样驱动这些圆盘转动——扭振在轴系各位置的相位关系、幅值分布直接以旋转动画呈现。

![几何显示区中的 torsional node 圆盘节点](/images/torsional-orders-tips/torsional-node.png)
*（图源：Simcenter Testing Knowledge Base）*

::: info 核心概念
- **Torsional Node（扭振节点）**：几何模型中代表旋转件的圆盘节点，动画时绕自身轴转动，用于可视化扭振变形；
- **ODS（Operational Deflection Shape，工作变形）**：工作状态下结构实际变形随时间的分布，扭振动画本质是轴系的扭转 ODS。
:::

::: warning 工程注意
Add Disc 时填的半径要和真实旋转件一致——圆盘的视觉转动幅度按半径缩放绘制，半径乱填会让不同位置的扭角看起来失真。另外动画是"展示工具"不是"测量工具"，定量结论仍以切片数据为准。
:::

## 五、小结

三招的适用判断：通道组改 Vibration 解决"tacho 数据进不了谱分析"的流程问题，一分钱硬件不花；纵轴 Integrate 解决量纲问题，RPM 波动除以 $2\\pi O f_{rot}$ 换角度，换算前提是转速信号已洗净；Section Scaling 解决口径问题，RMS/峰值/峰峰值差 1.414 到 2.828 倍，报告里必须写明；Torsional Node 解决表达问题，评审现场一段动画顶十张 colormap。操作都在右键菜单里，但每个菜单项背后是一次量纲换算或一次数据身份切换——知道自己在换什么，比记住点哪里更重要。
