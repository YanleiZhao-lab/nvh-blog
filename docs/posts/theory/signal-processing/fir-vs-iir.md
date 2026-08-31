---
title: "FIR 与 IIR 滤波器：相位线性与实现代价"
---

# FIR 与 IIR 滤波器：相位线性与实现代价

> 数字滤波器只有两大门派：FIR 只用输入，IIR 把输出也喂回去。同样截止 150 Hz 的低通，IIR 用 4 阶就能顶上 FIR 十几个系数的滚降，但代价是时延随频率变、还可能不稳定。什么时候选谁，取决于做实时处理还是事后分析、要不要保相位。

## 一、滤波器在干什么

滤噪声、去漂移、A 计权、抗混叠——NVH 测试里到处是滤波。它们都在做同一件事：改变时域信号的频率成分。以低通为例：通带内的频率原样放行，阻带内的成分压低甚至清零，中间隔着一段过渡带。幅度调整量既可以用线性倍数表示，也可以换算成 dB——线性减半就是 -6 dB，不动就是 0 dB。

Simcenter 手册里有个比喻：FIR 是乌龟，慢但稳，一定能跑完全程；IIR 是野兔，快，但偶尔翻车。两类滤波器的全部差异，都源于一个数学区别。

### 从差分方程看本质区别

FIR（有限脉冲响应，Finite Impulse Response）的输出只由输入的加权和决定：

    y(n) = a(0)*x(n) + a(1)*x(n-1) + ... + a(N)*x(n-N)

IIR（无限脉冲响应，Infinite Impulse Response）把输出也反馈回来：

    y(n) = a(0)*x(n) + ... + a(N)*x(n-N) + b(1)*y(n-1) + ... + b(P)*y(n-P)

就多了最后一项——递归。系数个数叫滤波器的阶数，也叫抽头数 taps。递归让 IIR 的一个系数顶 FIR 好几个用，但也埋下两个隐患：相位非线性，反馈还可能发散。

::: info 核心概念
- **FIR**：输出只依赖输入，脉冲响应有限长，永远稳定
- **IIR**：输出反馈回输入（递归），脉冲响应无限长，可能不稳定
- **阶数 / 抽头数**：滤波器系数个数，直接决定计算量和滚降陡度
- **滚降 Roll off**：通带边沿到阻带的下降速度，越陡过渡带越窄
:::

## 二、效率之争：IIR 用低阶换 FIR 的高阶

同一阶数下 IIR 滚降更陡——递归项相当于用少量系数实现无限长的脉冲响应。反过来讲，达到同样的滚降，IIR 需要的阶数远低于 FIR。

![IIR 用更低阶数实现与 FIR 相当的性能](/images/fir-vs-iir/iir-lower-order.png)
*（图源：Simcenter Testing Knowledge Base）*

手册的总结对比图：

![FIR 与 IIR 滤波器特性对比](/images/fir-vs-iir/fir-iir-summary.png)
*（图源：Simcenter Testing Knowledge Base）*

把两边拉到同一起跑线（同样截止 150 Hz 的低通、滚降相当），算一笔账：

| 维度 | **FIR（15 系数）** | **IIR（4 阶 Butterworth）** |
| --- | --- | --- |
| 每样本乘加次数 | 15 次 | 5 次（两个双二阶节） |
| 衰减 @200 Hz | -14.8 dB | -14.2 dB |
| 衰减 @300 Hz | -44.7 dB | -34.7 dB |
| 通带相位 | 严格线性 | 非线性，截止频率附近最严重 |
| 时延 | 恒定 (N-1)/2 样本 | 随频率变化 |
| 稳定性 | 永远稳定 | 可能不稳定 |
| 典型用途 | 事后分析、相位敏感 | 实时处理、嵌入式 |

实时场景里这笔账很硬：实时选频试听、车载控制器里的在线滤波，计算量直接决定可行性，IIR 是默认选择。

