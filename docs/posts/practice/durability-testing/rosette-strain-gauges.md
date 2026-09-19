---
title: "应变花 Rosette：三片应变片读出整个平面应变场"
author: "@NVH_Z"
---

# 应变花 Rosette：三片应变片读出整个平面应变场

> 一个测点上贴了三枚应变片，各自读数都没超材料屈服应变的十分之一，报告交上去却被仿真部门打了回来：你这测点的主应变方向和 CAE 对不上，疲劳寿命没法算。问题出在哪？单轴应变片只认自己栅丝方向那一缕应变，而真实零件表面是拉、压、剪混在一起的平面应变场——载荷方向不凑巧时，单片读数可能把最大应变低估近半。本文从"为什么单片不够"讲起，用莫尔圆把应变张量与主应变的换算串起来，再给出矩形花（0°-45°-90°）与三角花（0°-60°-120°）的计算公式、九个输出量的来历，以及 Testlab 虚拟通道与 Neo Process Designer 两条落地路径。

## 一、为什么一枚应变片会"看错"应变

先看一个工程现场常见的困惑。同一根金属圆棒上贴一枚应变片做验收：轴向拉的时候读数 200 微应变，一切正常；换成扭转载荷，读数几乎是零——可谁都知道扭转在 45° 方向产生的是实打实的拉应变。更换弯曲工况，读数又只剩一半上下。三种载荷、三种读数，片还是那枚片、棒还是那根棒。

原因很朴素：**应变片的栅丝只测量沿栅丝方向的线应变**，其余分量一概看不见。平面内一点的完整应变状态要三个独立分量才能描述——沿两个互相垂直方向的正应变，再加一个切应变（后文用符号时再逐个给出）。一枚片只提供一个方向的投影，信息量天生不足。扭转工况里，沿轴向的线应变确实近似为零，片没坏，是"提问的方式"错了。

这就像**只带一支温度计量一杯混合液**：温度计插在哪个位置，只能报出那一个点的温度，而杯中各处温度并不均匀；想知道整杯的温度分布，得同时在不同位置插几支。应变花（Rosette Strain Gauge）干的就是这件事——把三枚单轴应变片按固定角度（如 0°-45°-90° 或 0°-60°-120°）集成到同一基底上、聚焦到同一个小区域，一次测三个方向的投影，平面应变场的三个独立分量就齐了。温度计类比还能顺带解释后文一个选择问题：三支温度计插得越聚拢，越接近"同一点"的状态，但挤在一起互相挡光散热也越难——应变花的 Stacked（叠层）与 Planar（平面）两种排布，纠结的正是同一对矛盾。

公开技术资料用图 1 说明同样的道理：同一根圆棒承受轴向拉伸、扭转、弯曲三种载荷，只有轴向拉伸时单轴应变片的读数才完整可信。

![同一根圆棒三种载荷下单轴应变片的适用性](/images/rosette-strain-gauges/fig1-loads.png)
*（图源：网络 侵删）*

## 二、两种描述平面应变的语言：应变张量与主应变

测到手三方向读数之后，工程上有两套"语言"来描述同一点的应变状态，先分清它们才看得懂后面的公式。

第一套是**应变张量**语言：固定一个 xy 坐标系，用 $\varepsilon_x$、$\varepsilon_y$、$\gamma_{xy}$ 三个分量描述。这是 CAE 仿真默认的输出方式。第二套是**主应变**语言：把坐标系转到特定角度，使切应变恰好为零，剩下两个正应变即主应变 $\varepsilon_1$（最大）与 $\varepsilon_2$（最小），外加主方向角。这是试验与疲劳评估常用的语言。

::: info 核心概念
- <strong>应变张量（Strain Tensor）</strong>：在给定 xy 坐标系下，用两个正应变与一个切应变描述一点平面应变状态的方法，CAE 仿真的默认输出
- <strong>主应变（Principal Strain）</strong>：旋转坐标系使切应变为零后的两个正应变，$\varepsilon_1$ 最大、$\varepsilon_2$ 最小，其方向即主方向；零件疲劳寿命由最大应变决定
- <strong>应变花（Rosette Strain Gauge）</strong>：三枚单轴应变片按固定角度集成于同一基底的传感器，三方向读数联立可解出完整平面应变场
:::

两套语言之间的翻译靠**应变变换**（strain transformation）——任意方向角的线应变都可以由张量分量算出来。这个公式回答的问题是：坐标系转过 $\theta$ 角后，新方向上的线应变是多少？其中 $\varepsilon_x$、$\varepsilon_y$ 对应物理里沿 x、y 的正应变，$\gamma_{xy}$ 是工程切应变，$\theta$ 是新方向相对 x 轴的夹角——温度计类比里，它相当于"换一支角度的温度计后读数怎么变"：

