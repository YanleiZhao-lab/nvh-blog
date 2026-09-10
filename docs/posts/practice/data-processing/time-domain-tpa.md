---
title: "时域 TPA：把每条路径的贡献做成可以听的声音"
---

# 时域 TPA：把每条路径的贡献做成可以听的声音
> 频域 TPA 报告里某条路径贡献降了 3 dB，评审会上却有人反问："降了 3 dB 的声音，听起来到底好没好？"——曲线答不上来。曲线是照片，声音是电影：把每条传递路径的贡献量从频谱变回可以回放的时间波形，工程师就能像调音师推分推子一样，一条条路径单独试听、组合试听。本文说明 Simcenter Testlab 中 Time Domain TPA 与 TPA Synthesis 两个插件如何把频域 TPA 模型"翻译"回时域，采数要满足哪些苛刻前提，以及回放面板上的每个开关对应什么物理含义。

## 一、为什么"看得见"的贡献量还需要"听得见"

NVH 工程里有一个反复出现的尴尬场景：整改方案在 2D 图上赢得很清楚。比如某悬置换成低动刚度方案后，发动机 2 阶路径在 2000 rpm 附近的贡献量曲线降了 3 dB，图表红线明显低于蓝线。但装车评审时主观评价却说"没变好，甚至更糙了"。

问题不在测量，在表达方式。频域曲线把一段时间压缩成每个频率一根谱线，丢掉了两样东西：一是**时间结构**——喷油器嗒嗒声这类瞬态声音的"密集感"藏在时间轴上的脉冲间隔里，频谱只保留它们的平均能量；二是**听感的非线性**——人耳对 500 Hz 和 3 kHz 的同幅值声压感受完全不同，A 计权曲线只是粗略修正，时变响度（time-varying loudness）这类声品质指标必须从时间历史算起，从频域曲线反推不回来。

反过来，时域回放把这两样都还回来：把 2000 rpm 上那个"降了 3 dB"的方案做成声音，整改前后各听一遍，即刻的听感差异比任何图表都直接。Simcenter 官方知识库对这一动机的表述很朴素：2D 图上 dB 的下降不等于更好听，听整改前后的声音能带来更多洞察（listening helps assess the changes with more insight）。

一个贯穿本文的类比：频域 TPA 模型像一份**乐队的总谱**——每个声部（路径）在哪个音区（频率）有多强都写着，指挥（工程师）能看出谁吵；时域 TPA 则把总谱交给**调音台回放**——单独把鼓组静音、单独听贝斯、或者只留人声，效果立竿见影。总谱用来分析，分推子用来试听，两者合起来才是完整的混音决策。Testlab 里对应关系也很直白：Transfer Path Analysis 工作簿是总谱，TPA Synthesis 的 Replay 面板是调音台。

## 二、从频域模型回时域：基本原理与数据前提

时域 TPA 不重建模型，而是给已有的频域 TPA 模型"配音"。流程核心一句话：**把实测的输入时间历史加到频域模型上，在频域完成路径贡献计算，再把结果反变换回时域输出**。

![时域TPA原理：实测输入时间历史在频域加到模型上，算出各路径输出的时间历史](/images/time-domain-tpa/fig1.png)
*（图源：Siemens Simcenter Testing Knowledge Base）*

一个典型的频域 TPA 模型由两部分组成：

- **FRF（频响函数）**：表征路径本身的传递特性，输入是力（分母），输出通常是加速度或声压（分子）
- **工况数据（Operating Data）**：实际运行状态下采到的阶次、谱等函数，用于导出各路径的工况力

要把这套频域模型变成时域，还缺第三样东西：**模型输入端的原始时间历史**——就是那些用来算工况力的原始时域记录（直接测的力，或用来间接推力的加速度）。而且对这些时间历史有两条硬性要求：