```python
import numpy as np

fs = 1000.0; fc = 150.0

# FIR 低通：sinc 截断 + 汉宁窗，15 个系数
N = 15
k = np.arange(N) - (N - 1) / 2
h = np.sinc(2 * fc / fs * k) * np.hanning(N); h /= h.sum()

# IIR 低通：4 阶 Butterworth，两个双二阶节级联
w0 = 2 * np.pi * fc / fs; Q = 1 / np.sqrt(2)
al = np.sin(w0) / (2 * Q); c = 1 - np.cos(w0)
b = np.array([c/2, c, c/2]) / (1 + al)
a1, a2 = -2*np.cos(w0)/(1+al), (1-al)/(1+al)

def H_fir(f):
    return abs((h * np.exp(-2j*np.pi*f/fs * np.arange(N))).sum())
def H_iir(f):
    z = np.exp(-2j*np.pi*f/fs)
    return abs(((b[0]+b[1]*z+b[2]*z**2) / (1+a1*z+a2*z**2))**2)

print(f"{'频率':>6} {'FIR(15系数)':>12} {'IIR(4阶)':>10}")
for f in [50, 100, 150, 200, 300, 450]:
    print(f"{f:>5.0f}Hz {20*np.log10(H_fir(f)):>+10.1f} dB {20*np.log10(H_iir(f)):>+9.1f} dB")
print(f"\n每样本乘加: FIR {N} 次 vs IIR 5 次（两个双二阶节）")
```

运行结果要点：滚降相当（200 Hz 处 -14.8 dB 对 -14.2 dB），但 FIR 每样本要做 15 次乘加，IIR 只做 5 次——三倍的计算量差距。

::: warning IIR 的高效不是白拿的
递归结构可能不稳定：系数设计不当或量化截断后，反馈会发散，输出直接爆掉。FIR 全是有限项加权求和，数学上不可能发散。嵌入式平台做定点实现时，IIR 要格外小心系数量化带来的稳定性问题。
:::

## 三、时延与相位：FIR 的线性从哪来

滤波不是瞬移，输出相对输入有一段时延。FIR 的时延有解析表达式：要有 N 个数据点喂满滤波器它才真正工作，所以时延恒等于 (N-1)/2 个样本，所有频率一视同仁。这等价于时域整体平移——相位随频率严格线性变化，信号里各频率成分的相对关系滤完不变。

IIR 没有这个保证：不同频率的时延不一样，截止频率附近时延最大，通带内各成分的相对相位被扭曲，波形会变形。

![FIR 恒定时延，IIR 时延随频率变化](/images/fir-vs-iir/group-delay.png)
*（图源：Simcenter Testing Knowledge Base）*

```python
import numpy as np

fs = 1000.0; fc = 150.0

# 同两款低通滤波器：15 系数 FIR 与 4 阶 Butterworth IIR
N = 15
k = np.arange(N) - (N - 1) / 2
h = np.sinc(2 * fc / fs * k) * np.hanning(N); h /= h.sum()
w0 = 2 * np.pi * fc / fs; Q = 1 / np.sqrt(2)
al = np.sin(w0) / (2 * Q); c = 1 - np.cos(w0)
b = np.array([c/2, c, c/2]) / (1 + al)
a1, a2 = -2*np.cos(w0)/(1+al), (1-al)/(1+al)

def H_fir(f):
    return (h * np.exp(-2j*np.pi*f/fs * np.arange(N))).sum()
def H_iir(f):
    z = np.exp(-2j*np.pi*f/fs)
    return ((b[0]+b[1]*z+b[2]*z**2) / (1+a1*z+a2*z**2))**2
def gd(H, f):   # 相邻 1Hz 相位差 -> 群时延（样本数）
    return -np.angle(H(f + 1) / H(f)) / (2*np.pi/fs)

print(f"{'频率':>6} {'FIR时延':>8} {'IIR时延':>9}  (样本)")
for f in [50, 100, 140, 150, 160, 250, 400]:
    print(f"{f:>5.0f}Hz {gd(H_fir,f):>8.2f} {gd(H_iir,f):>9.2f}")
print(f"FIR 时延恒为 (N-1)/2 = {(N-1)/2:.0f} 样本；IIR 随频率变化")
```

