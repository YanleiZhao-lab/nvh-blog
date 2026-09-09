---
title: "试验-仿真模态对标：Simcenter 3D 中的 MAC 相关分析实操"
---

# 试验-仿真模态对标：Simcenter 3D 中的 MAC 相关分析实操

> 同一阶模态，仿真算出来 31.2 Hz、试验测出来 29.4 Hz，差了快 6%——这个有限元模型还能信吗？直接拿频率逐个对比行不通：模型里 20 阶模态、试验里只有十几阶，谁跟谁比都还没定。本文用 Simcenter 3D FE Model Correlation 的完整流程（Nastran 特征值解、导入试验几何与振型、对齐、配对、MAC 热图与 COMAC）回答这个问题，并给出判读规则：频率误差看趋势、MAC 看振型一致性、COMAC 指认拖后腿的测点。

## 一、为什么频率对上了也不敢下结论

一个真实场景：飞机发动机短舱（nacelle）的有限元模型做完 normal modes 计算，模态试验也已经在实物上完成。分析师最想做的事，是确认"这个模型能代表造出来的真实结构"——模型可信，才敢用它算强度裕度、才敢削减安全系数、才敢把后续的设计迭代从台架搬到计算机上。

但"对答案"这件事远比想象中麻烦。第一个障碍是**对不上号**：仿真列出 20 阶模态，试验识别出 14 阶弹性模态，两边的阶数编号没有任何理由一一对应——试验漏掉某阶、仿真多算出一阶，都极为常见。第二个障碍是**振型没有标尺**：模态振型是数学意义上的特征向量，仿真侧可以单位质量归一化，试验侧留数自带任意复数比例，直接比较分量毫无意义。第三个障碍是**两个模型不在一个坐标系里**：试验几何由传感器坐标拼成，与 FEM 网格坐标系之间往往差着一个未知的平移与旋转。

::: info 核心概念
- **MAC（Modal Assurance Criterion，模态置信判据）**：两个振型向量共线程度的度量，取值 0～1，接近 1 表示两个振型在所有测点上成比例
- **MSF（Modal Scale Factor，模态比例因子）**：把一个振型缩放到另一个振型标尺上的最优比例常数，只在 MAC 高时有意义
- **COMAC（Coordinate Modal Assurance Criterion）**：MAC 的逐测点版本，指认"哪个传感器的数据拖了相关性的后腿"
- **配对（Mode Pairing）**：在试验模态与仿真模态之间建立一一对应关系的步骤，默认以 MAC 最大且超过阈值为准则
:::

这三件事——对号、去标尺、进同一个坐标系——就是模态对标要解决的全部前置问题，Simcenter 3D 的 Correlation 工具条把它们的操作串成了一条流水线。

## 二、MAC：振型一致性的度量

先把直觉摆出来。比较两个振型，等价于比较两个 N 维向量——试验的 51 个传感器读数排成一列，仿真在这 51 个坐标位置上的计算值排成另一列。如果两列数字成比例（哪怕差一个负号或任意复数因子），说明两个"形状"完全一致，MAC 应等于 1；如果两列毫不相干，MAC 应接近 0。

这就像判断两张照片拍的是不是同一栋楼：不必逐像素比对（像素值受光照、相机参数影响），而看轮廓——线条走向一致就是同一栋楼。振型的"轮廓"就是各测点幅值的相对大小分布，MAC 度量的正是这个相对分布的吻合程度，对整体缩放天然免疫。

下面这个公式回答的问题是：两个振型向量"成不成比例"该怎样写成一个 0 到 1 之间的数？其中分子对应物理里两个振型的内积取模再平方——两个向量在各测点上同号同幅比例的部分相干叠加；分母是各自能量的乘积，起归一化作用，保证结果与振型的绝对大小无关。它是复数向量夹角余弦的平方。

$$\mathrm{MAC}_{AX} = \frac{\left| \sum_{i=1}^{N} \psi^A_i \left(\psi^X_i\right)^{*} \right|^2}{\sum_{i=1}^{N} \left| \psi^A_i \right|^2 \sum_{i=1}^{N} \left| \psi^X_i \right|^2}$$

