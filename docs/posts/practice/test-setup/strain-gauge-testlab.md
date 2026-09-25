---
title: "应变片测量实操：Testlab 通道设置与桥路"
author: "@NVH_Z"
---

# 应变片测量实操：Testlab 通道设置与桥路

> 同一批贴好的 12 个应变通道，开测前的“调零、标定、复核”三连，有人十分钟收工、有人折腾一下午还飘红——差别多半不在手上功夫，而在通道设置里那几格下拉菜单选得对不对。原理篇已经讲过应变片如何把形变变成电阻、电桥如何把电阻变成电压（见[应变片原理与选型](/posts/practice/test-setup/strain-gauge-basics.html)）；这一篇接着讲落地：VB8 卡怎么接线、Testlab 与 Testlab Neo 里每个字段填什么、调零与分流标定按哪些按钮、以及“边测边标定”的 Shunt Measure Sequence 怎么在几百小时耐久中途发现试件已经屈服。全程用“体检”作类比：贴片是戴上传感器，调零是记下静息基线，分流标定是拿已知磝码现场校秤，Shunt Sequence 是试验中途的定期复诊。

## 一、为什么原理通了、上手还会卡住

应变片的信号链比加速度计“多一截”。IEPE 传感器恒流源供电、单线进 BNC，插上就出数；应变片却要自己搭半座电桥：供桥电压、桥臂电阻、引线、调零、分流标定——每一环在采集系统里都对应一个设置项，选错一格，轻则幅值差一个比例，重则通道整场飘红。原理篇算过一笔账：350 Ω 片、100 με 应变、GF=2 时电阻只变 0.07 Ω，四分之一桥 5 V 供桥输出仅 250 μV——毫伏级的小信号，对供电精度、接线质量和干扰的容忍度天然就低。

所以公开技术资料专门用一整篇文章讲“在 Simcenter Testlab 里测应变片”：硬件（VB8 卡）、接线（桥型与 LEMO 引脚）、软件（两个界面的通道设置）、标定（Bridge Nulling 与 Shunt Calibration）、归零（Zeroing/Balancing），直到测量（含自动分流序列）。本文化读官方全文，配公开资料插图与两张设置对照表，经典 Testlab 与 Testlab Neo 两条路各走一遍。

::: info 核心概念
- <strong>VB8-II / VB8-III 卡</strong>：SCADAS Mobile / Lab 机箱里的应变调理卡，每卡 8 通道，逐通道独立可选 ICP、电压、电桥（四分之一/半/全）、电位计与有源传感器调理——供桥、桥臂补全电阻、分流电阻、sense 线一应俱全
- <strong>分流标定（Shunt Calibration）</strong>：在桥臂上并联一枚已知精密电阻，制造一个可计算的“标准应变”，反推通道灵敏度——相当于用已知磝码现场校秤
- <strong>调零 / 平衡（Zeroing / Balancing）</strong>：贴片预应变与电桥初始不平衡会让通道开机就带读数，正式测量前把它归零——相当于体检前先记静息基线
:::

## 二、硬件与接线：VB8 卡和它的 7 芯 LEMO

先认卡。VB8 卡每通道软件可选调理档位，应变片相关的是 Bridge 档（四分之一/半/全桥）。卡上 8 个通道用 7 芯 LEMO-FGB.08.307 插座，随机附两种猪尾线各 8 根：LEMO 转 BNC（接 ICP 与电压类信号）和 LEMO 转开放线（接应变片、电桥、有源传感器等）。应变片必须焊到开放线这一种上。

![VB8-II 卡与随机附带的 LEMO 转 BNC、LEMO 转开放线两种线缆](/images/strain-gauge-testlab/fig1.png)
*（图源：网络官方公开资料）*

接线前先看引脚定义：供电、信号、sense 线在 7 芯里各有其位，全桥要把信号两根、供电两根都接满。

