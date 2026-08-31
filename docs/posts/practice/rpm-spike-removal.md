---
title: "RPM 信号去毛刺：转速信号的清洗"
---

# RPM 信号去毛刺：转速信号的清洗

> 转速通道与振动通道一样存在系统性误差：偶发尖峰、掉线、每转固定位置的毛刺和斑马带接缝跳变，会在 colormap 与阶次切片上产生虚假的阶次成分。本文按 Simcenter Testing Knowledge Base 的分类梳理 RPM 信号常见误差模式的成因，并给出 Simcenter Testlab 中对应的处理方法、算法判据与参数选择依据。

## 一、转速通道的误差来源

工程上的一种常见认识是：振动通道需要关注传感器安装、量程与接地干扰，而转速通道贴一片反射片、打一束激光，得到的 RPM 曲线天然准确。实际 Run-up 项目的数据处理经验表明并非如此——**RPM 曲线上的毛刺（spike）与掉线（dropout）是常见现象**。一个偶发尖峰、一段掉线、或每转固定角度上的局部突起，都会在 colormap 上拉出虚假的阶次线，或使阶次切片在特定转速点上跳变。转速通道若不在处理阶段先行检查，后续阶次分析的可信度无法保证。

转速不是直接测量得到的，而是由相邻条纹的到达时间差换算得到。激光或其它光学装置对准条纹面（反射片、斑马带或码盘），记录每个脉冲的到达时刻 $t_k$。相邻脉冲的时间间隔为 $\Delta t_k = t_{k+1} - t_k$（单位 s），设每转脉冲数（Pulses Per Revolution, PPR）为 $P$，则第 $k$ 个间隔内的瞬时转速为

$$n_k = \frac{60}{P \, \Delta t_k} \quad (\mathrm{r/min})$$

即一个脉冲间隔对应 $1/P$ 转。对上式取对数微分，得到误差传递关系：

$$\frac{\mathrm{d} n_k}{n_k} = -\frac{\mathrm{d} (\Delta t_k)}{\Delta t_k}$$

脉冲间隔的相对误差等值反号地传递为转速的相对误差。因此任何影响单个脉冲到达时刻的因素——油污遮挡一条条纹、条纹印刷间距偏差、斑马带搭接——都会按此关系直接转化为转速曲线上的毛刺。这是三类误差共同的物理来源。

## 二、毛刺的三种典型类型

按 Simcenter Testing Knowledge Base 的分类，转速信号异常分为三类。

**第一类：偶发的尖峰或掉线。** 转速曲线整体平滑，个别时间点上 RPM 突然升高（spike）或跌落至零附近（dropout）。测试现场通常处于手册所称的恶劣环境（hostile environment）：轴面油污、粉尘使激光反射信号时好时坏，脉冲计数随之出错。台架存在切削液雾或金属屑飞溅的场合尤其常见。

![RPM 异常的两种形态](/images/rpm-spike-removal/rpm-anomalies.png)

*（图源：Simcenter Testing Knowledge Base）*

**第二类：每转固定位置上的规律毛刺。** RPM 曲线放大后可见，每一转的同一角度位置都出现一个固定的小尖。其来源不是环境，而是斑马带（zebra tape）或码盘上某一条条纹的间距、宽度存在制造偏差——每转到该角度，脉冲间隔错一次，转速计算随之错一次。这类毛刺的危害在于其严格周期性：它会在频谱上生成真实的阶次成分，与被测信号混叠在一起。

![每转固定位置出现的 RPM 毛刺](/images/rpm-spike-removal/spike-per-revolution.png)

*（图源：Simcenter Testing Knowledge Base）*

**第三类：斑马带接缝（butt joint）造成的假扭振。** 斑马带缠绕收尾处若留有豁口，脉冲间隔大于理论值，每转出现一次假的转速跌落（dip）；若两条纹挤压搭接，脉冲间隔小于理论值，每转出现一次假的转速尖峰（spike）。两者都是每转一次的系统性误差，与第二类同源，但成因在搭接处而非单条条纹。接缝误差的成因与修正流程见《[斑马带接缝修正](./zebra-tape-correction.html)》。

![激光与斑马带](/images/rpm-spike-removal/zebra-tape-laser.png)

*（图源：Simcenter Testing Knowledge Base）*

