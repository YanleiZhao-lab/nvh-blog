---
title: "波形复现 SAWR：从实测波形到台架输出"
---

# 波形复现 SAWR：从实测波形到台架输出

> 同一条山路，实车跑一遍底盘加速度计记下 90 秒波形；回实验室想在这段实测载荷上做疲劳考核，把录好的波形直接灌给功放行不行？不行——台面读回来的波形在试件共振处冲高数倍、在反共振处几乎消失。本文依据 Simcenter Testing Knowledge Base 的 Single Axis Waveform Replication（SAWR）指南，讲清这条从实测波形到台架输出的完整链路：系统辨识为什么先于一切、逆传递函数 ITF 如何把目标波形换算成驱动波形、四种控制策略各自的修正时机，以及频率分辨率对波形时长的隐藏约束。把 SAWR 想成一只学舌的鹦鹉：它听一遍（系统辨识）、跟着说（首次回放）、被纠正发音（迭代修正）、越说越像（ITF 更新）——全程唯一的判据是控制点听到的像不像，而不是嘴里说出来的是什么。

先看一个对比：同样这段载荷，换成随机掯动试验做为什么不会出这个问题？因为随机掯动的目标只是一条谱形，控制器每帧都在按谱修正驱动，波形长什么样无所谓；SAWR 的目标却是逐时刻的波形本身。换句话说，随机掯动只要求学得像（谱一致），SAWR 还要求每一句都学得像（时序一致）——考核的严苛度高了一个维度，控制链路上任何一环的频率特性都会直接写进最终结果。

这个问题的量级可以粗算：一台准备用于耐久考核的振动台，试件加夹具的一阶共振很少高于 100 Hz，而路面载荷的能量恰好集中在几十赫兹到两百赫兹之间——目标波形的主能量与链路传函的放大区重叠是常态而非恰巧。所以问题不是会不会发生，而是每次回放都会发生、发生在哪个频段、偏差多少。

## 一、为什么直接回放必然失败

先看一个现场场景。某底盘零件在试验场坏得快，路试记下损坏路段的控制点加速度时历 150 秒，工程师把它直接作为驱动信号送给功放，台面上同一个位置装控制加速度计。回放读回来的波形与记录的几乎面目全非：试件一阶共振附近幅值被放大近十倍，反共振频段几乎推不动，个别瞬时峰值直接触发限位停机。波形没录错、台子没坏——错的是把目标当驱动直接送了出去。

原因在《[随机振动控制入门](../../theory/vibration-basics/random-control-basics.html)》里已经说透：驱动电压到控制点加速度之间隔着功放增益、动圈机电转换、台面夹具动力学、试件反作用一整条链路，合成的频率响应在共振处放大十余倍、反共振处近乎断路。

先给一个量级感：试件一阶共振 180 Hz、阻尼比 5%，品质因数 Q = 1/(2×0.05) = 10。同样 1 V 的驱动电压，在 100 Hz 只产生约 1.4 g，在 180 Hz 放大到约 10 g，到 500 Hz 又跌回不到 0.2 g（第八节 numpy 复算）。把录好的波形不加修正直接送出去，共振频段的能量就会被这条链路放大近十倍、反共振频段几乎推不动。

SAWR 与随机控制的差别只在目标长什么样：随机控制追的是一条统计意义上的 PSD 折线，时域波形本身无关紧要；SAWR 追的是一段特定的时域波形——峰值出现在哪一秒、瞬时载荷按什么顺序作用，都是考核内容。这带来两个直接后果：一是波形保真度要逐时刻评价，不能只看谱；二是任何对波形长度的约束（比如频率分辨率要求块长整除波形时长）都必须在导入前处理妥当。

::: info 核心概念
- **波形复现（Waveform Replication / SAWR）**：以实测时域波形为目标、以控制加速度计反馈修正驱动时域信号的闭环振动控制模式，用于复现路面、飞行、运输等真实载荷历程
- **逆传递函数（ITF，Inverse Transfer Function）**：系统频响的倒数，把想要的控制点波形换算为该送给功放的驱动波形
- **回放（Replay）**：驱动波形在台架上完整播放一次的过程，一个 profile 对应一次回放，迭代修正在回放之间进行
- **系统辨识（System Identification）**：用低量级激励测出系统频响（g/V）的过程，是计算 ITF 的数据来源
:::

## 二、贯穿类比：学舌的鹦鹉

