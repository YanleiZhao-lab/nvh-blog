---
title: "隔声量测量：传声损失TL的实验室方法"
---

# 隔声量测量：传声损失TL的实验室方法

> 发动机舱噪声经前壁板透入乘员舱、排气噪声经消声器壳体外泄——这类隔声问题均以传声损失（Sound Transmission Loss，STL）为评价指标。本文依照 Simcenter Testing 理论手册，说明 STL 的定义、计算式与频率特性，定量分析材料覆盖率与开孔泄漏的影响，并给出阻抗管法与房间法两类实验室测量路线的原理、推导与适用边界。

## 一、声波到达屏障的三种去向与 TL 定义

声波到达屏障时只有三种去向：被**吸收**（absorption，声能转化为热）、被**反射**（reflection，返回声源侧）、**透射**（transmission，穿过屏障到达另一侧）。隔声设计的目标是将透射份额降至最低。

![声波到达屏障后被吸收、透射或反射](/images/sound-transmission-loss/fig1-barrier-fate.png)

*（图源：Simcenter Testing Knowledge Base）*

**透射系数**（transmission coefficient）定义为透射声功率与入射声功率之比：

$$
\tau = \frac{W_t}{W_i}
$$

其中 $W_i$ 为入射声功率（W），$W_t$ 为透射声功率（W）。传声损失取透射系数倒数的对数表达：

$$
\mathrm{TL} = 10\,\lg\frac{W_i}{W_t} = -10\,\lg\tau \quad \mathrm{dB}
$$

两式合并的物理意义：$\tau$ 是线性标尺上的能量比，TL 把跨越多个数量级的 $\tau$ 压缩为分贝标尺——$\tau$ 每减小为原来的十分之一，TL 增加 10 dB。TL 越大，隔声性能越好。例如 TL = 30 dB 对应 $\tau = 10^{-3}$，即仅有千分之一的入射声能透过屏障。

::: info 核心概念
- **传声损失（Sound Transmission Loss，STL/TL）**：入射与透射声功率之比的分贝值，衡量声学处理阻止声能透过的能力
- **入射声功率 $W_i$**：入射到材料表面的总声功率（W）
- **透射声功率 $W_t$**：透过材料到达另一侧的声功率（W）
- **频率依赖性**：TL 是频率的函数，同一材料在不同频段的隔声性能差异显著
:::

TL 是频率的函数，这是选材与评估的前提。同一只消声器，在 2050 Hz 处可将入射声能衰减 10 dB，在 3500 Hz 处却几乎不产生衰减（图 2）。仅依据单一"总隔声量"数值选择材料，可能在关键频段出现隔声不足，评估与选材应始终核对 TL-频率曲线。

![传声损失随频率变化，同一消声器在2050Hz衰减10dB而3500Hz几乎不衰减](/images/sound-transmission-loss/fig2-tl-vs-freq.png)

*（图源：Simcenter Testing Knowledge Base）*

## 二、覆盖率与开孔对传声损失的影响

工程上降低透射声的常见做法是在板件上敷设一层声学材料。两个物理因素决定实际效果往往显著低于材料样品的标称 TL：覆盖率不足与开孔泄漏。

**覆盖率不足。** 声学材料未完全覆盖板件时，裸露区域的透射声能几乎不受衰减。手册给出的对比实验：方板完全覆盖、裸露 3%、裸露 25% 三种工况相比，仅 3% 的裸露面积即可使 TL 显著下降；裸露面积从 3% 扩大到 25% 带来的进一步下降，远小于出现第一个裸露区造成的损失，且高频段影响更为显著。

![材料覆盖率对传声损失的影响，3%裸露即显著降低TL](/images/sound-transmission-loss/fig3-coverage.png)

*（图源：Simcenter Testing Knowledge Base）*

**开孔泄漏。** 在声学处理上开孔同样降低有效 TL，高频段尤为明显。对比全覆盖、1% 开孔、5% 开孔三种工况：1% 的小孔即造成可观的 TL 损失；孔面积继续扩大到 5% 时的增量损失，小于第一个孔造成的影响。

![开孔泄漏对传声损失的影响，高频段损失尤为明显](/images/sound-transmission-loss/fig4-holes.png)

*（图源：Simcenter Testing Knowledge Base）*

上述规律可用面积加权的等效透射系数定量表达。设板件满覆盖时的传声损失为 $\mathrm{TL}_0$，泄漏（裸露或开孔）面积占比为 $\varepsilon$；泄漏区声能近似无衰减透过（$\tau \approx 1$），覆盖区透射系数为 $10^{-\mathrm{TL}_0/10}$，按面积加权求和：

$$
\tau_{\mathrm{eff}} = (1-\varepsilon)\cdot 10^{-\mathrm{TL}_0/10} + \varepsilon
$$

$$
\mathrm{TL}_{\mathrm{eff}} = -10\,\lg \tau_{\mathrm{eff}} \quad \mathrm{dB}
$$