::: info
扭振（torsional vibration）测量要求每转内有足够的脉冲数来分辨一转之内的转速波动，因此扭振测试使用高 PPR 斑马带。PPR 越高，单个脉冲的计时误差对转速曲线的影响越直接，毛刺在曲线上也越明显。
:::

## 三、偶发毛刺：Time Data Editor 手动替换

偶发的尖峰和掉线，用 Simcenter Testlab 的 **Time Data Editor** 处理：将异常段框选后以直线替换。

操作路径：

1. 菜单 **Tools -> Add-ins**，勾选 **Time Data Editor - Standard**。Time Data Selection 工作表上方将增加一排编辑工具按钮。
2. 在左侧数据集中点亮待处理的转速时域 trace。
3. 在 Overview 显示区按住鼠标拖拽，框住毛刺前后的一小段。
4. 按 **[R]** 键执行替换，选中段被一条直线取代。

![框选毛刺段并按 [R] 替换后的效果](/images/rpm-spike-removal/spike-before-after.png)

*（图源：Simcenter Testing Knowledge Base）*

操作细节：

- 工具栏右上角有**设置开关**。开启时，每次按编辑键弹出对话框，可将"替换为直线"改为"替换为曲线"；关闭时不弹对话框，沿用上次设置直接执行。精细操作时建议开启，批量处理时关闭。
- **Undo/Redo 按钮在设置开关旁**，框选范围不合适时可以撤销重做。

![设置开关与 Undo/Redo 按钮](/images/rpm-spike-removal/settings-undo-buttons.png)

*（图源：Simcenter Testing Knowledge Base）*

- 完成编辑后，左侧有 **Save**（直接覆盖原数据）和 **Save As**（另存）两个选项。做修正操作时应另存——原始转速数据无法重测，覆盖后不可恢复。

::: warning
直线替换有一个必须权衡的副作用：**被替换段内的扭振信息——一转之内的转速波动——同时被直线抹除**。因此该方法适用于"保留整体转速曲线做阶次跟踪"的场景；若分析目标就是扭振本身，一转之内的转速波动正是待测信号，不应使用直线替换，应改用第四节的统计剔除函数。
:::

## 四、规律毛刺：统计剔除函数

每转固定位置出现的毛刺无法逐个手动替换——转速扫到 6000 r/min、采集数十秒数据时，毛刺数量以千计，逐段框选不具可操作性。此时使用 Time Signal Calculator 中的专用函数 **TACHO_MOMENTS_SPIKEREMOVAL_TO_RPM**（该函数自 Testlab Revision 17 引入）。

启用路径：**Tools -> Add-ins** 打开 **Time Signal Calculator**，在界面中点击 **f(x)** 按钮，左侧函数组选择 **Tacho**，找到该函数。

![函数设置对话框](/images/rpm-spike-removal/spike-removal-dialog.png)

*（图源：Simcenter Testing Knowledge Base）*

### 算法逻辑

该函数不是滑动平均式的平滑，其判别基准是统计学的：

1. 取一个滑动窗口（默认长度为一转的脉冲数），以窗口内各脉冲间平均转速为基准；
2. 对窗口内数据计算**中位数绝对偏差 MAD（Median Absolute Deviation）**：

$$\mathrm{MAD} = \operatorname{median}_{i \in W} \Big( \big| n_i - \operatorname{median}_{j \in W} ( n_j ) \big| \Big)$$

其中 $W$ 为当前滑动窗口，$n_i$ 为窗口内第 $i$ 个脉冲间隔的平均转速（r/min）。

3. 偏离基准超过判定门槛（Spike_detection_threshold）的脉冲判为离群点（outlier），即毛刺；剔除后由剩余脉冲重新生成 RPM trace。

以中位数而非均值作为位置基准具有明确的统计意义：毛刺本身就是极端值，若以均值和标准差构造判据，基准会被毛刺自身拉偏；中位数与 MAD 对少量极端值不敏感。这也是该算法对"每转固定的规律毛刺"有效的原因——规律毛刺在窗口内始终是少数离群点。

![毛刺剔除算法流程](/images/rpm-spike-removal/algorithm-flowchart.png)

*（图源：Simcenter Testing Knowledge Base）*

执行后生成新的 trace：

![剔除前（红）与剔除后（绿）对比](/images/rpm-spike-removal/spike-removal-result.png)