把 SAWR 控制器想成一只学舌的鹦鹉。主人说一句山路方言（目标波形），鹦鹉先听一遍音色（系统辨识：这条链路对每个频率放大还是衰减多少），再张嘴学舌（按 ITF 把目标波形换算成驱动波形送出去），旁边的人拿原句对照纠正（比较控制点实测与目标，算误差），鹦鹉修正发音再来一遍（迭代更新驱动）。判据从头到尾只有一个：学得像不像（控制点波形与目标波形的误差），而不是嗓音本身是否标准（驱动波形长什么样无所谓）。

鹦鹉什么时候被纠正，对应四种控制策略——是学完一句再纠正（回放之间修正），还是边说边纠正（回放中更新），第六节逐个对号。

## 三、链路硬件：先满足三个前提

闭环 SAWR 试验的硬件链路如图：控制器计算机（装 Simcenter Testlab）、SCADAS 采集硬件（把控制加速度计的模拟信号数字化、把驱动模拟信号输出给功放）、功放与振动台、试件、至少一只控制加速度计与若干测量加速度计。

![闭环 SAWR 试验的硬件链路：控制器、SCADAS、功放/振动台、试件、控制与测量加速度计](/images/waveform-replication-sawr/fig1.png)

*(图源：Siemens Simcenter Testing Knowledge Base)*

三个容易被忽略的前提：

1. **SCADAS 必须配 -V 选项的控制卡**。-V（vibration control）意味着源输出带专门的安全设计：异常时渐进关闭输出而非骤然断流，保护振动台与试件。
2. **STOP 连接器必须在位**。SCADAS 的源输出有一个 STOP 闭环插头，不在位则模拟信号根本发不出去——这是硬件级的保险，不是软件设置。

![STOP 连接器必须插在位，SCADAS 源才有输出](/images/waveform-replication-sawr/fig2.png)

*(图源：Siemens Simcenter Testing Knowledge Base)*

3. **外接急停**。STOP 口可接到 DAC Shutdown 急停盒，大黄/大红按钮一拍，试验立即终止——量产件试验台的标配。

![STOP 口外接 DAC Shutdown 急停盒](/images/waveform-replication-sawr/fig4.png)

*(图源：Siemens Simcenter Testing Knowledge Base)*

软件入口在 Testlab Environmental 文件夹的 Single Axis Waveform Replication 图标（token 授权下需 43 个 token）。启动后先做两件事：Tools -> Options -> Shaker 里核对振动台定义（最大位移、最大加速度、频率范围——SAWR 会用这些限值预检波形，超限直接报警）；File -> Save As 存项目文件。之后底部工作表从左到右依次使用：Channel Setup -> SAWR Setup -> System Identification -> System Verification -> SAWR Control -> Batch Reporting。

![Testlab Environmental 文件夹中的 Single Axis Waveform Replication 入口](/images/waveform-replication-sawr/fig5.png)

*(图源：Siemens Simcenter Testing Knowledge Base)*

## 四、通道与设置：三个最小要求

Channel Setup 工作表里逐行录入传感器：至少一个通道设为 Control（控制通道，闭环盯着的位置；多控制通道可取平均或极值策略），其余为测量通道，录清测点位置、工程单位、传感器型号与灵敏度。

![Channel Setup 工作表：逐行录入控制与测量加速度计信息](/images/waveform-replication-sawr/fig8.png)

*(图源：Siemens Simcenter Testing Knowledge Base)*

SAWR Setup 工作表完成三件事即达最小可用状态：Control 面板设控制参数、SAWR Profiles 面板定义目标波形、Schedule 面板把 profile 排入试验序列。全部就绪后状态指示转绿显示 Verification OK。

![SAWR Setup 工作表的七个区域：控制面板、SAWR Profiles、安全、计划、自动测量、吞吐记录、状态指示](/images/waveform-replication-sawr/fig10.png)

*(图源：Siemens Simcenter Testing Knowledge Base)*

### 频率分辨率与波形时长的隐藏约束

Control 面板里最小频率、最大频率之外，频率分辨率（Frequency Resolution）这一项藏着一个新手常踩的坑。它决定了采集的采样率，也决定了驱动波形按多长的数据块来处理——用作目标的录音时长必须是频率分辨率倒数的整数倍。

