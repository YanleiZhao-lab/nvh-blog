---
title: "加速度计大全：原理、类型与选型决策"
---

# 加速度计大全：原理、类型与选型决策

> 同一只 100 mV/g 的加速度计，在锤击模态试验里是称职的主力，搬到整车路试车上就是过载红灯常亮的"罪魁祸首"——传感器没坏，是灵敏度和量程没跟工况匹配。本文把压电（电荷/IEPE）、压阻、变电容、MEMS 四类加速度计的原理逐个拆开，说清灵敏度、量程、频响三条选型红线，以及安装、接地、电缆这些"传感器之外"的坑。

同一场整车耐久路试，两套采集系统测同一个悬置点：一套读到的峰值 8 g，另一套只有 0.8 g，差了整整十倍。检查半天，两套都是名牌加速度计，都没坏——一套插的是 100 mV/g 的模态试验传感器，剧烈路面下输出电压早顶穿了采集卡 10 V 的满量程，削波之后幅值被压平、还往别的频率倒灌能量；另一套插的是 10 mV/g 的工况测量传感器，量程富余、读数正常，但反过来用它去做锤击模态，激出的响应只有几十毫伏，FRF 上全是毛刺。同一个物理振动，两只都"没坏"的传感器，一只过载一只欠载，都交不出合格数据。加速度计选型不是一个"买哪个牌子"的问题，而是灵敏度、量程、频响三根红线与工况的对表，外加安装与电缆两个现场变量——这篇文章把这张对表一次讲透。

![图1](/images/accelerometers-comprehensive/fig1.png)

*变速箱箱体上安装的加速度计，蓝线接入 Simcenter SCADAS 采集硬件完成模态试验（图源：Siemens Simcenter Testing Knowledge Base）*

## 一、为什么加速度计像个挂在车上的挂坠

把加速度计想成一只**挂在卡车后视镜上的挂坠**：车一加速，挂坠因为惯性往后甩；车一刹车，它往前荡。挂坠从来不直接知道车在怎么动，它只知道"被甩得多厉害"——而这恰恰够了：挂坠被甩的力正比于车的加速度，量出这个力，就反推出了加速度。加速度计内部就是这套"挂坠"的微缩版：一个已知质量的敏感质量块（seismic mass）压在一片能"感力"的元件上，外壳随被测物振动时，质量块的惯性对元件施加交变的力，元件把这个力转换成电信号输出。

四类加速度计的差别，全在"感力元件"这一环用的是什么物理效应：

- **压电式（PE/IEPE）**：元件是石英或压电陶瓷晶体，受力就输出电荷——像一块"一捏就发电"的水晶；
- **压阻式（PR）**：元件是应变片，受力变形改变电阻——像"一拉就变阻"的弹簧秤；
- **变电容式（VC）**：元件是平行板电容，质量块位移改变极板间距从而改变电容——像"一压就变容"的可变电容；
- **MEMS**：变电容原理的微加工版，整个"挂坠+电容"缩进毫米级硅片，手机里那颗就是它。

这个挂坠比喻还有第二层：挂坠挂得太松（胶粘、磁吸），高频时挂坠来不及跟上车的动作，读数开始失真；只有拧死在车身上（螺柱安装），挂坠才能原样复现车的高频运动——这正是后文"安装方式决定可用频带上限"的物理根源。

## 二、选型三根红线：灵敏度、量程、频响

翻开任何一份加速度计规格书（datasheet），密密麻麻几十项参数里，决定"能不能用"的是三项。

![图2](/images/accelerometers-comprehensive/fig2.png)

*加速度计规格书示例：灵敏度、量程与频响是三项核心选型参数（图源：Siemens Simcenter Testing Knowledge Base）*

### 2.1 灵敏度：电压摆幅与噪声地板的拉锯

先看数字再谈定义：一只 100 mV/g 的加速度计遇到 10 g 振动，输出 1 V；同一只遇到 0.1 g 的微小振动，输出只剩 10 mV——而采集系统噪声地板就有毫伏量级，信号再小就要被淹没。所谓灵敏度（sensitivity），就是"每单位加速度输出多少电压"这个换算系数。这个公式回答的问题是：**已知灵敏度和加速度，传感器会输出多大电压？**其中 $S$ 对应物理里传感器的"翻译效率"，$a$ 对应物理里被测的加速度激励——线性换算，一步到位：