其中 $\{\Psi_A\}$ 与 $\{\Psi_X\}$ 是要比较的两个振型（试验与仿真），$N$ 是两侧公共的模态自由度（测点）数，上标 $*$ 表示复共轭。若两组振型各有多阶，MAC 排成 $L_A \times L_X$ 的矩阵，第 $(j,k)$ 元即试验第 $j$ 阶与仿真第 $k$ 阶的吻合度。

判读规则在谱系上很简单：对角元高（>0.9）说明配对成功、振型一致；非对角元低说明试验模态之间相互独立（重根或密频模态挤在一起时非对角元会抬高）。但频率与 MAC 是两个独立指标——频率准不代表振型准；对结构修改预测而言，振型错了比频率错了更致命，因为修改灵敏度正比于振型值（见[模态设计工具箱](theory/modal-analysis/modal-design-toolbox.html)）。

一个 5% 的频率误差该不该修模型，取决于它的来源：整体弹性模量偏低是材料/连接刚度假设问题，个别阶偏差大则要查局部建模（焊点、螺栓、材料厚度）。逐阶频率误差表配合 MAC 矩阵，才能把"模型不对"细化为"哪里不对"。

## 三、完整流程：从 Nastran 解到 COMAC 图

以下流程基于 Simcenter 官方知识库的短舱算例：半短舱 FEM 与实物模态试验（模型与试验件均为半短舱），目标是两边各 14 阶弹性模态的相关分析。

![短舱 FEM 与试验件](/images/test-simulation-correlation/nacelle-fem-test.png)

*(图源：Simcenter Testing Knowledge Base)*

### 第 1 步：FEM 自由模态解

在 simulation navigator 里对顶层 sim 节点右键 **New Solution**，解算类型选 **SOL 103 Real Eigenvalues**（实特征值）。Case Control 页签中 Lanczos data 处 **Create Modeling Object**，期望模态数填 **20**。求解完成后前 6 阶是刚体模态（结构整体平移转动、无内部应变），后 14 阶才是待对标的弹性模态——Simcenter 3D 默认会把低频刚体模态过滤掉。

这里选自由-自由（free-free）边界而非约束态，是有对标层面的考虑：自由边界让刚体模态显式出现，既验证了质量分布（刚体频率趋零说明无多余约束），也避免试验悬挂系统刚度差异混入弹性模态对比。

### 第 2 步：导入试验几何与结果

Ribbon 的 **Correlation** 标签页里点 **New Test Reference Solution**，Solution Type 选 **Modal Test Data**，然后选择包含试验几何（传感器位置、坐标系、迹线）的 Geometry File 与包含振型和频率的 Modes File。本例中两者同属一个文件。确定后 sim 文件里出现第二个解，当前激活的是试验解，FEM 显示为灰色。

### 第 3 步：对齐试验模型

在 Solution 1 下选 **Test Model** 节点，右键 **Show Model**（再点 Show Sensors 可见三向传感器阵列）。短舱算例里试验几何与 FEM 明显不共享全局坐标系：

![试验模型与 FEM 未对齐](/images/test-simulation-correlation/test-model-misaligned.png)

*(图源：Simcenter Testing Knowledge Base)*

对齐操作在 Test Model 节点右键 **Alignment**：在 Alignment Control 对话框里选 3 个试验节点与 FEM 上对应的 3 个节点（勾选 Preview 可实时查看累计效果），必要时用 **Fine Tune Alignment** 做离散平移/旋转微调。

![Alignment Control 对话框](/images/test-simulation-correlation/alignment-control.png)

*(图源：Simcenter Testing Knowledge Base)*

这步没有公式但极为关键：后续节点映射按"距离最近"原则匹配传感器与 FEM 节点，坐标系没对齐时距离全是错的，容差再大也映射不上几个点。

### 第 4 步：建立相关分析

Correlation 标签页里点 **New Correlation**，Reference Solution 选试验解、Work Solution 选 normal modes 解。Node Map Settings 里给匹配容差——算例取 **75 mm**：距离小于该值的传感器-FEM 节点对视为同一位置。基于前一步对齐结果，软件把 **51 个传感器**映射到了 FEM 节点上，两边振型就在这 51 个位置上比较。选不同的对齐节点对，括号里映射成功的节点数会变——映射数本身就是对齐质量的反馈。

### 第 5 步：配对与结果查看