这个约束回答的问题是：为什么明明录了 2 分 30 秒整的波形，导入后长度却对不上？举手册原例：频率分辨率设 3.125 Hz，对应时间块 1/3.125 = 0.32 秒；参考时历长 2.5 分钟即 150 秒，150/0.32 = 468.75 不是整数——软件只能取最近的整数块，profile 实际时长变成 468 块（149.76 秒）或 469 块（150.08 秒）。差 0.24 秒在疲劳累计上通常无伤大雅，但若目标波形包含必须完整保留的事件（冲击、制动），就要反过来先选频率分辨率再裁波形。

### 目标波形从哪来

SAWR Profiles 面板点 Create Profile 打开 Profile Editor：Select Source Trace 选择 .ldsf 文件里的实测时历，Use source trace 加 Update 读出数据属性，预处理参数确认后 Update Profile 生成目标，命名建议带工况特征。

![Profile Editor：从 .ldsf 实测数据定义目标波形](/images/waveform-replication-sawr/fig12.png)

*(图源：Siemens Simcenter Testing Knowledge Base)*

没有实测数据时，Time Signal Calculator 可以现场造一段：启用 add-in 后用 GENERATE_RANDOM 加 FILTER_BP 生成带宽限定的随机时历，Calculate 计算并 Save As 存入项目，即可作为 SAWR 的目标。这适合做方法验证与台架调试，不能替代真实载荷。

## 五、系统辨识：一切修正的起点

系统辨识（System Identification）工作表用低量级激励测出从驱动电压到控制加速度的频响，再取倒数得 ITF。手册特别提醒：默认电压上下限往往过于保守（量级太低、信噪比不足），建议从 Min. RMS 0.02 V、Max. RMS 0.06 V 起步尝试，再按各台系统具体情况调整——辨识量级与正式试验量级差太远时，非线性系统（含间隙、大变形橡胶）的 ITF 代表性会下降。

![System Identification 工作表：设源电压上下限后点 Start](/images/waveform-replication-sawr/fig19.png)

*(图源：Siemens Simcenter Testing Knowledge Base)*

辨识完成后到 System Verification 工作表复核结果：FRF 曲线是否光滑、相干是否够高（共振频段应接近 1，反共振与带外低信噪区允许回落）。这一步本质上是给 ITF 做质检——后面所有驱动换算都建立在它之上，脏的 ITF 会把误差逐次放大。

![System Verification 工作表：复核 FRF 与相干等辨识结果](/images/waveform-replication-sawr/fig20.png)

*(图源：Siemens Simcenter Testing Knowledge Base)*

## 六、四种控制策略：修正发生在什么时候

Control 面板的策略下拉框有四个选项，区别全在驱动波形何时被修正、ITF 何时被更新——回到鹦鹉类比：是学完一句再纠正，还是边说边纠正。

| 策略 | 驱动信号来源 | ITF 更新时机 | 适用场景 |
| --- | --- | --- | --- |
| **Open Loop** | 上次回放的驱动，按当前 ITF 与目标生成 | 不更新 | 波形已收敛后的正式考核段（重放既定驱动） |
| **Iterative** | 上次驱动加目标与实测的时域误差修正 | 不更新 | 时域逐时刻收敛的经典迭代路线 |
| **Offline Adaptive** | 当前 ITF 与目标生成 | 每次回放结束后 | 系统特性缓漂（温升、预紧松弛） |
| **Online Adaptive** | 目标加最新可用 ITF | 回放进行中（按统计自由度） | 系统特性快变或单次回放即需收敛 |

策略选择的物理逻辑：修正太频繁会把噪声也当误差修正（过修正、振荡），修正太迟跟不上系统漂移。Iterative 是最保守的时域路线；Online Adaptive 收敛最快但依赖统计自由度参数控制更新节奏；Open Loop 完全不修正，只用于驱动已定型的重放。

频率范围参数同样作用于全链路：Min. frequency 以下的成分从目标、ITF、测量结果与驱动中一并剔除，Max. frequency 以上同理——这不是简单的显示滤波，而是控制回路真正的工作带宽。

## 七、跑试验与验收：对角线判据

SAWR Control 工作表点 Arm 再点 Start，状态转 Running。控制界面右上显示的对角线图是最直观的验收判据：横轴目标波形、纵轴实测波形，完全复现时所有点落在 45 度对角线上；偏离对角线的散布程度就是复现误差的分布。越贴近真对角线，复现越忠实。