运行结果要点：FIR 从 50 Hz 到 400 Hz 时延钉死在 7.00 个样本；IIR 在 100 Hz 附近 3.71 个样本、400 Hz 只剩 0.82 个样本，时延随频率漂移，相位关系保不住。

时延失真在两个场合会咬人：

- **声振关联排查**：多通道同时录了声音和振动，只给声音通道加了滤波——声音相对振动整体后移。想判断某个振动事件是不是某个异响的来源，时间对不上就会误判
- **工作变形分析 ODS**：一组振动通道里有的滤波有的没滤，通道间相位关系被改，动画出来的结构变形形态直接是错的

## 四、零相位滤波：事后处理的一招补救

数据已经采完、在电脑上离线处理时，时延可以彻底消掉：把信号正向滤一遍，反转，再滤一遍，再反转回来。两次滤波的时延互相抵消，这就是零相位滤波（Zero Phase）。

代价也很直白：计算量翻倍；尾部会被吃掉一段（反转滤波从末尾起算）；只对已数字化的数据可行，模拟信号没法倒着流。还有个副作用——数据被滤了两遍，衰减也翻倍，滚降更陡，设定截止频率时要心里有数。

```python
import numpy as np

fs = 1000.0
t = np.arange(600) / fs
x = np.sin(2 * np.pi * 30 * t)          # 30 Hz 正弦，0.6 秒

# 一阶 IIR 低通（截止 60 Hz），只用 numpy 逐样本递推
alpha = np.exp(-2 * np.pi * 60 / fs)
def lp(v):
    y = np.zeros_like(v)
    for i in range(1, len(v)):
        y[i] = (1 - alpha) * v[i] + alpha * y[i - 1]
    return y

y_fwd = lp(x)                    # 直接滤波
y_zero = lp(y_fwd[::-1])[::-1]   # 正向滤 -> 反转 -> 再滤 -> 反转

def lag(y):                      # 互相关找时延（样本数）
    c = np.correlate(y - y.mean(), x - x.mean(), 'full')
    return np.argmax(c) - (len(x) - 1)

print(f"直接滤波时延: {lag(y_fwd):+d} 样本（{lag(y_fwd)/fs*1000:.1f} ms）")
print(f"零相位时延  : {lag(y_zero):+d} 样本")
print(f"直接滤波幅值: {np.max(np.abs(y_fwd)):.3f}")
print(f"零相位幅值  : {np.max(np.abs(y_zero)):.3f}  （滤两遍，衰减翻倍）")
```

运行结果要点：直接滤波输出滞后 2 个样本，零相位滤波时延归零；30 Hz 幅值从 0.902 掉到 0.810——两遍滤波的衰减叠加，这正是零相位的隐藏代价。

::: tip 工程选择原则
- **离线处理、关心波形和相位**（ODS、声振关联、TPA）→ 零相位滤波，或用 FIR 后按 (N-1)/2 平移补偿
- **实时处理、嵌入式**（车载在线监测、实时试听）→ IIR，阶数低计算省
- **设计方法怎么挑**：通带要平选 Butterworth；过渡带最窄选 Cauer 椭圆；相位要最平选 Bessel——IIR 家族里唯一时延接近恒定的
- **通道一致性铁律**：一组通道要么都滤要么都不滤，用同一款滤波器同一组参数
:::

## 五、小结

选型就三条判据：要不要实时、要不要相位、敢不敢冒不稳定的险。实时且不看相位，选 IIR；离线分析，FIR 或零相位滤波把时延问题一次解决；多通道联合分析，全部通道用完全相同的滤波设置。

Simcenter Testlab 里在 Time Signal Calculator 的 Conditioning 组调 FILTER_LP 等函数，可指定 FIR 或 IIR、阶数与方法；Show 按钮直接预览幅频、相位和群时延。动手前先看一眼群时延曲线，比事后排查时间对不上的问题省得多。