$$
V = S \cdot a
$$

其中 $S$ 是灵敏度（mV/g），$a$ 是被测加速度（g）。100 mV/g 比 10 mV/g"灵"十倍：同样的振动，前者输出的电压是后者的十倍。

![图3](/images/accelerometers-comprehensive/fig3.png)

*不同型号加速度计与其灵敏度（图源：Siemens Simcenter Testing Knowledge Base）*

灵敏度选高还是选低，本质是"信号够不够大"与"会不会顶穿量程"的拉锯：

- **100 mV/g**：模态试验等低激励场合的标准选择。锤击激出的响应小，高灵敏度把信号抬到远高于采集系统噪声地板的位置，FRF 干净；
- **10 mV/g**：工况测量（路试、台架耐久）的常规配置。振动水平高，低灵敏度避免输出电压冲破采集卡量程（常见 ±10 V）造成过载；反过来，把 10 mV/g 用在模态试验里，信号贴着噪声地板，相干函数一路趴在低位。

一个可直接套用的数字判断：100 mV/g 传感器配 ±10 V 采集卡，理论满量程 100 g；10 mV/g 则是 1000 g。预估的工况峰值落在谁的地盘里，就用谁。

### 2.2 量程与最大电压：两条上限取其低

![图4](/images/accelerometers-comprehensive/fig4.png)

*灵敏度乘量程等于传感器最大输出电压（图源：Siemens Simcenter Testing Knowledge Base）*

传感器能承受的加速度上限（如 ±500 g peak）与采集系统能接收的电压上限（如 ±10 V）是两条独立的红线，实际可用范围由更紧的那条决定。传感器满量程输出 5 V 而采集卡只有 ±1 V 档位时，物理上没超传感器上限的振动也会把 ADC 顶饱和。选型时把"灵敏度 × 量程"先乘出来，与采集系统的电压档位对一遍。

### 2.3 频响：平直段在哪，可用带宽就在哪

![图5](/images/accelerometers-comprehensive/fig5.png)

*三只传感器的频响对比：Sensor 3 平直段最宽（图源：Siemens Simcenter Testing Knowledge Base）*

回到挂坠：挂坠和挂绳本身就是一个"质量-弹簧"系统，有自己的固有频率。激励频率逼近固有频率时，同样的加速度会激励出格外大的摆动（共振放大），频响曲线不再平直——Sensor 1、2、3 三条曲线在各自固有频率前的抬升就是这个原因。规定"单一灵敏度换算"有效的前提，是只在平直段内使用。

![图6](/images/accelerometers-comprehensive/fig6.png)

*加速度计的可用带宽：取平直段，高频端远离自身共振峰（图源：Siemens Simcenter Testing Knowledge Base）*

工程惯例是可用上限取固有频率的约三分之一，保证幅值误差在可忽略范围。低频端的限制则来自另一处：IEPE 传感器内置恒流源供电，信号骑在直流偏置上，必须用高通滤波把偏置与信号分离，低频截止由此产生——压电原理决定了它测不了真正的 0 Hz（静态重力），这正是下一节四类传感器分野的关键。

## 三、四类传感器：从"一捏发电"到硅片上的电容

### 3.1 压电式：一捏就发电的晶体

"Piezo"源自希腊语"挤压"。石英或压电陶瓷晶体受力时，内部电荷分布改变，表面出现与应力成正比的电荷。

![图7](/images/accelerometers-comprehensive/fig7.png)

*压电晶体受力变形并输出电荷（变形已夸张显示）（图源：Siemens Simcenter Testing Knowledge Base）*

![图8](/images/accelerometers-comprehensive/fig8.png)

*石英晶体内部原子在应力下的重新排布产生压电效应（图源：Siemens Simcenter Testing Knowledge Base）*

内部结构万变不离三件套：晶体、质量块、预紧环。

![图9](/images/accelerometers-comprehensive/fig9.png)

*剪切型压电加速度计剖面：预紧环、晶体与质量块（图源：Siemens Simcenter Testing Knowledge Base）*

质量块的惯性力压在晶体上，预紧环保证整个"挂坠"系统刚性连接、行为线性——还记得第一节挂坠的比喻吗？预紧环就是"把挂坠挂结实"的那道工序。压电效应是可逆的：反过来给晶体加电场它会变形，压电促动器用的正是这一侧。