![VB8-II 卡 7 芯 LEMO 接口的引脚定义](/images/strain-gauge-testlab/fig2.png)
*（图源：网络官方公开资料）*

四分之一桥、半桥、全桥的常见接法官方给了一张接线图。经验法则只有一句：<strong>线越多，信号质量越好</strong>。全桥信号走两根线（差分输入），共模抑制天然成立，抗电磁干扰能力最强；四分之一桥与半桥信号只走一根线（单端输入），没有共模抑制可言——而应变片偏偏是“长导线 + 低电平”的组合，正是电磁干扰最爱的对象。能上全桥就上全桥，这是接线阶段能买到的第一份保险（单端与差分的机理详见[单端对差分输入](/posts/practice/test-setup/single-ended-vs-differential.html)）。

![四分之一桥、半桥、全桥在 VB8 卡上的常见接线方式](/images/strain-gauge-testlab/fig3.png)
*（图源：网络官方公开资料）*

两种使用场景官方都明确支持：应变片直连 SCADAS；或者经滑环（slip ring）接到旋转部件上的应变片——扭轴测扭矩就是典型。

## 三、经典 Testlab：Signature 的六步

### 第 1 步：Channel Setup 字段逐个填

打开 Testlab Signature 的 Channel Setup 工作表（有些字段默认隐藏，在 Tools 菜单的 Channel Setup Visibility 里调出来），需要逐一确认的字段如下。

<strong>Input Mode（输入模式）</strong>：按实际桥型选 Quarter / Half / Full Bridge，耦合方式（AC/DC）也在此一并选择——拿不准就选 DC，应变片的静态分量（平均载荷、温度效应）正是 DC 耦合要保住的信息。

![输入模式下拉菜单：桥型与 AC/DC 耦合一并选择](/images/strain-gauge-testlab/fig4.png)
*（图源：网络官方公开资料）*

<strong>Measure Quantity</strong>：测应变量选 Strain；用应变片式测力计则选 Force。

<strong>Bridge Supply（供桥电压）</strong>：电压低，信号小、易受干扰；电压高，片内焦耳热引起温漂（选型依据见[应变片原理与选型](/posts/practice/test-setup/strain-gauge-basics.html)）。默认 0 V 是刻意保护——不确认就上电可能损坏应变片，务必按片的规格手动设置。

<strong>Bridge Gage Resistance（桥臂电阻）</strong>：四分之一桥的补全电阻，常见 350 或 120 Ω，按应变片标定单填，可逐通道独立设置。

<strong>Bridge Strain Gage Factor（灵敏系数）</strong>：典型值 2 左右，同样以标定单为准。

<strong>Offset Zeroing（调零策略）</strong>：Always / Once / Never 三选一，默认 Always——执行调零操作时该通道自动归零。贴片通道保持 Always；非应变通道或特意要保留初始读数的通道设 Never。Once 模式很少用：只能在 Acquisition Setup 里从 Autorange 切到 Zeroing 执行一次，本意是试验布置阶段先归一次零、防止正式测量时被误再调零。

<strong>Actual Sensitivity（实际灵敏度）</strong>：mV/V/EU。标定算出来，或者规格书直接给。

<strong>Simulated Value（模拟值）</strong>：用应变片式传感器测非应变量（如测力计的力）时，在这里设 100 kΩ 分流对应的期望工程单位读数。

<strong>Range（量程）</strong>：应变通道默认且建议 0.1 V——不是 10 V。应变信号毫伏级，量程开太大，量化台阶相对信号过高（量化误差的账见[量化与量程](/posts/theory/signal-processing/gain-range-quantization.html)）。

![Channel Setup 中应变通道的各设置字段](/images/strain-gauge-testlab/fig5.png)
*（图源：网络官方公开资料）*

若产品说明书给出桥路类型编号（Type I / Type II 等），官方提供了“类型-设置”对照表，逐格照抄即可：

![桥路配置类型 Type I/II 与 Testlab 通道设置的对照表](/images/strain-gauge-testlab/table1.png)
*（图源：网络官方公开资料）*