推导的物理意义：透过屏障的总声功率是覆盖区与泄漏区贡献的面积加权和；$\tau$ 是线性量而 TL 是其对数表达，因此小面积的全透射泄漏足以主导总透射能量。以 $\mathrm{TL}_0 = 30$ dB 为例，$\varepsilon = 1\%$ 时 $\tau_{\mathrm{eff}} = 0.99\times 10^{-3} + 0.01 \approx 0.011$，等效 TL 降至约 19.6 dB；$\varepsilon = 5\%$ 时约为 12.9 dB。

::: warning 工程注意
从完全覆盖到出现第一个泄漏孔，TL 的下降幅度远大于孔面积继续扩大带来的增量损失，高频段受影响最深。排查整车隔声问题时，应优先封堵线束过孔、踏板孔、风窗下沿等首发泄漏点，其收益高于额外加贴吸声垫。材料样品的 TL 曲线对应理想满覆盖条件，装车状态必然存在折减，不应直接以样品数据承诺整车隔声指标。
:::

## 三、实验室测量路线

TL 与声源无关，可用扬声器等实验室声源测量，无需在实车现场实测（in-situ）。手册将测量方法分为两大类：阻抗管法与房间法，其中房间法又有声强—声压、声压—声压两种实现：

| 方法 | 声场条件 | 适用对象 | 结果产出 |
| --- | --- | --- | --- |
| **阻抗管法** | 管中平面波，垂直入射 | 消声器、管道系统、小样件 | TL-频率曲线 |
| **双室声强法** | 混响室 + 消声室 | 仪表板、车门、前壁板等大件 | TL 曲线 + 透射声强云图 |
| **双混响室声压法** | 混响室 + 混响室 | 建筑隔墙、门窗、大样件 | TL 曲线（倍频程呈现） |

### 阻抗管法：小件与声学元件

阻抗管（impedance tube）是一根厚壁钢管，一端接输出宽带声波的声源，被测件装夹在管中间，声波以平面波形式垂直入射到样件表面。管上布置四个传声器拾取入射侧与透射侧声场。

![阻抗管示意，样件安装于管中间](/images/sound-transmission-loss/fig5-impedance-tube.png)

*（图源：Simcenter Testing Knowledge Base）*

Simcenter Testlab 采用**四传声器传递矩阵法**（transfer matrix method）求解 STL：把被测件视为二端口声学元件，其两侧状态量之间由传递矩阵联系：

$$
\begin{bmatrix} p_1 \\ v_1 \end{bmatrix} =
\begin{bmatrix} T_{11} & T_{12} \\ T_{21} & T_{22} \end{bmatrix}
\begin{bmatrix} p_2 \\ v_2 \end{bmatrix}
$$

其中 $p_1$、$v_1$ 与 $p_2$、$v_2$ 分别为样件入射侧与透射侧的声压（Pa）和质点振速（m/s），由四个传声器测得；矩阵系数 $T_{11}\sim T_{22}$ 表征样件自身的声学属性，是待求未知数。一组负载工况只提供两个方程，无法解出四个未知数，因此必须做**两种负载工况**——典型组合为刚性末端与无反射（消声）末端——共获得四个方程解出矩阵，进而由矩阵系数计算 TL。

::: tip 两负载法优于两声源法
- 更换末端负载（如更换一段管件）简单快捷，声源与传声器电缆均无需移动
- 移动的是廉价管件，而非昂贵易损的声源
- 两种末端分别为：刚性封死末端与消声末端
:::

::: warning 工程注意
样件与管壁之间必须密封贴合。测消声器时，入口管与阻抗管出口、出口管与第二段管均须对接紧密，任何缝隙都会使 TL 测值失真。样件进出口直径与管径不一致时需用锥形转接件，Simcenter Testlab 提供锥度修正功能，可将转接影响从结果中扣除。
:::

### 双室声强法：大件与泄漏定位

混响室（reverberant room）内用全向声源营造**扩散声场**（diffuse field），样件安装在混响室与消声室（anechoic room）之间的开口中——消声室提供自由场条件，避免反射声在定位结果中形成虚假的透射位置。消声室侧用声强探头（sound intensity probe）或 Simcenter Soundbrush 扫描样件表面。

此方法下 STL 由入射声压级与透射声强级计算。从 TL 的定义出发：$W = I\,S$ 对入射、透射两侧均成立，代入定义式得

$$
\mathrm{STL} = 10\,\lg\frac{I_i S_i}{I_t S_t} = \left(L_{I_i} - L_{I_t}\right) + 10\,\lg\frac{S_i}{S_t} \quad \mathrm{dB}
$$

其中 $S_i$、$S_t$ 分别为入射面积与透射面积（m²），$L_{I_i}$、$L_{I_t}$ 为相应的声强级（dB，基准 $1\,\mathrm{pW/m^2}$）。入射侧为扩散声场，声波从各方向随机入射，界面上的入射声强与均方声压满足 $I_i = \overline{p^2}/(4\rho c)$——分母中的因子 4 来自随机入射方向的平均（法向入射平面波为 $\overline{p^2}/\rho c$）。把均方声压换算为声压级 $L_{P_i}$（dB，基准 $20\,\mu\mathrm{Pa}$）、声强换算为声强级，并取空气特性阻抗 $\rho c \approx 415\ \mathrm{N{\cdot}s/m^3}$，单位换算并入的常数项为