![图10](/images/accelerometers-comprehensive/fig10.png)

*压电晶体受力产生电压的简化模型（图源：Siemens Simcenter Testing Knowledge Base）*

**电荷型（PE）**：晶体直接输出微小电荷（皮库仑 pC 量级），传感器内无任何电子元件，因此耐高温高寒（排气管、冷冻环境），但信号极怕干扰——电缆内两种材料相互摩擦产生的摩擦电噪声（triboelectric effect）足以淹没信号，必须用含导电碳粒的低噪声电缆并沿途固定。

![图11](/images/accelerometers-comprehensive/fig11.png)

*电荷型加速度计的电缆固定方案，抑制摩擦电效应（图源：Siemens Simcenter Testing Knowledge Base）*

信号调理有三条路：超高阻抗直采、外置电荷放大器、或 Siemens SCADAS VC8 卡直接入卡调理。

![图12](/images/accelerometers-comprehensive/fig12.png)

*电荷型加速度计的三种信号调理方案（图源：Siemens Simcenter Testing Knowledge Base）*

用 VC8 卡时，Testlab 通道设置的 Input Mode 会出现 Charge 选项，电量单位自动设为 pC。

![图13](/images/accelerometers-comprehensive/fig13.png)

*Testlab 通道设置：电荷输入模式（图源：Siemens Simcenter Testing Knowledge Base）*

**IEPE 型**（Integrated Electronics Piezoelectric，亦称 ICP/CCP）：把电压放大器做进传感器壳体，输出低阻抗（100~300 欧姆）电压信号，由采集系统经 4 mA 恒流源供电——信号与供电共用一根同轴线。好处是普通电缆即可、设置简单；代价是内置电子元件不耐高温（排气、热交换器场合先查温度规格），且恒流偏置必须用高通滤除，故测不了静态加速度。IEPE 还支持 TEDS（Transducer Electronic Data Sheet，传感器电子数据表）：序列号、灵敏度、校准有效期存在传感器芯片里，采集系统一读即得，杜绝手输错误。

![图14](/images/accelerometers-comprehensive/fig14.png)

*IEPE 加速度计的两种信号调理配置（图源：Siemens Simcenter Testing Knowledge Base）*

两类压电传感器的取舍一句话：IEPE 胜在简单便宜（少电缆、免放大器），PE 胜在极端环境（高低温）。

![图15](/images/accelerometers-comprehensive/fig15.png)

*IEPE/ICP/CCP 与 PE/电荷加速度计优缺点总结（图源：Siemens Simcenter Testing Knowledge Base）*

::: info 核心概念
- **压电式（Piezoelectric）**：晶体受力输出电荷，只响应动态（交变）加速度，测不了 0 Hz；分电荷型（PE，外置调理、耐极端温度）与 IEPE 型（内置放大、恒流供电、普通电缆）
- **压阻式（Piezoresistive）**：应变片受力变形改变电阻，直流耦合，可测静态（重力、恒加速）
- **变电容式（Variable Capacitance）**：质量块位移改变电容极板间距，差动测量，可测静态
- **MEMS**：微机电系统（micro-electromechanical systems），硅片微加工的变电容加速度计，手机与嵌入式监测的主流
:::

### 3.2 压阻式：测得了重心的"直流加速度计"

压阻（PR）传感器用应变片替代晶体：质量块加在悬臂梁上，加速度使梁弯曲，梁上应变片电阻随之变化，惠斯通电桥把电阻变化转成电压。因为测的是电阻（直流激励下即可工作），PR 是直流耦合——能测 0 Hz，静态的 1 g 重力分量会原原本本出现在读数里。这既是它的独特价值（操稳试验里的向心加速度、缓慢的倾角变化），也是用前必须处理的麻烦（要去掉重力分量才能得到运动加速度）。PR 传感器可做得极小，冲击碰撞试验常用。SCADAS 上需 VB8 卡提供直流耦合与供电。

![图16](/images/accelerometers-comprehensive/fig16.png)

*压阻/直流加速度计的基本结构（图源：Siemens Simcenter Testing Knowledge Base）*

### 3.3 变电容式与 MEMS：硅片上的"挂坠"