1. **同步采集**：所有通道必须在同一次采集中同时记录。时域回放依赖各通道之间的相位关系，分批采集再拼接的数据相位对不上，不能用
2. **采样率一致**：所有通道同一采样率。同一份记录里混着不同采样率的通道，软件直接拒绝处理

::: info 核心概念
- **时域 TPA（Time Domain TPA）**：用实测输入时间历史驱动频域 TPA 模型，计算各路径贡献的输出时间历史，供回放与声品质分析
- **同步采集（Acquired Simultaneously）**：全部通道同次同时记录，保证时域相位一致——时域 TPA 的硬前提
- **时变响度（Time-varying Loudness）**：随时间逐帧计算的响度，只能从时间历史得出，频域曲线无法反推
- **TTPA**：Time Domain TPA 计算生成的路径贡献时间历史所在分析的默认扩展名
:::

回放的频率范围也天然受限：时域输出的带宽取 FRF 测量带宽与工况数据带宽中较低的那个。一般工况数据更容易测到高频（FRF 常用力锤敲，锤头材质限制了有效高频——锤头越硬高频越多，但太硬又敲不进低频能量），所以实际带宽往往卡在 FRF 一侧。如果模型是用阶次建的，建议把目标频段上下的额外阶次也包进模型，让回放的频率内容覆盖足够宽的范围，声音才不失真。

## 三、时域贡献怎么算：一个可复算的最小例子

在进入软件操作前，先用一个数值例子把"频域模型 + 时域输入 = 时域贡献"这件事算清楚。设结构只有一条路径：源点到驾驶员耳旁的传递函数是一个 30 Hz 附近的共振峰，工况输入是两个频率成分的力信号。

这个公式回答的问题是：**一条路径对目标的贡献在频域怎么合成？**其中 $F_i(f)$ 对应物理里第 $i$ 条路径的工况力谱，$H_i(f)$ 对应物理里该路径的 FRF——两者逐频率复数相乘，就是该路径贡献的频谱：

$$
P_i(f) = F_i(f) \cdot H_i(f)
$$

这个式子在频域 TPA 里就是贡献量的定义；时域 TPA 做的事只是把 $F_i(f)$ 从"工况数据的谱"换成"实测时间历史的 FFT"，算完 $P_i(f)$ 再做一次逆 FFT，把每条路径的贡献变回时间波形。总贡献等于所有路径贡献之和：

$$
p_{\mathrm{total}}(t) = \sum_{i=1}^{N} \mathcal{F}^{-1}\!\left\{ F_i(f)\,H_i(f) \right\}
$$

用 numpy 把这个过程走一遍：构造一个 30 Hz 共振的 SDOF 传递函数，输入是 20 Hz + 33 Hz 两个成分的力时间序列，看单条路径的贡献波形如何被"路径滤波"出来——
```python
import numpy as np

fs = 1024                  # 采样率 Hz（所有通道一致）
T  = 4.0                   # 记录长度 s
t  = np.arange(int(fs*T)) / fs
f_axis = np.fft.rfftfreq(t.size, 1/fs)

# 工况输入：两个频率成分的力（模拟某路径上的工况力时间历史）
F_time = 12.0*np.sin(2*np.pi*20*t) + 5.0*np.sin(2*np.pi*33*t)
F_spec = np.fft.rfft(F_time)

# 路径 FRF：30 Hz、阻尼比 4% 的 SDOF（声学路径共振峰的简化模型）
f0, zeta = 30.0, 0.04
w, w0 = 2*np.pi*f_axis, 2*np.pi*f0
H = (2*np.pi*f0)**2 / (-w**2 + 2j*zeta*w0*w + (2*np.pi*f0)**2)

# 时域 TPA 核心：频域相乘，逆变换回时域，得到该路径的贡献波形
p_i = np.fft.irfft(F_spec * H, n=t.size)

# 回放前先看幅值谱：33 Hz 被共振放大，20 Hz 被压低
mag = np.abs(np.fft.rfft(p_i))
peak = f_axis[np.argmax(mag)]
print(f"贡献波形峰值频率: {peak:.1f} Hz")   # -> 33.0 Hz
print(f"33Hz/20Hz 幅值比: {mag[np.argmin(abs(f_axis-33))]/mag[np.argmin(abs(f_axis-20))]:.1f}")
```

