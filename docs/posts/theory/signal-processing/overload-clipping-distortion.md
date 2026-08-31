---
title: "信号过载：削波如何毁掉整条频谱"
---

# 信号过载：削波如何毁掉整条频谱

> 采集系统红灯一亮，代价不只是"信号超了"——削波把正弦切成方波，方波的傅里叶级数是无穷奇次谐波，畸变能量会涂抹进整条分析带宽。这篇讲清三类过载怎么区分、畸变从哪来、量程到底该怎么设，读完你能从过载报告反推问题出在哪一环。

## 一、过载不止一种：先分清是谁在削

过载（Overload）指输入信号电压超出传感器或采集系统可承受的量程，超出部分被**削波（clipping）**——顶部被"切平"。

工程里真正麻烦的是：过载发生在链条的三个不同位置，处理方法完全不同。

| 过载类型 | 发生位置 | 典型特征 | 处置方向 |
| --- | --- | --- | --- |
| **采集系统过载** | DAQ 前端量程设小了 | 红灯亮、overload 标志置位 | 加大量程（SCADAS 最大 10V） |
| **传感器过载** | 加速度计/麦克风本体超限 | DAQ 量程富余仍削波 | 换低灵敏度传感器（100mV/g 换 10mV/g） |
| **带外过载** | 带宽外的高频大幅信号 | 带内数据看着正常，系统却报警 | 外接低通滤波器，或换低灵敏度传感器 |

![1V 正弦被 0.5V 量程削顶](/images/overload-clipping-distortion/clip-time-domain.png)
*（图源：Simcenter Testing Knowledge Base）*

带外过载最隐蔽：屏幕上带内频谱一切正常，系统却在报警。此时别急着怀疑设备——先想想有没有带宽之外的结构共振或冲击成分在打满量程。

::: warning 带外过载也毁数据
手册里加粗警告的那句话值得抄在工位上：**即使过载发生在带宽之外，谐波畸变照样会出现在整条分析频段内**。抗混叠滤波器挡得住频率混叠，挡不住已经打满量程的电压。
:::

## 二、畸变从哪来：削波 = 隐形方波

时域削波的本质，是把"正弦形状"的信号切成了"方波形状"。而方波的傅里叶级数是基频的全部**奇次谐波**（3f、5f、7f 直到无穷）。

采集一段真实信号时，不同频率、不同相位的正弦在不同时刻被削顶，相当于在整个时间轴上制造出许许多多周期各异的小方波——它们的奇次谐波互相叠加，把能量涂抹到整个频率范围。这就是**谐波畸变（harmonic distortion）**。

![削波信号（红）在频域的能量涂抹](/images/overload-clipping-distortion/overload-spectrum-compare.png)
*（图源：Simcenter Testing Knowledge Base）*

手册的实验：同一瞬态信号分别用 10V 和 0.16V 量程采集。0.16V 那次时域削顶，频域上红色谱线从低频到高频整条抬升——不只基频错了，全带宽的底噪都变了。

![多个方波叠加产生的谐波畸变谱](/images/overload-clipping-distortion/harmonic-distortion-spectra.png)
*（图源：Simcenter Testing Knowledge Base）*

![带外过载：带宽外的频率成分仍打满量程](/images/overload-clipping-distortion/out-of-band-overload.png)
*（图源：Simcenter Testing Knowledge Base）*

::: info 核心概念
- **削波（clipping）**：信号超出量程被切平顶部，时域损伤
- **谐波畸变（harmonic distortion）**：削波在频域的后果，奇次谐波涂抹全带宽
- **THD**：总谐波畸变，全部谐波能量与基波之比，衡量"方波化"程度
:::

## 三、Python 演示：削波深度与频谱损伤

复现手册实验：1V 峰值正弦，量程只有正负 0.16V，看频谱坏到什么程度。

