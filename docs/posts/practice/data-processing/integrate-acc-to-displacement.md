---
title: "加速度积分求位移：为什么双重积分会漂移"
---

# 加速度积分求位移：为什么双重积分会漂移

> 手里只有加速度信号，交的报告却要位移——悬架行程、部件间隙、动画变形都绕不开。直接 DOUBLEINTEGRATE 一下，得到的位移动辄几米，明显失真。这篇从积分的数学定义拆解漂移的来源，给出 Simcenter 官方 FAQ 630 的五步处理流程和频域积分替代路线，每一步跳过会出什么后果都有实测图对照。

## 一、工程场景：为什么总在积分

最可靠的位移当然来自直接测量——位移传感器、激光测振仪。但实际项目里经常来不及：车上布了二十个加速度计跑耐久，回来才发现客户要悬置位移；台架测的是加速度，间隙校核却要位移。积分（integration）往往成了唯一的补救手段。手册层面这也是常规操作：LMS 模态理论手册第 17 章明确指出，位移、速度、加速度的工作振型（ODS）之间可以通过一次或二次积分/微分互相转换（式 17-7～17-9），依据的正是同一套关系。

Simcenter Testlab 里至少有三条路可以积分：

| 路线 | 入口 | 输出 | 适用 |
| --- | --- | --- | --- |
| **时域双重积分** | Time Signal Calculator 的 DOUBLEINTEGRATE | 位移时域波形 | 要看波形、做动画、算峰值 |
| **频域积分** | 谱线右键 Processing → Integrate / 段落设置 | 位移谱、Overall Level | 只要级值和趋势 |
| **图谱右键积分** | 阶次切谱 Y 轴 → Integrate (Single) | 角度域阶次 | 扭振转速波动转角位移 |

三条路里时域双重积分（time domain double integration）的注意事项最多，也是社区问答里出错最集中的地方——有人用它算出远超物理行程的位移结果。

## 二、漂移的物理本质：两条推导

### 时域：偏置经两次积分变成 t²

从定义出发。加速度积分得速度，速度积分得位移：

$$v(t) = \int_0^t a(\tau)\,d\tau + v_0$$

$$x(t) = \int_0^t v(\xi)\,d\xi + x_0 = \int_0^t\!\!\int_0^\xi a(\tau)\,d\tau\,d\xi + v_0 t + x_0$$

物理意义：位移由加速度历程的双重积分加上初始条件 $v_0 t + x_0$ 两部分构成——初速度 $v_0$ 每积分一次就升级成线性趋势 $v_0 t$。

再看直流偏置（DC offset）$\varepsilon$ 的传播——放大器失调、传感器温漂、重力分量没对准都会引入。分两步推导，先积一次：

$$a(t) = \varepsilon \;\Rightarrow\; v(t) = \int_0^t \varepsilon\,d\tau = \varepsilon\, t$$

物理意义：恒定的虚假加速度积分出匀速漂移。再积第二次：

$$x_{drift}(t) = \int_0^t \varepsilon\,\xi\,d\xi = \frac{\varepsilon\, t^2}{2}$$

物理意义：匀速漂移再积分就是匀加速漂移——记录越长漂移越大。代入具体数值：8 秒记录里 0.001 m/s²（万分之一 g 量级，属正常的传感器失调）的偏置，末端贡献

$$x_{drift}(8\,\mathrm{s}) = \frac{0.001 \times 8^2}{2} = 32\ \mathrm{mm}$$

的虚假位移。若是线性温漂 $a(t) = bt$，同样分两步：先积出 $v(t) = bt^2/2$（增长更快的速度漂移），再积出

$$x_{drift}(t) = \int_0^t \frac{b\,\xi^2}{2}\,d\xi = \frac{b\,t^3}{6}$$

立方增长——比偏置的 $t^2$ 更快，长记录下占主导。

### 频域：1/(jω)² 把低频噪声平方放大

对正弦加速度 $a(t) = A\sin(\omega t)$，第一次积分得

$$v(t) = -\frac{A}{\omega}\cos(\omega t)$$

幅值除以 $\omega$，相位滞后 90°；第二次积分得 $x(t) = -\frac{A}{\omega^2}\sin(\omega t)$，幅值再除以 $\omega$，相位累计反转 180°。位移幅值：

$$|x| = \frac{A}{\omega^2} = \frac{A}{(2\pi f)^2}$$

也可以从频域看：积分算子在频域是乘 $1/(j\omega)$，双重积分就是乘 $1/(j\omega)^2$。当 $f \to 0$，这个增益趋于无穷——这正是 Siemens 工程师在社区回答里指出的："频率域积分是 1/ωj，频率接近 0 时积分就是无穷大"。传感器的低频噪声、1/f 噪声、残余漂移全被平方放大。