运行结果：贡献波形的峰值频率是 33.0 Hz——输入里 20 Hz 幅值（12 N）本是 33 Hz（5 N）的 2.4 倍，但路径 FRF 在 33 Hz 的放大倍数约是在 20 Hz 的 2.45 倍（30 Hz 共振峰的 skirt），两个效应几乎完全抵消，输出中两成分幅值相当（比值约 1.0）、33 Hz 略占上风并成为峰值。这正是"路径的声音"：同一个工况输入，贴上不同路径的传递函数，回放出来完全不同——换一条没有 30 Hz 共振的路径，同样的力听起来就是低频哼声为主。频域里这是传递函数曲线上的两个点；时域里这是两段听感截然不同的声音。

### 4.1 准备工作：插件与输入

时域 TPA 在 Testlab 里由两个插件配合完成，从主菜单 Tools -> Add-ins 打开：

- **Time Domain TPA**（35 tokens）：计算路径贡献时间历史
- **TPA Synthesis**（62 tokens）：交互式回放

两个插件不必同时开启——先开 Time Domain TPA 算时间历史，算完可以只留 TPA Synthesis 回放。两者都要求底层的 Transfer Path Analysis（98 tokens）或 OPAX（73 tokens）插件已激活。注意 token 是许可单位的计量方式，开插件前确认 license 池够用。

第一步把模型输入端的时间历史（throughput 文件）加入输入篮：在 Navigator 里右键该时间历史，选 Add to Input Basket。

![右键输入时间历史吞吐文件，选择 Add to Input Basket](/images/time-domain-tpa/fig2.png)
*（图源：Siemens Simcenter Testing Knowledge Base）*

![在 Testlab 主菜单 Tools -> Add-ins 中开启 Time Domain TPA 与 TPA Synthesis](/images/time-domain-tpa/fig3.png)
*（图源：Siemens Simcenter Testing Knowledge Base）*

### 4.2 计算路径贡献时间历史

开启 Time Domain TPA 后，TPA Results 工作簿会多出一个 Time Domain 子表。

![TPA Results 工作簿新增的 Time Domain 子表（右下）](/images/time-domain-tpa/fig4.png)
*（图源：Siemens Simcenter Testing Knowledge Base）*

在 Time Domain 子表里：点 Read Input Basket 读入时间历史——吞吐文件名出现在按钮下方，左下角 PointId 信息列从红色翻绿并出现字母 X，表示各通道匹配成功；点击任意绿色单元格可以查看对应的时间波形，用方向键上下翻看各通道。

![TPA Results 工作簿可视化输入时间历史](/images/time-domain-tpa/fig5.png)
*（图源：Siemens Simcenter Testing Knowledge Base）*

然后选定路径贡献时间历史的频率范围（无特殊要求就用默认值），按 Calculate。软件把建模型时的原始时间数据（直接力、间接加速度等）变换为各路径的贡献时间历史。

![按下 Calculate 后生成路径贡献时间历史](/images/time-domain-tpa/fig6.png)
*（图源：Siemens Simcenter Testing Knowledge Base）*

### 4.3 Navigator 里认出 TTPA 数据：三个属性

计算结果存在一个以 TTPA 结尾的新分析里，与原始采集数据混在同一个文件中。在 Navigator 列头右键 Select Columns，把两个属性列加出来：Origin 设为 Testlab、Type 设为 Block，在 Quick Find 里输入 tpa，把 **TPA Path** 与 **TPA Result Type** 加入 Selected。

![列头右键选择 Select Columns](/images/time-domain-tpa/fig7.png)
*（图源：Siemens Simcenter Testing Knowledge Base）*