```python
import numpy as np

# 手册场景复现: 1V 峰值正弦, 采集量程 ±0.16V
fs = 4096; N = fs
t = np.arange(N) / fs
sig = 1.0 * np.sin(2*np.pi*50*t)      # 50 Hz 正弦, 峰值 1V
clipped = np.clip(sig, -0.16, 0.16)   # 量程 ±0.16V → 削顶

win = np.hanning(N)                   # 手写汉宁窗抑制泄漏
def amp(x):                           # 幅值谱(能量校正)
    return np.abs(np.fft.rfft(x*win)) * 2 / win.sum()

X, Xc = amp(sig), amp(clipped)
f = np.fft.rfftfreq(N, 1/fs)
i = lambda fc: np.argmin(np.abs(f - fc))

print(f"50Hz 基频幅值: 原始 {X[i(50)]:.3f} V | 削波后 {Xc[i(50)]:.3f} V")
print(f"150Hz 3次谐波: 原始 {X[i(150)]:.5f} V | 削波后 {Xc[i(150)]:.5f} V")
print(f"350Hz 7次谐波: 原始 {X[i(350)]:.5f} V | 削波后 {Xc[i(350)]:.5f} V")
thd = np.sqrt(sum(Xc[i(50*k)]**2 for k in range(3, 21, 2))) / Xc[i(50)]
print(f"削波信号奇次谐波 THD: {thd*100:.1f}%  (纯正弦应为 0%)")
```

运行结果要点：基频从 1V 掉到 0.203V（低估 80%），凭空冒出的 3 次谐波 0.065V、7 次谐波 0.023V，THD 达 40%。一次过载，幅值和频率两条线全错。

削波深度不同，伤害也不同。把量程从富余扫到严重不足：

```python
import numpy as np

# 削波深度扫描: 阈值从 1.5V (富余) 到 0.16V (严重不足)
fs = 4096; N = fs
t = np.arange(N) / fs
sig = 1.0 * np.sin(2*np.pi*50*t)
win = np.hanning(N)
def amp(x):
    return np.abs(np.fft.rfft(x*win)) * 2 / win.sum()
f = np.fft.rfftfreq(N, 1/fs)
i = lambda fc: np.argmin(np.abs(f - fc))

print(f"{'削波阈':>7} {'基波幅值':>9} {'基波误差':>9} {'THD':>7}")
for v in [1.5, 1.05, 0.9, 0.7, 0.5, 0.16]:
    X = amp(np.clip(sig, -v, v))
    fund = X[i(50)]
    thd = np.sqrt(sum(X[i(50*k)]**2 for k in range(3, 21, 2))) / fund
    print(f"{v:>6.2f}V {fund:>8.3f}V {(fund-1)*100:>8.1f}% {thd*100:>6.1f}%")
```

运行结果要点：阈值 0.9V——只削掉顶尖一点点——基波误差已有 3.7%、THD 4.2%。削波对数据质量的伤害在刚刚触顶时就已开始，不存在"稍微过载一下没关系"。

## 四、量程到底怎么设：指示条、余量与自动量程

Simcenter Testlab 的自动量程（Auto-ranging）三步操作：start ranging、hold level、set ranges。看电平指示条的颜色：白色是量程太大，绿色合适，橙色进余量区，红色即过载。

| 指示条颜色 | 含义 | 动作 |
| --- | --- | --- |
| **白** | 量程过大、信噪比差 | 缩小量程 |
| **绿** | 恰当 | 保持 |
| **橙** | 进入了余量区（overhead） | 可接受，留意瞬态 |
| **红** | 过载 | 立即加大量程或换传感器 |

余量（overhead）是给尖峰留的安全空间，常用设置 6 dB（约为输入量程的 50%）。Testlab 的 Range Checking 窗口里可以改这个值，建议同时勾选"Use full range when auto-ranging"。

::: tip 为什么不能全程用 10V 挡
- 最大量程避开了过载，却把小信号压进 ADC 的低量化区，信噪比恶化——量化误差是另一个隐形杀手
- 正确做法：预采一段工况，自动量程 + 6 dB 余量，让信号落在量程的中上部
- 瞬态冲击类信号（路噪、关门、启停）余量适当再放大，宁可 10 dB
:::

## 五、过载之后：报告会告诉你哪坏了

测量结束后若出现过载，Testlab 会弹警告并生成报告。在 Navigator 里浏览到该 run，能看到 Online 与 Offline 两份 Overload Logging 报告，里面列出**哪个通道、在什么时刻**过载。

拿到报告先按位置分诊：

- 过载时刻与转速/工况对得上 → 真实信号超限，处理传感器端
- 过载时刻随机散布 → 大概率带外高频或接地干扰，查屏蔽和外接滤波
- 只有一个通道反复过载 → 检查该通道灵敏度设置与实际传感器是否匹配

## 六、小结

过载毁掉的不只是超限那几个点——削波产生的奇次谐波涂抹全带宽，带内看着正常也可能是带外过载。判断顺序：先看报告定位通道与时刻，再分清三类过载（系统、传感器、带外），量程设置用自动量程加 6 dB 余量，瞬态场景再放宽。红灯亮过的数据，别直接进分析报告。