```python
import numpy as np

# 同样 1 m/s² 幅值的正弦加速度，双重积分后的位移幅值
print("加速度幅值固定 1 m/s² 时，频率越低位移越大：")
for f in [100, 50, 10, 5, 2, 1]:
    d = 1.0 / (2*np.pi*f)**2
    print(f"  {f:>4d} Hz -> 位移幅值 {d*1e6:9.1f} um")

# DC 偏置 0.001 m/s² 双重积分 8 秒
t_end = 8.0
print(f"\n0.001 m/s² 偏置积分 8 s 的末端漂移: {0.5*0.001*t_end**2*1e3:.0f} mm")
```

输出里最值得看两个数：1 Hz 处同样 1 m/s² 的加速度对应 **25.3 mm** 位移（100 Hz 处只有 2.5 μm，相差一万倍）；千分之一 m/s² 的偏置 8 秒就积出 **32 mm** 虚假位移。低频既是位移能量的集中区，也是噪声被放大最严重的频段——这一矛盾决定了后面所有处理步骤。

::: info 核心概念
- **积分常数**：$v_0 t + x_0$ 形式的趋势项，高通滤波负责清除
- **DETREND_AC**：对原始数据拟合最高 6 阶多项式并减掉，去掉积分前就存在的低频趋势
- **1/(jω)² 放大**：双重积分对低频的平方增益，f 减半位移翻 4 倍
:::

## 三、推荐流程：FAQ 630 五步法

官方 FAQ 630（"How to 'correctly' integrate time data within Time Domain Integration"）给出的推荐流程，每一步都对应上一节的某个误差来源：

| 步骤 | Time Signal Calculator 函数 | 作用 | 跳过的后果（FAQ 附录实测） |
| --- | --- | --- | --- |
| **1. 去趋势（detrending）** | DETREND_AC(CHx; 2) | 拟合并减去 2 阶多项式，去掉积分前就存在的漂移和低频趋势 | 结果残留漂移，持续发散 |
| **2. 升采样（upsampling）** | RESAMPLING(...; 4×fs; ...) | 积分算法（Simpson 等）在 fs/4 以上频率误差大，升 4 倍采样率避开 | 高频段出现锯齿状误差 |
| **3. 双重积分** | DOUBLEINTEGRATE(...; 1) | 1=Simpson、2=梯形；Simpson 必须配升降采样 | —— |
| **4. 降采样（downsampling）** | RESAMPLING(...; fs; ...) | 回到原始采样率，同时滤除 fs/4 以上的积分噪声 | 幅值整体偏高或偏低 |
| **5. 高通滤波（high-pass filtering）** | FILTER_HP(...; 2.5; 2; IIR(1)) | 清掉积分常数和残余低频分量 | 积分常数以直流/低频形式主导结果 |

FAQ 附录的四张对照图，比文字更直观——每张都是"正确结果 vs 少做一步"的叠加显示：

![未做 DETREND_AC：漂移残留，结果持续发散](/images/integrate-acc-to-displacement/faq630_p4_1.png)
*（图源：Simcenter Testing Knowledge Base）*

![未升采样：Simpson 积分在 fs/4 以上产生锯齿误差](/images/integrate-acc-to-displacement/faq630_p4_2.png)
*（图源：Simcenter Testing Knowledge Base）*

![未加高通：积分常数以低频/直流形式主导结果](/images/integrate-acc-to-displacement/faq630_p5_2.png)
*（图源：Simcenter Testing Knowledge Base）*

![高通截止留在默认 500 Hz：低频被滤光，位移几乎为零](/images/integrate-acc-to-displacement/faq630_p5_3.png)
*（图源：Simcenter Testing Knowledge Base）*

完整公式（Simpson 嵌套版，原文照录，fs=16384 Hz 场景）：

```text
FILTER_HP(RESAMPLING(DOUBLEINTEGRATE(RESAMPLING(DETREND_AC(CHx;2);65536;80;0.01;50;15);1);16384;80;0.01;50;15);2.5;2;IIR(1))
```

如果用梯形积分（DOUBLEINTEGRATE(...;2)），积分算法本身对采样率不敏感，升降采样可以省掉：

```text
FILTER_HP(DOUBLEINTEGRATE(DETREND_AC(CHx;2);2);2.5;2;IIR(1))
```

多通道处理：把 CHx 配合 "Repeat for..." 填 1:10 一次算完。

::: warning 三个常见错误
- **FILTER_HP 默认截止 500 Hz 忘改**：位移能量恰恰集中在低频，500 Hz 一刀下去结果几乎为零——FAQ 附录专门列了这条
- **截止频率取多少**：Siemens 工程师的日常取值 1～2.5 Hz；不关心 5 Hz 以下运动的话取 5 Hz 也可。下限受传感器可用频带约束（ICP 加速度计低频本来就不准），上限受所关心的最低结构模态约束
- **时域滤波相移**：普通 IIR 滤波对不同频率引入不同延迟，做 Time Animation 会波形畸变，滤波模式要选零相位滤波（Zero Phase Filtering）；即便如此首尾过渡段仍有畸变，动画不要使用首尾段
:::

## 四、只要级值：频域积分路线