$$\varepsilon_{\theta} = \varepsilon_x \cos^2\theta + \varepsilon_y \sin^2\theta + \gamma_{xy} \sin\theta \cos\theta$$

主应变就是应变变换的极值情况。这个公式回答的问题是：转到什么角度、切应变归零后，剩下的两个正应变（主应变）各是多少？其中 $R$ 对应物理里莫尔圆的半径（最大切应变的一半），分式部分是圆心（平均应变）——莫尔圆上主应变正是圆与横轴的两个交点：

$$\varepsilon_{1,2} = \frac{\varepsilon_x + \varepsilon_y}{2} \pm \sqrt{\left(\frac{\varepsilon_x - \varepsilon_y}{2}\right)^2 + \left(\frac{\gamma_{xy}}{2}\right)^2}$$

主方向角由下式给出，注意莫尔圆上的角度是物理角的两倍：

$$\theta_p = \frac{1}{2} \arctan\!\left(\frac{\gamma_{xy}}{\varepsilon_x - \varepsilon_y}\right)$$

这套换算用**莫尔圆**（Mohr's Circle）可视化最直观：横轴正应变、纵轴切应变，把 $(\varepsilon_x, \gamma_{xy})$ 与 $(\varepsilon_y, -\gamma_{xy})$ 两点连线为直径画圆——圆心是平均应变，与横轴的两个交点就是主应变，半径就是最大切应变的一半。相关技术手册图 3、图 4 分别给出张量/主应变两种视角与莫尔圆的构造。

![应变张量与主应变两种视角](/images/rosette-strain-gauges/fig3-tensor-principal.png)
*（图源：网络 侵删）*

![莫尔圆：由应变分量图解主应变与最大切应变](/images/rosette-strain-gauges/fig4-mohr.png)
*（图源：网络 侵删）*

为什么必须揪出主应变？公开技术资料说得直接：**零件的疲劳寿命由最大应变决定**。拿一个较小的分量应变去算寿命，寿命会被高估、零件会比预测坏得更早。这正是开篇"被仿真部门打回"的原因——单片读数常常既不是主应变、方向也没对齐主方向。

还有一个工程细节：CAE 输出的是应变张量、试验报告的是主应变，两者对标时必须用应变变换先统一语言，直接拿 $\varepsilon_x$ 对 $\varepsilon_1$ 是对标中的常见错误。

## 三、应变花本体：三片栅丝各占一个角度

应变花把三枚单轴片按固定角度集成在同一基底上，贴一次片、测三个方向。金属条上贴装平面三角花的实况见图 5。

![应变花：三枚共点应变片集成于同一基底](/images/rosette-strain-gauges/fig5-rosette-bar.png)
*（图源：网络 侵删）*

三枚片各出一路应变时间信号（图 6），联立即可反解平面应变场。

![应变花三路应变信号](/images/rosette-strain-gauges/fig6-three-signals.png)
*（图源：网络 侵删）*

投入三路测量，回报是多少？相关技术手册的账本：三路实测应变 + 材料弹性模量 $E$ 与泊松比 $\nu$，可算出**九个输出量**——最大/最小主应力 SS1、SS2，最大/最小主应变 SN1、SN2，主方向角 AG，切应力 SH，工程切应变 SNSH，von Mises 等效应力 ES，双轴比 BR。三换九，投入产出比一比三。

<strong>矩形花（Rectangular，0°-45°-90°）</strong>：两枚片落在 x、y 轴上，第三枚在 45°，见图 7。角度布置让数学最简。

![矩形应变花示意图](/images/rosette-strain-gauges/fig7-rectangular.png)
*（图源：网络 侵删）*

矩形花的张量分量反解只需一行。这个公式回答的问题是：三方向读数 $\varepsilon_0$、$\varepsilon_{45}$、$\varepsilon_{90}$ 如何直接给出张量分量？其中 $\varepsilon_{45}$ 对应物理里 45° 方向的线应变，它恰好把 $\gamma_{xy}/2$ "夹带"在正应变投影里，所以系数是 2：

$$\gamma_{xy} = 2\varepsilon_{45} - \varepsilon_0 - \varepsilon_{90}, \qquad \varepsilon_x = \varepsilon_0, \quad \varepsilon_y = \varepsilon_{90}$$