变电容（VC）传感器里，质量块连着可动电极，在两片固定电极间上下运动，加速度改变两侧电容 C1、C2，差动测量放大微小的电容差。MEMS 加速度计是 VC 原理的微加工版："质量块"做成梳状指，在固定电极间来回移动。两者都直流耦合、可测静态，MEMS 更以极致小型化统治了手机与嵌入式监测，但精度与动态范围一般不满足工程研发要求，试验室里少见。

![图17](/images/accelerometers-comprehensive/fig17.png)

*变电容加速度计：质量块连接可动电极（图源：Siemens Simcenter Testing Knowledge Base）*

![图18](/images/accelerometers-comprehensive/fig18.png)

*基于变电容原理的 MEMS 设计（图源：Siemens Simcenter Testing Knowledge Base）*

## 四、传感器之外：安装、质量与电缆

### 4.1 安装方式决定可用频带

第一节挂坠比喻的第二层在这里兑现：安装越“刚”，高频越“真”。螺柱安装频带最宽，蜂蜡、瞬干胶次之，磁铁安装更窄，手持探针最差。安装接触面加一薄层硅脂能提高贴合度、改善高频响应。曲面或不平表面可用斜切垫块（modal guide）保持全局坐标方向，但垫块本身也是“挂坠”，可能改变局部频响，用前须评估。

![图19](/images/accelerometers-comprehensive/fig19.png)

*各种安装方式对频响的影响：连接越刚，频带越宽（图源：Siemens Simcenter Testing Knowledge Base）*

![图20](/images/accelerometers-comprehensive/fig20.png)

*斜切垫块用于曲面安装并保持全局坐标方向（图源：Siemens Simcenter Testing Knowledge Base）*

接地隔离同样关键：传感器壳体与被测结构直接导通时，电网的地电位差会以地环（ground loop）形式窜入信号——欧洲 50 Hz、美国 60 Hz 的谱线尖峰即来源于此，与被测振动无关。隔离垫片从物理上切断这个回路。

![图21](/images/accelerometers-comprehensive/fig21.png)

*地环噪声（左）与隔离垫片（右）（图源：Siemens Simcenter Testing Knowledge Base）*

### 4.2 质量加载：传感器不能比试件“重”

大传感器装在薄板小件上，附加质量和刚度会搬动被测结构的模态频率。轻小结构件优先用微型传感器；模态试验可用多轮次试验（multi-run）策略分离传感器质量的影响。

### 4.3 电缆：测量链上最脆弱的一环

电缆比传感器更容易损坏。四条现场军规：留松弛量防拽、沿线固定防甩、远离动力线防电磁感应、潮湿环境做滴水环防冷凝水顺线流进接头。

![图22](/images/accelerometers-comprehensive/fig22.png)

*滴水环：让冷凝水沿环流走，进不了传感器（图源：Siemens Simcenter Testing Knowledge Base）*

长电缆还有物理层面的限制：电缆电阻随长度增大，分布电阻与电容构成 RC 低通网络，电缆越长高频衰减越重。厂家提供的诺谟图（nomograph）按输出电压、供电电流与电缆电容给出可用频率上限，长线测试前查一遍。

![图23](/images/accelerometers-comprehensive/fig23.png)

*诺谟图：按电压、电流、电缆电容查最高可用频率（图源：Siemens Simcenter Testing Knowledge Base）*

## 五、开测之前：校准与通道设置

### 5.1 现场校准

哪怕灵敏度已知且已录入软件，开测前把传感器装到便携校准器上敲一遍仍是标准动作——校准器给一个已知频率已知幅值的振动，读数对得上，说明接线、供电、灵敏度设置整条链路都正确。每年还应送厂家做全频段校准。

![图24](/images/accelerometers-comprehensive/fig24.png)

*便携式现场校准器（图源：Siemens Simcenter Testing Knowledge Base）*

### 5.2 Testlab 通道设置

Classic 界面在 Channel Setup 页签逐项设置：通道开关 ON、Channel Group 选 Vibration、Point ID 命名测点、Direction 填方向（+X 等）、**Input Mode 选 ICP**（IEPE 传感器必选，漏选则完全无数据）、Measurement Quantity 选 Acceleration、逐通道填灵敏度（三向传感器三个方向灵敏度各不相同，照抄标定证书）。有 TEDS 的传感器用 Read TEDS 一键读入。Neo 界面流程相同，Input Mode 更名为 Conditioning。