### 第 2 步：Virtual Channels 顺路算

Channel Setup 右上角下拉里选 Virtual Channels，可以对应变通道实时做数学运算（加减乘除）、滤波、积分，甚至边测边算应变花（三片合成主应变，见[应变花 Rosette](/posts/practice/durability-testing/rosette-strain-gauges.html)）。耐久试验里“测两片、边测边减”分离弯曲与轴向载荷，就是在这里搭。

### 第 3 步：Calibration——两点定一次“现场校秤”

灵敏度已知（规格书给了 mV/V）可跳过本步，直接做第 4 步的校核。需要现场标定时，进 Calibration 工作表：右上角选 Bridge Settings，选中通道后依次按三个按钮——

1. <strong>Perform Bridge Nulling</strong>：先平衡电桥、把通道归零；
2. <strong>Perform Calibration</strong>：系统自动并上内部 100 kΩ 分流电阻，用“零点 + 分流点”两个已知数据点算出灵敏度；
3. <strong>Accept</strong>：确认保存。

![Calibration 工作表：右上角进入 Bridge Settings](/images/strain-gauge-testlab/fig6.png)
*（图源：网络官方公开资料）*

这套流程的物理内核，是把分流电阻制造的“标准电阻变化”折算成“标准应变”送给系统对秤。先看一笔具体数字：一枚 100 kΩ 精密电阻并在 350 Ω 应变片上，并联等效电阻约 348.78 Ω——阻值被压低了约 1.22 Ω，相对变化约 -0.349%，除以灵敏系数 GF=2 得约 -1744 με。这就是那块“标准磝码”的重量。把它写成通用式，下面这个公式回答的问题是<strong>“并联一枚分流电阻，相当于给通道加了多少标准应变”</strong>——其中 $R$ 对应物理里应变片的标称阻值（350 或 120 Ω），$R_s$ 是分流电阻阻值（VB8 内置默认 100 kΩ），$R \cdot R_s/(R+R_s)$ 是并联等效电阻，它相对 $R$ 的变化除以灵敏系数 $GF$ 就是这次校秤的标准应变：

$$
\varepsilon_{\text{shunt}} = \frac{1}{GF}\left(\frac{R \cdot R_s}{R + R_s}\Big/ R - 1\right) = \frac{1}{GF}\left(\frac{-R}{R + R_s}\right)
$$

负号只说明分流让阻值变小，标定取幅值。这台“秤”每次都加同一块磝码：同样 100 kΩ 并上去，读数偏离了理论值，通道灵敏度漂没漂立刻现形。

标定失败的常见原因都在现场：接线错误、贴片质量差、温度剧烈变化导致漂移。屏幕下方会给出大红报错，具体病因看 ShuntCalibrationStatus 字段——比如 Unstable Offset 意味着通道还在漂、没稳下来就标了。

![标定失败：屏幕底部出现 Error during Calibration](/images/strain-gauge-testlab/fig8.png)
*（图源：网络官方公开资料）*

![ShuntCalibrationStatus 字段给出失败的具体类型（如 Unstable Offset）](/images/strain-gauge-testlab/fig9.png)
*（图源：网络官方公开资料）*

右下角 Advanced 里有稳定性判据（默认要求信号至少 3 秒低波动）——贴片胶未固化、有人吹风、手扶构件都会让判据过不去。成功时状态条变绿：

![标定成功：底部状态条变绿，提示按 Accept 保存](/images/strain-gauge-testlab/fig10.png)
*（图源：网络官方公开资料）*

### 第 4 步：Shunt Check——随时可做的体检复核

任何时刻想确认应变通道健康，都可以做一次分流检查：Measure 工作表→ F3 Ranges→ F12 Shunt→ Start。系统把内置 100 kΩ 分流电阻并上，所有通道读数回绿即通过；某通道变红，说明该片、接线或试件本身出了问题。