$$
10\,\lg\frac{4\rho c \cdot I_{\mathrm{ref}}}{p_{\mathrm{ref}}^2} \approx 6.18 \ \mathrm{dB}
$$

于是

$$
\mathrm{STL} = L_{P_i} - L_{I_t} - 6.18 + 10\,\lg\frac{S_i}{S_t} \quad \mathrm{dB}
$$

对平样件 $S_i = S_t$，面积项消失，公式简化为只含入射声压级、透射声强级与综合常数 6.18（涵盖空气密度与声速）三项：

$$
\mathrm{STL} = L_{P_i} - L_{I_t} - 6.18 \quad \mathrm{dB}
$$

![混响室与消声室布置，样件装于两室之间](/images/sound-transmission-loss/fig9-two-room-intensity.png)

*（图源：Simcenter Testing Knowledge Base）*

该方法的附加产出是**透射声强云图**：扫描得到样件表面的声强分布，可直接定位透射通道。整车前壁板隔声排查时，云图能指出过孔、缝隙等漏声位置，与 TL-频率曲线配合使用。

![前壁板透射声强云图，直接定位漏声位置](/images/sound-transmission-loss/fig11-intensity-map.png)

*（图源：Simcenter Testing Knowledge Base）*

### 双混响室声压法：建筑与部件规范测量

发送室与接收室均为混响室，样件装在连通两室的开口里。两侧各用旋转传声器架或多点传声器测平均声压级，声源置于发送室。TL 按两室平均声压级之差并对接收室吸声量修正计算，推导如下：发送室内扩散声场入射到样件的声功率为 $W_i = \overline{p_1^2}\,S/(4\rho c)$；接收室在稳态下吸收功率等于透射功率，$W_t = \overline{p_2^2}\,A/(4\rho c)$，其中 $A$ 为接收室等效吸声量（equivalent sound absorption area，m²）。代入 TL 定义：

$$
\mathrm{STL} = 10\,\lg\frac{\overline{p_1^2}\,S}{\overline{p_2^2}\,A} = L_1 - L_2 + 10\,\lg\frac{S}{A} \quad \mathrm{dB}
$$

其中 $L_1$、$L_2$ 为发送室与接收室平均声压级（dB），$S$ 为样件面积（m²）。$S/A$ 项的物理意义：接收室吸声量越大，同样透射功率对应的声压级越低，修正项将测得的声压级差换算为功率比。等效吸声量按赛宾公式由混响时间（reverberation time）求出：

$$
A = \frac{0.16\,V}{T} \quad \mathrm{m^2}
$$

其中 $V$ 为接收室容积（m³），$T$ 为接收室混响时间（s）。

![双混响室法布置，两侧各测平均声压级](/images/sound-transmission-loss/fig13-two-room-pressure.png)

*（图源：Simcenter Testing Knowledge Base）*

::: tip 方法选择原则
- 消声器、进排气管道、小材料样品：**阻抗管法**，样件小、频率分辨率高
- 前壁板、车门、仪表板等整车部件，且需要定位泄漏位置：**双室声强法**
- 建筑隔墙、门窗类规范件：**双混响室声压法**，结果常按倍频程给出
- 三者测的都是材料或部件的固有属性，不依赖实际声源
:::

## 四、Python演示：从能量比到分贝

```python
import numpy as np

# TL 定义演示：能量比 -> 分贝
for wi_wt in [1, 0.5, 0.1, 0.01, 0.001]:
    tl = 10 * np.log10(wi_wt)          # 能量透射比取对数
    print(f"透射声能占比 {wi_wt*100:6.1f}%  ->  TL = {tl:6.1f} dB")

print()
# 覆盖率/开孔效果演示：复合结构等效 TL
tl_panel = 30.0        # 材料满覆盖时 TL(dB)
area = 1.0             # 板件总面积
for leak in [0.0, 0.01, 0.03, 0.05, 0.25]:
    a_ok, a_leak = area * (1 - leak), area * leak
    # 覆盖区透射能量按 10^(TL/10) 衰减，泄漏区直通
    wt = a_ok * 10**(-tl_panel / 10) + a_leak * 1.0
    tl_eff = 10 * np.log10(area / wt)
    print(f"泄漏面积 {leak*100:4.0f}%  ->  等效 TL = {tl_eff:5.1f} dB")
```

运行结果要点：能量占比每降低一个数量级，TL 增加 10 dB；第二组数据与第二节的 $\tau_{\mathrm{eff}}$ 公式一致——TL 30 dB 的材料留 1% 泄漏孔，等效 TL 降至 19.6 dB，泄漏扩大到 5% 时等效 TL 仅剩 12.9 dB。"首个泄漏造成的损失最大"的规律在数值上得到直接验证。

## 五、小结

选隔声材料应核对 TL-频率曲线，不使用单值；排查整车隔声优先封堵首发泄漏孔，高频段受益最大；消声器与管道件采用阻抗管两负载法，前壁板、车门、仪表板采用双室声强法并同时获得泄漏云图，建筑类规范件采用双混响室声压法。