<strong>三角花（Delta，0°-60°-120°）</strong>：三枚片相隔 60°、中片对准 y 轴，角度覆盖更宽，见图 8。其张量分量反解同样规则，只是三方向投影的系数阵不同。

![三角应变花示意图](/images/rosette-strain-gauges/fig8-delta.png)
*（图源：网络 侵删）*

主应变算出后，应力由平面应力胡克定律给出（$E$ 为弹性模量、$\nu$ 为泊松比，钢的典型值 $E = 210000$ MPa）。这个公式回答的问题是：已知主应变如何换算主应力？其中 $\nu\,\varepsilon_{2,1}$ 对应物理里泊松效应——一个方向的伸长会通过横向收缩"耦合"出另一方向的应力：

$$\sigma_{1} = \frac{E}{1-\nu^2}\left(\varepsilon_1 + \nu\,\varepsilon_2\right), \qquad \sigma_{2} = \frac{E}{1-\nu^2}\left(\varepsilon_2 + \nu\,\varepsilon_1\right)$$

<strong>叠层（Stacked）与平面（Planar）</strong>：理想情况下三枚片应测"同一点"。叠层把三枚片堆叠在同一点正上方——测的是真正的同点应变，适合应变梯度大的区域，但层层堆叠散热差；平面把三枚片错开排在同一平面——散热好、适合应变梯度小的区域。回到温度计类比：三支温度计挤在同一位置最接近"同点"，但互相挡了彼此的热路；稍微错开各自散热顺畅，代价是测的不再是严格同一点。选哪种，看被测点应变梯度与散热需求。

## 四、双轴比与临界平面分析：主应变之外的两问

<strong>双轴比（Biaxiality Ratio）</strong>是主应力的比值（绝对值大者恒在分母，保证取值在 -1 到 1 之间）。这个公式回答的问题是：两个主应力"量级上谁配谁"？其中 $|\sigma_1| > |\sigma_2|$ 的约定对应物理里把大者放分母，使结果可正可负、可直接查表判状态：

$$BR = \frac{\sigma_2}{\sigma_1} \quad (|\sigma_1| > |\sigma_2|)$$

三个刻度值对应三种典型状态：$BR = 0$ 是单轴拉/压；$BR = -1$ 是纯剪；$BR = 1$ 是两向等应力（静水拉/压成分）。双轴比是 Testlab ROSETTE 虚拟通道计算的标准输出之一。

<strong>临界平面分析（Critical Plane Analysis）</strong>回答另一类问题：主应变给出的是"某时刻最大的应变"，但疲劳损伤关心的是**哪个方向上累积的损伤最大**。做法是把应变时间历史在 0° 到 170°、每 10° 一个平面上全部算出来（图 9），对每个平面的历程做雨流计数、算损伤，损伤最大的角度就是临界平面。主应变与临界平面各有分工：前者找"最大绝对应变"，后者找"最具损伤潜力的方向"——对多轴非比例加载，两者可能不在同一方向。

![临界平面分析：从三路应变算任意角度的应变历程](/images/rosette-strain-gauges/fig9-critical-plane.png)
*（图源：网络 侵删）*

## 五、numpy 复算：三路读数到九个输出

下面用一段自包含代码把矩形花的全链路跑一遍：三路读数 → 张量分量 → 莫尔圆主应变/主方向 → 主应力/双轴比/最大切应变，并用应变变换回代 45° 读数做自检：

```python
import numpy as np

# 矩形花三路读数（微应变）：0/45/90 度
e0, e45, e90 = 200.0, 150.0, -100.0

# 1) 反解张量分量
ex, ey = e0, e90
gxy = 2*e45 - e0 - e90                      # 工程切应变

# 2) 莫尔圆：圆心与半径 -> 主应变、主方向
cen = (ex + ey) / 2
R   = np.hypot((ex - ey)/2, gxy/2)          # 半径 = 最大切应变(张量)/2
e1, e2 = cen + R, cen - R
th_p = 0.5*np.degrees(np.arctan2(gxy, ex - ey))

# 3) 应力换算（平面应力胡克定律，钢）
E, nu = 210000.0, 0.29                      # MPa
s1 = E/(1-nu**2) * (e1 + nu*e2) * 1e-6      # MPa
s2 = E/(1-nu**2) * (e2 + nu*e1) * 1e-6
BR  = s2/s1
gmax = e1 - e2                              # 最大工程切应变

print(f"主应变: e1={e1:.1f}, e2={e2:.1f} ue, 主方向 {th_p:.1f} deg")
print(f"主应力: s1={s1:.1f} MPa, s2={s2:.1f} MPa, BR={BR:.3f}")
print(f"最大工程切应变: {gmax:.1f} ue")

# 4) 自检：用应变变换回代 45 度方向读数
def eps_theta(ex, ey, gxy, deg):
    t = np.deg2rad(deg)
    return ex*np.cos(t)**2 + ey*np.sin(t)**2 + gxy*np.sin(t)*np.cos(t)
print(f"回代45度: {eps_theta(ex,ey,gxy,45):.1f} ue (应等于 {e45})")
```