![分流检查通过：全部通道状态为绿](/images/strain-gauge-testlab/fig11.png)
*（图源：网络官方公开资料）*

![分流检查失败：问题通道数值标红](/images/strain-gauge-testlab/fig12.png)
*（图源：网络官方公开资料）*

### 第 5 步：Zeroing——把静息基线归零

正式测量前调零：Measure 工作表→ F3 Ranges→ F11 Zero→ Start Zero，全绿后 Stop Zero 并 Set Offsets。哪些通道参与调零由第 1 步的 Offset Zeroing 字段（Always/Never/Once）决定。绝大多数应变片贴上后就带安装预应变，不调零则所有读数都背着一个常数偏置。

![Zeroing 调零操作界面](/images/strain-gauge-testlab/fig13.png)
*（图源：网络官方公开资料）*

### 第 6 步：Measure——开测，并打开 Shunt Measure Sequence

Arm 加 Start 开测。耐久试验强烈建议打开 <strong>Shunt Measure Sequence</strong>：Measure 工作表中部 More 按钮里勾选 Automatically Accept Measurement 与 Shunt measure sequence。此后每次测量前后，系统自动各录一段 3 秒的零点与分流记录（状态栏出现蓝色 Zeroing / Shunting 提示）。

![More 按钮里开启 Shunt measure sequence](/images/strain-gauge-testlab/fig15.png)
*（图源：网络官方公开资料）*

![测量前后自动执行的零点与分流记录（各 3 秒）](/images/strain-gauge-testlab/fig16.png)
*（图源：网络官方公开资料）*

这两段小记录就是“定期复诊”：把测量前后的零点与分流值一对比，试件在测量中段是否屈服、通道是否漂移，一目了然——几百小时的耐久里，它是唯一不依赖人工抽查的健康档案。

![前后零点/分流记录自动分开存储，可随时对比](/images/strain-gauge-testlab/fig17.png)
*（图源：网络官方公开资料）*

## 四、Testlab Neo：Time Data Acquisition 的四步

Neo 的应变采集在 Durability 文件夹的 Time Data Acquisition 程序里（Desktop 许可 + 16 token）。流程同样是“通道、标定、归零、测量”，只是界面语言换了。

### 第 1 步：Channels 视图

首页选 Channels 进入通道表，每行一个输入通道。Supply 列选供桥电压；Coupling 确认为 DC（应变片需要的供电方式）；通道接了但没供电会标红 X。右侧 Properties 面板或直接改表格单元格均可编辑。

![Testlab Neo Time Data Acquisition 的 Channels 视图](/images/strain-gauge-testlab/fig22.png)
*（图源：网络官方公开资料）*

Conditioning 里选应变调理类型（四分之一/半/全桥）。想要一屏看全桥路相关字段，切到 <strong>Bridge View</strong>——调理类型、桥臂阻值、供桥、偏置一列排开，专为应变通道准备的“专科视图”。

![Bridge View：桥路相关字段一屏排开](/images/strain-gauge-testlab/fig25.png)
*（图源：网络官方公开资料）*

桥路类型编号（Type I / Type II）同样有对照表：

![Type I/II 与 Neo 通道设置的对照表](/images/strain-gauge-testlab/table2.png)
*（图源：网络官方公开资料）*

### 第 2 步：Balancing / Zeroing 归零

Calibration 页→ Offset Calibration：勾选通道→ Balance→ 系统平衡惠斯通电桥并显示电偏置→ Apply 应用。再到旁边的 Zeroing 视图 Run 一次，把工程单位读数也归零。Neo 把“电桥平衡”（Balancing，消除电的不平衡）与“读数归零”（Zeroing，消除安装预应变的显示偏置）分成两步，语义更清楚。

![Calibration 页的 Balancing/Zeroing 功能](/images/strain-gauge-testlab/fig23.png)
*（图源：网络官方公开资料）*

### 第 3 步：Shunt Calibration 分流标定