![图25](/images/accelerometers-comprehensive/fig25.png)

*Testlab Classic 通道设置速查（图源：Siemens Simcenter Testing Knowledge Base）*

![图26](/images/accelerometers-comprehensive/fig26.png)

*Testlab Neo 的 Channels 页签（图源：Siemens Simcenter Testing Knowledge Base）*

### 5.3 一个 numpy 对账：灵敏度选错的代价

四种工况峰值（模态锤击 0.5 g、怠速 8 g、路试冲击 80 g 与 150 g）分别用 100 mV/g 与 10 mV/g 传感器接入正负 10 V 采集卡，看输出电压落在哪个区间：

```python
import numpy as np

VCARD = 10.0                          # 采集卡满量程 ±10 V
cases = [("模态锤击", 0.5), ("怠速工况", 8.0), ("路试冲击", 80.0), ("路试冲击", 150.0)]
for name, g in cases:
    row = f"{name} {g:5.1f} g |"
    for S in (100, 10):               # 两种灵敏度 mV/g
        V = S * g / 1000              # 输出电压 = 灵敏度 × 加速度
        flag = "过载!" if V > VCARD else ("偏低" if V <= 0.05 else "合适")
        row += f"  {S:3d} mV/g -> {V:6.2f} V [{flag}]"
    print(row)
```

```text
模态锤击   0.5 g |  100 mV/g ->   0.05 V [偏低]   10 mV/g ->   0.01 V [偏低]
怠速工况   8.0 g |  100 mV/g ->   0.80 V [合适]   10 mV/g ->   0.08 V [合适]
路试冲击  80.0 g |  100 mV/g ->   8.00 V [合适]   10 mV/g ->   0.80 V [合适]
路试冲击 150.0 g |  100 mV/g ->  15.00 V [过载!]   10 mV/g ->   1.50 V [合适]
```

0.5 g 的锤击响应连 100 mV/g 传感器都只输出 0.05 V（这正是模态试验还要靠多次平均与窗函数救信噪比的原因）；峰值一旦到 150 g，100 mV/g 传感器输出 15 V 顶穿正负 10 V 量程，10 mV/g 传感器输出 1.5 V 稳稳落在区间内——本文开头那场“8 g 对 0.8 g”的公案，数值结构与此完全同型：同一只“没坏”的传感器，换一个工况就从主力变成废数据制造机。

## 六、应用版图

加速度计的三大工程应用各有一套配套玩法：人体振动（手传振动、整车舒适性）要在通道上加装人体响应计权曲线；ODS 与模态分析把测点位置映射到几何上，让振动“动起来”；振动控制则让加速度计从旁观者变成闭环的眼睛，控制点传感器反馈给试验台驱动信号。

![图27](/images/accelerometers-comprehensive/fig27.png)

*手电钻顶端安装加速度计评估手传振动（图源：Siemens Simcenter Testing Knowledge Base）*

![图28](/images/accelerometers-comprehensive/fig28.png)

*测点位置映射到几何后可视化振动形态（图源：Siemens Simcenter Testing Knowledge Base）*

![图29](/images/accelerometers-comprehensive/fig29.png)

*振动台闭环控制：加速度计反馈驱动台面复现目标谱（图源：Siemens Simcenter Testing Knowledge Base）*

## 七、小结

选型决策收敛成一串对表动作：先问动态还是静态（静态选 PR/VC/MEMS，动态选压电）；再问温度（极端温度选 PE 电荷型，常规选 IEPE）；然后按预估峰值选灵敏度与量程（“灵敏度 × 量程”对照采集卡电压档）；按最高关心频率核对平直频响（上限约取固有频率三分之一）；最后落实现场三件事——安装刚度、接地隔离、电缆保护。每一环都对上，数据才可信。

## 一句话记住

加速度计是顶着重物的挂坠：挂坠甩多狠正比于加速度（灵敏度换算），挂得多紧决定高频能测多准（安装刚度与固有频率三分之一）；选型四问——测不测静态、耐不耐温度、峰值多大、频带多宽——分别导向 PR/VC、PE、灵敏度量程对表、平直段核查，而 IEPE 用普通电缆、PE 用低噪声电缆是现场最容易踩的那颗钉子。