输出（实测）：主应变 $e_1 = 230.3$、$e_2 = -130.3$ 微应变，主方向 $16.8°$；主应力 $\sigma_1 = 44.1$ MPa、$\sigma_2 = -14.6$ MPa，双轴比 $-0.330$（拉压混合、偏剪切状态）；最大工程切应变 360.6 微应变；回代 45° 得 150.0 微应变，与读数吻合，链路自洽。值得注意的是：0° 片读数 200 微应变比真正的主应变 230.3 低了约 13%——如果载荷方向再偏一点，单片低估的幅度还会更大，这就是必须用应变花的原因。

## 六、Testlab 落地：实时虚拟通道与离线两条路

<strong>实时：Virtual Channels。</strong> 在 Testlab Signature 采集中，Channel Setup 右上角下拉切到 Virtual Channels（图 10），底部出现公式区；点 f(x) 按钮选 Strain gauges 函数组，按花的类型选 delta 或 rectangular（图 11），在 Edit formula arguments 里填三路通道、弹性模量与泊松比（钢的弹性模量 210000 MPa，图 12），确认后时间文件里生成九路 rosette 计算通道（图 13）。

![Channel Setup 切到 Virtual Channels](/images/rosette-strain-gauges/fig10-virtual-channels.png)
*（图源：网络 侵删）*

![f(x) 函数选择：Strain gauges 组](/images/rosette-strain-gauges/fig11-edit-formula.png)
*（图源：网络 侵删）*

![Edit formula arguments：三通道+材料参数](/images/rosette-strain-gauges/fig12-timefile.png)
*（图源：网络 侵删）*

![时间文件中的九路 rosette 输出通道](/images/rosette-strain-gauges/fig13-neo-results.png)
*（图源：网络 侵删）*

<strong>离线：Time Signal Calculator。</strong> 采集后的数据用 TSC 同样的 ROSETTE 函数补算。最大切应变默认不在九个输出里，需手动补一行：最大切应变（张量口径）= (SN1 - SN2)/2，即主应变差除二。

<strong>Testlab Neo Process Designer。</strong> 方法库 Combined Methods 区有两种现成方法：Rosette（0-45-90 与 0-60-120）算主应变/主应力/切应变/切应力/角度/双轴比等；Critical Plane（0-45-90 与 0-60-120）按 0° 到 170° 每 10° 输出应变历程，接上损伤计算即可定位最危险角度。通道指定支持通道号（C1、C2、C3）或 DOF ID 通配（如 \*45\* 匹配 45° 通道名），填弹性模量与泊松比后运行；多个 rosette 就建多个方法、用 Pass 方法各分一路。图 13 也是 Neo 处理结果的典型视图：最大主应变（绿）、最小主应变（红）与角度（蓝）随时间变化一目了然。

## 七、小结

- 单轴片只测栅丝方向投影，平面应变场要三个独立分量——应变花三片定角集成，一次测齐
- 两套语言必须分清：CAE 出应变张量、试验出主应变，对标先做应变变换；疲劳寿命由最大主应变决定，用小了寿命被高估
- 矩形花 $\gamma_{xy} = 2\varepsilon_{45} - \varepsilon_0 - \varepsilon_{90}$ 一行反解张量，莫尔圆给主应变/主方向/最大切应变的几何全貌；三路读数换九个输出
- 双轴比分状态（0 单轴、-1 纯剪、1 等双轴），临界平面分析找损伤最大的角度——主应变与临界平面各管一问
- Testlab 两路落地：Signature 实时 Virtual Channels、离线 Time Signal Calculator；Neo Process Designer 的 Rosette 与 Critical Plane 方法，接损伤计算直接回答"哪个角度最危险"

## 一句话记住

单轴片只见一个方向的投影、会低估最大应变，应变花用三片定角读数反解整个平面应变场：张量分量一行算出、莫尔圆给出主应变与主方向，三路读数换九个输出，疲劳评估认主应变、临界平面找最伤角度。

---

*作者：@NVH_Z · [NVH Test](https://www.nvhtest.cn/blog/) · 本文采用 [CC BY-NC-ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/deed.zh-Hans) 许可，禁止搬运*