对桥式传感器官方推荐一律做一次：并已知分流电阻、Balance、完成后 Apply。它标的是<strong>引线电阻</strong>——从采集箱到应变片那根长电缆的铜阻会分掉供桥电压（详细账目见[长导线应变测量](/posts/practice/test-setup/strain-long-cables.html)），分流标定把这份损耗一并计进灵敏度，长线场景尤其必要。

![Neo 的 Shunt Calibration 界面](/images/strain-gauge-testlab/fig25.png)
*（图源：网络官方公开资料）*

### 第 4 步：Measure 测量

Measurement 页 Arm 起振、Start 开测，右侧属性页可改 Run 名与平均次数等设置；测量中随时可做 Offset check 与 Shunt check。

## 五、两个界面，一份清单

把两条路并排看，字段一一对应：桥型对应 Conditioning，供桥对应 Supply，Offset Zeroing 对应 Balancing/Zeroing，分流标定两边同名。会用其中一个，另一个只是换了个门牌。

| 环节 | 经典 Testlab（Signature） | Testlab Neo（Time Data Acquisition） |
| --- | --- | --- |
| **通道设置** | Channel Setup 工作表（隐藏字段经 Channel Setup Visibility 调出） | Channels 视图（Bridge View 一屏排开） |
| **桥型选择** | Input Mode 下拉 | Conditioning 下拉 |
| **供桥电压** | Bridge Supply 字段 | Supply 列 |
| **归零** | Measure 工作表 F11 Zero（Offset Zeroing 定策略） | Offset Calibration 页 Balance 后 Apply，再 Zeroing |
| **分流标定** | Calibration 工作表 Bridge Settings | Calibration 页 Shunt Calibration |
| **健康复核** | F12 Shunt 任意时刻 | Offset check / Shunt check 测量中随时 |
| **自动序列** | Shunt Measure Sequence（测量前后各 3 秒零点/分流记录） | —— |

最后用一段 numpy 把“分流校秤”的账算出手感：同一枚 100 kΩ 分流电阻并在不同阻值、不同灵敏系数的片上，等效标准应变差多少——这就是为什么标定单上的 R 与 GF 必须逐片核对，不能全场抄一个数。

```python
import numpy as np

def shunt_eps(R, Rs=100e3, GF=2.0):
    Rp = R * Rs / (R + Rs)          # 并联等效电阻
    return (Rp / R - 1) / GF * 1e6  # 相对变化除以 GF，折算微应变

for R, GF, tag in [(350, 2.0, "350 ohm, GF=2.0"),
                   (350, 2.1, "350 ohm, GF=2.1"),
                   (120, 2.0, "120 ohm, GF=2.0")]:
    print(f"{tag:20s} -> {shunt_eps(R, GF=GF):9.1f} ue")

e2, e21 = abs(shunt_eps(350, GF=2.0)), abs(shunt_eps(350, GF=2.1))
print(f"GF 抄成 2.1 时标准应变偏小: {(1 - e21/e2)*100:.1f}%")
```

运行结果：350 Ω、GF=2.0 时约 -1743.9 με；灵敏系数抄成 2.1（标定单常见手误），同一块磝码读出的标准应变小了 4.8%；换 120 Ω 片则只有 -591.1 με——同一枚分流电阻在不同阻值、不同 GF 的片上读数完全不同，所以逐片按标定单填 R 与 GF 不是繁文缎节，是让“校秤”本身成立的前提。

## 一句话记住

应变通道上电前先对三样：桥型、供桥、R 与 GF 按标定单逐片填；测前 Balance 加 Zero 记静息基线、Shunt 拿标准磝码校秤，测中开 Shunt Sequence 前后留档——四件事做完，毫伏级小信号才敢信。

---

*来源：网络官方公开资料，经整理与复核。*

*作者：@NVH_Z · [NVH Test](https://www.nvhtest.cn/blog/) · 本文采用 [CC BY-NC-ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/deed.zh-Hans) 许可，禁止搬运*