![SAWR Control 工作表：Arm 与 Start 按钮开始试验](/images/waveform-replication-sawr/fig21.png)

*(图源：Siemens Simcenter Testing Knowledge Base)*

试验结束用 Batch Reporting 工作表出报告：选中试验点 Print，File -> Print Options 可选打印机或输出 PowerPoint/Word 版本。报告模板里的 Logo 与页眉图（Logo.bmp、LmsHeading1.bmp）存于安装目录 Application Resources 下，复制到用户目录再改可只影响当前登录。

![Batch Reporting 工作表一键出报告](/images/waveform-replication-sawr/fig22.png)

*(图源：Siemens Simcenter Testing Knowledge Base)*

多输入复现（多个方向或多台激振器）则换用 Testlab Environmental 文件夹里的 Time Waveform Replication（TWR）应用，流程与单轴 SAWR 同构，控制量从标量 ITF 变成矩阵。

## 八、numpy 演示：ITF 换算与迭代收敛

用一个自包含小程序演示 SAWR 的核心数学：给定二阶共振系统的频响，按 Offline Adaptive 的逻辑先回放、再更新 ITF、再生成新驱动，看控制点响应两轮收敛。这个演示回答的问题是：为什么按传函倒数修正一次，共振处的过冲就消失了。

```python
import numpy as np

f = np.linspace(1, 400, 400)
H = 1/np.sqrt((1-(f/180)**2)**2 + (2*0.05*f/180)**2)  # Q=10 共振系统频响
target = np.full_like(f, 1.0)                          # 平直目标谱(示意)

# Round 1: 初始假设 H=1, 驱动=目标直接回放
itf_est = np.ones_like(f)
drive = target * itf_est
resp1 = drive * H                                      # 控制点实测
print(f"Round1 RMS误差: {np.sqrt(np.mean((target-resp1)**2)):.3f}")

# 回放结束更新 ITF: itf = drive/resp, 再按新 ITF 生成驱动
itf_est = drive / np.maximum(resp1, 1e-12)
drive2 = target * itf_est
resp2 = drive2 * H
print(f"Round2 RMS误差: {np.sqrt(np.mean((target-resp2)**2)):.2e}")
i180 = np.argmin(abs(f-180))
print(f"共振180Hz: H={H[i180]:.1f}倍, Round1响应={resp1[i180]:.1f}, Round2响应={resp2[i180]:.3f}")
```

运行结果（实测）：Round1 RMS 误差 2.131——共振 180 Hz 处响应冲到目标的 10.0 倍；Round2 RMS 误差降到 3.2e-17（浮点精度内收敛，因为演示系统线性时不变，一次 ITF 更新即精确），180 Hz 处响应回到 1.000。真实台架收敛不到机器精度：噪声、非线性与时变特性让 ITF 每次估计都有残差，这正是四种控制策略存在的意义——按系统漂移快慢选择修正节奏。

注意演示里的一个细节：更新后驱动谱在共振处被压低 20 dB——这正是《随机振动控制入门》里驱动谱共振处深陷是均衡正常的肉眼判据在 SAWR 里的对应物。目标谱平、驱动谱不平，两条谱长得越不一样，说明系统传函被补偿得越到位。

## 九、工程判断

1. **先辨识后回放，顺序不可倒**：ITF 是所有驱动换算的地基；跳过辨识直接开环，等于鹦鹉没听音色就学舌
2. **频率分辨率与波形时长先对齐**：目标时长必须是 1/频率分辨率的整数倍，含关键事件的波形宁可先裁剪后导入
3. **辨识电压从 0.02/0.06 V 起步试**：默认值过保守导致信噪比不足；但量级也不宜离正式试验太远，非线性系统的 ITF 会失代表性
4. **策略按漂移快慢选**：静态试件 Iterative 稳妥；温升明显的长时循环用 Offline/Online Adaptive；驱动定型后的正式考核段用 Open Loop 重放
5. **验收看对角线**：45 度线上的散布就是复现误差，逐时刻保真度一目了然；谱形贴合不等于波形贴合

## 一句话记住

SAWR 把实测波形当目标、把控制点反馈当判据：先低量级辨识频响、取倒数得 ITF，驱动等于目标乘 ITF，回放后按误差迭代修正、按漂移快慢选修正时机——学舌的鹦鹉不在乎嗓音标准，只在乎学得像。