**Mode Pairing** 节点右键 Edit：默认准则是 MAC 最小值 **0.7**——试验与仿真模态中 MAC 最大且超过 0.7 的配成一对，配不上的单独暴露（算例中仿真第 12 阶就没有配到任何试验模态，这本身就是重要发现：要么试验漏测，要么该阶是计算假模态）。**Correlation Details View** 给出每个模态对的试验频率、仿真频率、频率误差百分比与 MAC：

![Correlation Details View](/images/test-simulation-correlation/correlation-details.png)

*(图源：Simcenter Testing Knowledge Base)*

任意一行右键 **Side-by-Side Animation**，两个视窗同步动画直接对比振型形态：

![Side-by-Side 动画](/images/test-simulation-correlation/side-by-side-animation.png)

*(图源：Simcenter Testing Knowledge Base)*

**Correlation Metrics** 节点右键 **Correlate**，对话框里 **Show Results Heat Map** 以热图显示 MAC 矩阵，**Show Results Spreadsheet** 可导出 Excel：

![MAC 热图](/images/test-simulation-correlation/mac-heatmap.png)

*(图源：Simcenter Testing Knowledge Base)*

热图的读法：横轴试验模态、纵轴仿真模态，对角线亮说明配对成功；某行整行发暗说明该阶仿真模态在试验数据中找不到对应者。最后右键 **Generate 1-COMAC Results**，输出逐传感器图：

![COMAC 传感器图](/images/test-simulation-correlation/comac-sensors.png)

*(图源：Simcenter Testing Knowledge Base)*

COMAC 显示的是"个别 MAC 分量最差"的传感器位置——MAC 总分合格不代表每个测点都合格，个别传感器数据可疑（粘接松动、方向装反、坐标录错）时，COMAC 会把它们点名。

## 四、numpy 演示：一个反号测点如何现形

用 51 个测点的简支梁振型做一个最小可复现算例：仿真侧 3 阶振型，试验侧第 1、2 阶各带任意缩放（3.2 倍、-0.8 倍——检验 MAC 对标尺免疫）与 5% 噪声，另把测点 17 的传感器极性装反（模拟方向贴错），观察 MAC 与 COMAC 的反应。

```python
import numpy as np

N = 51                                    # 传感器数
x = np.linspace(0, 1, N)
beam = lambda k: np.sin(k*np.pi*x)        # 简支梁解析振型
rng = np.random.default_rng(7)
sim = {"S1": (beam(1), 31.0), "S2": (beam(2), 122.5), "S3": (beam(3), 268.0)}
t1 = 3.2*beam(1) + rng.normal(0, .05, N)          # 试验第1阶：任意缩放+噪声
t2 = -0.8*beam(2) + rng.normal(0, .05, N); t2[17] *= -1   # 第2阶：反号+测点17极性反
test = {"T1": (t1, 29.4), "T2": (t2, 119.1)}

def mac(a, b):
    return abs(np.vdot(a, b))**2 / (np.vdot(a, a).real*np.vdot(b, b).real)

print("MAC 矩阵（行=试验，列=仿真）")
for tn, (ta, _) in test.items():
    print(" ", tn, [round(mac(ta, sa), 3) for sa, _ in sim.values()])
for tn, (ta, tf) in test.items():
    for sn, (sa, sf) in sim.items():
        if mac(ta, sa) > 0.7:
            print(f"配对 {tn}-{sn}: MAC={mac(ta,sa):.3f}  频率误差 {100*(tf-sf)/sf:+.1f}%")

t2f = t2.copy(); t2f[17] *= -1
print(f"修正测点17极性后 T2-S2 MAC: {mac(t2f, beam(2)):.3f}")

def comac1(pairs):                        # 1-COMAC：MSF 缩放后逐点残差
    res = np.zeros(N)
    for a, b in pairs:
        msf = np.vdot(b, a)/np.vdot(a, a).real
        res += np.abs(a - msf*b)**2/np.vdot(a, a).real
    return res/len(pairs)

c1 = comac1([(t1, beam(1)), (t2, beam(2))])
worst = np.argsort(c1)[::-1][:3]
print("1-COMAC 最差 3 测点:", [(int(i), round(float(c1[i]), 3)) for i in worst])
```