如果目的只是整体级（Overall Level）或谱级（比如位移 RMS 随转速的趋势），不必碰时域双重积分。频域积分（frequency domain integration）是逐谱线除以 $\omega$，快且稳；需要防备的仍是 0 Hz：Overall Level 从 0 Hz 起积分，直流谱线经 1/ω 放大后主导整个结果。官方给两个对策：

1. **First bins to clear 设 2**：把 0 Hz 和第一根谱线清零再积分，在 Time Data Processing 的 Channel Processing 里设置
2. **改用频率段落（Frequency Section）**：不积 Overall，直接算 1 Hz～6400 Hz 的 Frequency Section（带宽 6400 Hz 场景），从源头绕开直流

![频率段落设置：1 Hz 起算代替含 0 Hz 的 Overall Level](/images/integrate-acc-to-displacement/community-freq-section.jpg)
*（图源：Simcenter Testing Knowledge Base）*

图谱域还有一个顺手的技巧：扭振（torsional vibration）分析里转速波动阶次想换成角度位移显示，右键 Y 轴 → Processing → Integrate (Single)，一步完成（与旋转机械手册 TIP 2 的操作一致）；峰值/RMS/峰峰值（peak-to-peak）在同一菜单的 Section Scaling 里切换。

![2 阶扭振阶次：转速波动经右键 Integrate (Single) 直接转成角度显示](/images/integrate-acc-to-displacement/rot_p46_0.png)
*（图源：Simcenter Testing Knowledge Base）*

## 五、Python 复现：预处理决定漂移与否

用 numpy 把第二节的误差来源和第四节的频域路线走一遍：信号 = 10 Hz 正弦加速度（真实位移幅值 253.3 μm）+ 0.5 Hz 低频干扰 + 0.001 m/s² 偏置 + 线性漂移。

```python
import numpy as np

fs, T = 1024, 8.0
t = np.arange(int(fs*T)) / fs
acc = 1.0*np.sin(2*np.pi*10*t) + 0.1*np.sin(2*np.pi*0.5*t) + 0.001 + 0.01*t
dt = 1/fs
freqs = np.fft.rfftfreq(len(t), dt)

# 错误示范：cumsum 双重积分，什么都不做
raw = np.cumsum(np.cumsum(acc)*dt)*dt
print(f"10 Hz 分量理论位移幅值: {1/(2*np.pi*10)**2*1e6:.2f} um")
print(f"直接双重积分: 末端漂移 {raw[-1]*1e3:.0f} mm")

# 正确路线：频域逐谱线积分 + 2 Hz 高通
A = np.fft.rfft(acc); A[0] = 0                 # 清零直流，对应 First bins to clear
D = np.zeros_like(A)
D[1:] = -A[1:] / (2*np.pi*freqs[1:])**2        # 积分算子 1/(jw)^2
H = (freqs/2.0)**2 / (1+(freqs/2.0)**2)        # 2 Hz 平滑高通
disp = np.fft.irfft(D*H, n=len(t))
print(f"频域积分+高通后: 位移峰峰值 {(disp.max()-disp.min())*1e6:.0f} um")
i10 = np.argmin(np.abs(freqs-10))
print(f"位移谱 10 Hz 幅值: {abs(D[i10]*H[i10])/len(t)*2*1e6:.1f} um (理论 253.3)")
```

三行输出三个看点：什么都不做时末端漂移 **1267 mm**——远超任何物理行程，其中线性漂移项 $bt^3/6$ 独占 853 mm；频域积分加高通后漂移彻底消失，位移谱上 10 Hz 谱线读数 **243.5 μm**，与理论值 253.3 μm 的差恰好等于 2 Hz 高通在 10 Hz 处 0.962 的增益（253.3×0.962=243.6）；峰峰值约 2 mm 是残余的 0.5 Hz 干扰（10.1 mm 幅值被 2 Hz 高通压到 0.059 倍）——想进一步压低它就得抬高高通截止频率，代价是真实低频位移同样被衰减，这一权衡无法回避。

::: tip 流程选择
- 要时域波形、峰值、动画 → FAQ 630 五步法（DETREND_AC + 升采样 + DOUBLEINTEGRATE + 降采样 + FILTER_HP）
- 只要级值趋势 → 频域路线，First bins to clear=2 或 1 Hz 起的频率段落
- 扭振角度显示 → 图谱右键 Integrate (Single)，别绕时域
- 结果合理性校验（sanity check）：拿手算核对主导频率分量 $|x|=A/(2\pi f)^2$ 的量级，差一个数量级以上先查 HP 截止和 DETREND 阶数
:::

## 六、小结

积分漂移不是软件 bug，是 $1/(j\omega)^2$ 对低频平方放大的数学必然：偏置变 $t^2$，线性漂移变 $t^3$，1 Hz 噪声比 100 Hz 信号位移大一万倍。判断标准就三条——积分前 DETREND_AC 去趋势、积分后 1～2.5 Hz 高通清积分常数、Simpson 积分前后各配一次 4 倍升降采样；只要级值就绕开时域，用清零首两根谱线或 1 Hz 起算的频域段落。默认 500 Hz 截止忘改、把残余低频干扰当作位移交差，是这条路上最常见的两类错误。