*（图源：Simcenter Testing Knowledge Base）*

### 参数说明

| 参数 | 默认值 | 说明 |
|---|---|---|
| Function1 | 无 | 输入转速通道，填通道号 CH1 或通道名 Tacho |
| Pulses_per_rev | 0 | 每转脉冲数；0 表示沿用采集时的 tacho 定义，一般无需修改 |
| Spike_detection_window | 0 | 毛刺检测滑动窗口大小，单位为脉冲数；0 表示一转 |
| Spike_detection_threshold | 3.5 | 毛刺判定门槛，即相对滑动平均的最小幅度；常用范围 2 至 100，越低越灵敏 |
| Pulse_rejection_mode | 0 | 0 为优化算法，剔除最少的脉冲数并尽量保留原信号的频率与扭振内容；1 为激进算法，剔除所有产生超门槛转速尖峰的脉冲 |
| Additional_pulse_rejection | 0 | 剔除坏脉冲时是否连带：0 只删坏脉冲本身；1 连同前一个；2 连同后一个；3 前后都删 |
| Function2 | DEFAULT | 输出采样率；默认与输入一致 |

调参顺序：先用默认值执行一遍，前后对比检查毛刺是否清除、正常转速波动是否被误删。默认门槛 3.5 对多数数据适用。若毛刺幅度小、清除不彻底，将 threshold 向 2 的方向下调；若正常转速波动被误删、曲线被过度平滑，向上调。Additional_pulse_rejection 在毛刺成对出现（一个尖峰紧随一个凹陷）时取 3 效果更好。

::: warning
该函数**不做斑马带接缝校正**。接缝校正使用 ZEBRA_MOMENTS_TO_RPM 函数：接缝修正需将全部脉冲按理论均匀角度重新分布，属全局修正；毛刺剔除只处理出错的少数脉冲，属局部修正。数据中同时存在接缝误差与随机毛刺时，两种修正都需要使用，工程上通常先剔除毛刺、再执行接缝修正。
:::

## 五、两种方法的选择依据

| 对比项 | 手动替换 Time Data Editor | 统计剔除 TACHO 函数 |
|---|---|---|
| 适用毛刺类型 | 偶发尖峰、掉线 | 每转固定位置的规律毛刺 |
| 毛刺数量 | 少量，几个到几十个 | 大量，每转一次，成百上千 |
| 扭振信息 | 被替换段直接抹平 | 统计剔除，最大限度保留 |
| 工作量 | 逐个框选，费时 | 设好参数一次执行 |
| 适用后续分析 | 阶次跟踪、colormap | 阶次与扭振分析均可 |

一个典型的完整处理流程：先执行 spike removal 函数批量清除规律毛刺，再目视检查残余的偶发尖峰，个别的用 Time Data Editor 逐段替换。

## 六、采集阶段的预防

后处理可以修正数据，但误差应尽量在源头控制：

- 斑马带贴完后转动一圈目检接缝：搭接处应整齐压实，不留豁口；贴带前将轴面油污清理干净。
- 激光探头尽量垂直于轴面。入射偏角大时条纹反光强度不均，边缘脉冲容易丢失。
- 测扭振时按采样要求确定 PPR：**每转脉冲数至少为关心最高扭振阶次的 2 倍**，

$$P \ge 2 \, O_{\max}$$

其中 $O_{\max}$ 为关心的最高扭振阶次。例如关心 60 阶扭振，至少使用 120 PPR。PPR 本身没有抗混叠保护，工程上常再乘以 10 倍安全系数。

- 粉尘、油雾较大的现场，定期检查并清洁探头镜头——相当一部分"数据变脏"的情况源于镜头污染。

## 七、小结

转速通道的毛刺是"脉冲到达时刻被干扰"经 $n_k \propto 1/\Delta t_k$ 换算后的必然结果，不是不可解释的偶发现象。偶发毛刺用 Time Data Editor 手动替换，规律毛刺用 TACHO_MOMENTS_SPIKEREMOVAL_TO_RPM 统计剔除，接缝误差用 ZEBRA_MOMENTS_TO_RPM 全局重排——三种方法各对应一类误差。操作原则只有一条：执行任何修正之前先另存原始数据；转速通道是整场试验的基准轴，覆盖后不可恢复。