运行输出：

```
MAC 矩阵（行=试验，列=仿真）
  T1 [1.0, 0.0, 0.0]
  T2 [0.004, 0.874, 0.0]
配对 T1-S1: MAC=1.000  频率误差 -5.2%
配对 T2-S2: MAC=0.874  频率误差 -2.8%
修正测点17极性后 T2-S2 MAC: 0.994
1-COMAC 最差 3 测点: [(17, 0.104), (23, 0.017), (34, 0.017)]
```

三个现象值得注意。其一，T1 带着任意缩放 3.2 倍、T2 带着反号缩放 -0.8 倍，MAC 照样等于 1.000 与 0.874——标尺免疫是 MAC 的设计目的，复共轭内积把任意复数因子约掉了。其二，单个测点极性反号让 T2 的 MAC 从 0.994 掉到 0.874：51 个分量里只错了 1 个，总分就被拉低 12 个百分点——反过来说，看到 0.87 这种"不错但不到 0.9"的分数时，不该急着怀疑整个模型。其三，1-COMAC 把测点 17 的残差（0.104）标成次差测点（0.017）的 6 倍，一查一个准——这正是 Simcenter 3D 里 Generate 1-COMAC Results 在做的事。

频率误差一栏则演示了两个指标的分工：T1-S1 频率差 -5.2% 而 MAC 完美，说明振型形状对但质量/刚度整体偏了；若 MAC 也低，问题就不只是标定，得回查建模假设与试验识别。

## 五、工程判读规则与常见坑

**频率误差与 MAC 要连起来读**。四种组合四种结论：频率准 MAC 高——模型可信；频率偏 MAC 高——标定问题（弹性模量、密度、连接刚度整体偏），值得修；频率准 MAC 低——先查试验（测点太稀漏掉振型节点、参考点不足漏模态）再查模型；频率偏 MAC 低——模态对错了或结构建模有实质错误。单看任何一个指标都可能误判。

**测点数量是 MAC 的硬约束**。振型向量只有 51 维，两阶模态在这 51 个坐标上的采样若不足以区分彼此（例如测点恰好都落在两阶振型的公共节点附近），MAC 会虚高。MAC 高是"在这些测点上成比例"，不是数学意义上振型相同——测点布置要覆盖每阶模态的腹点与节点（参见[MAC 的空间混叠问题](theory/modal-analysis/modal-assurance-criterion.html)）。

**对齐与容差决定映射质量**。映射成功的节点数写在括号里：51 个传感器映射上 51 个，说明对齐良好；只有二三十个，先回去重做 Alignment，别急着解读 MAC——用错位置配对的振型分量算 MAC，毫无意义。75 mm 只是短舱算例的取值，实际取传感器间距量级，过大会把相邻节点混配，过小则映射数骤减。

**刚体模态先过滤**。低频刚体模态两侧都有但不是对标对象，Simcenter 3D 默认过滤，手动处理时也应剔除——刚体模态对质量分布敏感，混入弹性模态对比会引入无关误差。

**MAC 阈值 0.7 不是合格线**。0.7 是"配对"的默认门限——超过它才建立一一对应，低于它的模态对暴露出来人工审查。工程验收惯用 0.9 以上视为振型一致，但更稳妥的做法是看趋势：同一模型迭代中 MAC 逐轮升高，比单次 0.85 更有说服力。

## 六、小结

试验-仿真对标的输出不是"模型对/错"的判决，而是一张诊断表：MAC 热图定振型一致性、频率误差表定参数标定、COMAC 图定可疑测点、未配对模态定两侧各自的漏项。Simcenter 3D 把这条流水线做成了可视化操作——New Test Reference Solution 导试验、Alignment 对坐标系、New Correlation 配节点映射、Mode Pairing 建对应、Correlate 出热图、1-COMAC 点名传感器——每一步的中间结果（映射节点数、配对数）都是对上一步质量的即时反馈。模型通过对标建立可信度之后，安全系数的削减、设计迭代的虚拟化才有依据。

## 一句话记住

对标三步走：先对齐坐标系、再配对模态、最后读数——MAC 管振型像不像、频率误差管标定准不准、COMAC 管哪个测点在捣乱；未配对的模态不是垃圾数据，是两侧各自的待办清单。