![把 TPA Path 与 TPA Result Type 两个属性加入 Selected 区](/images/time-domain-tpa/fig8.png)
*（图源：Siemens Simcenter Testing Knowledge Base）*

TPA Result Type 属性的取值有三类，对应回放时看到的三种时间历史：

- **Total Contribution**：目标点处计算得到的总贡献时间历史，可用来与目标点实测时间历史对账
- **Partial Contribution**：某条路径（TPA Path）到目标点的贡献，例如"左悬置到驾驶员耳旁"单独的声音
- **Load-MI**：路径上工况力的时间历史——算贡献前必须先把力算出来，这些中间结果也一并保留

![时间历史上的属性：Total Contribution、Partial Contribution 与 Load-MI](/images/time-domain-tpa/fig9.png)
*（图源：Siemens Simcenter Testing Knowledge Base）*

## 五、回放：调音台式的听音决策

### 5.1 选段与回放

回到调音台的比喻：现在每个推子（路径）后面都已经接上信号（贡献时间历史），可以开始混音评审了。开启 TPA Synthesis 插件，在 Definition 子表里如果只关心某段时间（比如换挡瞬间），用 Double X 光标选段并按 Apply segment selection——不必回放整段记录。

![TPA Synthesis 工作簿 Definition 子表中可选局部时间片段回放](/images/time-domain-tpa/fig10.png)
*（图源：Siemens Simcenter Testing Knowledge Base）*

切到 Replay 子表：最上面一行是原始实测数据，下面各行是 TPA 模型（包括用 TPA Component Editing 做过修改的模型变体）。按 Replay 开始回放；回放进行中直接点不同模型行，就能实时对比"原始声"与"各方案声"。右侧的复选框逐条开关路径——注意实测数据那行不能开关路径，只有 TPA 模型行可以，因为只有模型里才存在"路径"这个概念。

![TPA Synthesis 工作簿 Replay 子表交互式试听路径贡献](/images/time-domain-tpa/fig11.png)
*（图源：Siemens Simcenter Testing Knowledge Base）*

如果建模时用了 groupset（路径分组），整组路径可以一键开关——例如把电机的全部空气声路径与全部结构声路径整体对比，一步听出两大类贡献的主次。这相当于调音台上把鼓组总线一键静音。

### 5.2 偷听与滤波：回放中的实时分析

回放不止是听。右键任意路径选 Add Eavesdropping，回放的同时显示该路径的实时频谱——耳朵听感与眼中谱形同步对照，"糙"的声音到底糙在哪个频段当场可见。

![右键路径选择 Add Eavesdropping 查看实时频谱](/images/time-domain-tpa/fig12.png)
*（图源：Siemens Simcenter Testing Knowledge Base）*

同样在右键菜单里还可以给路径加滤波器：带通、带阻、高通、低通或陷波——相当于给单个推子串一个 EQ。先听后滤波再听，快速验证"把这个频段拿掉声音是否改善"的假设，为后续整改方案缩小范围。

## 六、小结

时域 TPA 不是新的建模理论，而是频域 TPA 的"回放层"：频域模型回答"哪条路径贡献大"，时域回放回答"改了之后听起来怎么样"。两者配合的完整工作流：同步等采样率采工况时间历史、建频域 TPA 模型、Time Domain TPA 算贡献时间历史、TPA Synthesis 里选段回放开关路径对比模型加滤波试听。三个工程要点值得记住：瞬态声（喷油器嗒嗒声）与声品质指标（时变响度）只能从时域获得；回放带宽受 FRF 与工况数据中较低者限制；实测数据不能开关路径、只有模型能——评审时"听方案对比"听的都是模型行。

## 一句话记住

频域 TPA 是总谱、时域 TPA 是调音台：同步等采样率的时间历史驱动频域模型，FFT 相乘再逆变换把每条路径变回声音；Replay 里开关路径、对比模型、Eavesdropping 看实时谱——dB 降没降看图，好不好听用耳。
