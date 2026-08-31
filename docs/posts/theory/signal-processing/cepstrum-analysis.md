---
title: "倒频谱：齿轮箱边带诊断的数学透镜"
---

# 倒频谱：齿轮箱边带诊断的数学透镜

> 变速箱近旁放一支麦克风，录下来做 FFT，谱上一片峰林——哪个峰是齿轮啮合的谐波，哪个是隔壁液压泵的，分不清。倒频谱（Cepstrum）把对数化的幅值谱再做一次逆傅里叶变换，等间距的谐波族和边带族各自塌缩成一根谱线：48 Hz 啮合频率变成 20.8 ms 处的一个峰，峰高直接告诉你这族谐波有多强。这篇文章从调幅公式一步步推出"谱的谱"为什么有这种折叠能力，用 numpy 复现整个流程，并给出 Testlab 里三步搭出倒频谱的路径和三个必踩的坑。

## 一、工程问题：谱上一堆峰，哪个是齿轮的

Simcenter 知识库给过一个典型案例。一对齿轮：主动轮 42 齿、转速 68.57 rpm，从动轮 72 齿、转速 40 rpm。啮合频率（Gear Mesh Frequency）两只齿轮算出来相同：

$$f_{mesh} = \frac{N_A \cdot rpm_A}{60} = \frac{42 \times 68.57}{60} = 48 \text{ Hz} = \frac{72 \times 40}{60}$$

在机器旁录了两段声音，一段齿轮健康、一段有局部缺陷。时域波形看不出区别——健康那段的幅值甚至略大。

![齿轮对时域录音对比](/images/cepstrum-analysis/gear-time-signals.png)

*有缺陷（上，橙）与无缺陷（下，蓝）的时域录音几乎无法区分（图源：Simcenter Testing Knowledge Base）*

转成频谱呢？峰林立。啮合频率的谐波混在阀门、电机和车间背景噪声里，肉眼找不到那族"每隔 48 Hz 一个"的峰。

![频谱对比](/images/cepstrum-analysis/gear-spectrum.png)

*频域同样难以判读：谐波被其他设备与背景噪声掩盖（图源：Simcenter Testing Knowledge Base）*

但有一条线索始终没变：齿轮产生的谐波和边带在频率轴上是**等间距**排列的。间距就是啮合频率（谐波之间）或轴频（边带之间）。倒频谱要做的，就是把"等间距"这个结构特征从噪声里拎出来。

::: info 核心概念
- **倒频谱（Cepstrum）**：对时域信号先做 FFT 取幅值、取对数、再做逆 FFT 得到的函数，俗称"谱的谱"
- **倒频率（Quefrency）**：倒频谱的横轴，单位是秒但**不是时间**——相位在取对数时已经丢弃；峰的位置等于频域结构间距的倒数
- **边带（Sideband）**：载波频率 $F_c \pm F_m$ 两侧的峰族，旋转机械中通常由缺陷对幅值的调制引起
- **Rahmonic**：倒频谱峰自身的"谐波"，出现在 $2q, 3q\ldots$ 处，多数是算法产物
:::

## 二、从定义推起：为什么"谱的谱"能折叠谐波族

### 第一步：缺陷调幅，制造边带

局部缺陷（点蚀、剥落）每被齿面碾过一次就撞一下，啮合波的幅值随之起伏。数学上这是标准调幅：载波 $f_c$（啮合频率的谐波）、调制频率 $f_m$（轴频），信号写成

$$x(t) = \left[1 + m\cos(2\pi f_m t)\right]\cos(2\pi f_c t)$$

用积化和差展开乘积项：

$$m\cos(2\pi f_m t)\cos(2\pi f_c t) = \frac{m}{2}\cos\left(2\pi (f_c+f_m) t\right) + \frac{m}{2}\cos\left(2\pi (f_c-f_m) t\right)$$

结论：调幅不在 $f_m$ 处产生能量，而是把载波"劈"成三根——$f_c$ 和 $f_c \pm f_m$。缺陷越重（$m$ 越大），边带越高。频谱上每个啮合谐波两侧都挂上一串以轴频为间距的边带。

![调幅产生边带](/images/cepstrum-analysis/modulation.png)

*无调制（上）与被调制的载波（下）：调制让频谱长出边带族（图源：Simcenter Testing Knowledge Base）*

### 第二步：对数把"乘"变"加"

测到的谱从来不是纯源谱。结构传递路径把源过滤一遍：时域卷积 $x(t)=s(t)*h(t)$，频域相乘 $X(f)=S(f)\cdot H(f)$。取对数：

$$\log|X(f)| = \log|S(f)| + \log|H(f)|$$

乘法变加法，源和路径**线性叠加**在 $\log|X|$ 上。这一步是倒频谱全部魔力的来源：齿轮源 $S$ 是频域梳齿（周期性强），路径 $H$ 是缓变的共振包络（平滑）。对数还有压缩动态范围的作用——啮合谐波幅值按 $1/h$ 衰减，线性尺度下六次谐波比基波低 16 dB 早被噪底吃掉，取对数后每根谐波的纹波贡献拉到可比的水平，周期结构才立得起来。

### 第三步：频域周期 → 倒频域单峰

关键对偶：时域周期 $T$ 的信号，频谱是间距 $1/T$ 的离散谱线（傅里叶级数）。把同样的逻辑用在频率轴上——$\log|X(f)|$ 若以 $\Delta f$ 为周期起伏（梳齿间距），它就可以展开成以 $n/\Delta f$ 为变量的傅里叶级数，而逆 FFT 干的正是计算这组系数的活。于是：

$$c(q) = \left|\text{IFFT}\left[\log|\text{FFT}(x)|\right]\right| \quad\Rightarrow\quad \text{峰出现在 } q = \frac{1}{\Delta f}$$

间距 48 Hz 的谐波梳齿塌缩成 20.8 ms 处的一根峰；间距 4 Hz 的边带族塌缩成 250 ms 处的一根峰。梳齿的条数越多、越齐，峰越高——峰高是"这族谐波有多强"的直接度量，这正是健康/故障判别的抓手。

![三种域的对比](/images/cepstrum-analysis/signal-transforms.png)

*正弦、锯齿、方波、随机信号在时域/频域/倒频谱中的形态：只有频域含等间距结构的信号在倒频谱上有峰（图源：Simcenter Testing Knowledge Base）*

| 输入信号 | 频域形态 | 倒频谱形态 |
| --- | --- | --- |
| **单频正弦** | 单根谱线，无梳齿 | 平坦噪声状，无峰 |
| **锯齿波** | 全部谐波，间距 = 基频 | $1/f_0$ 处一根主峰 |
| **方波** | 仅奇次谐波，间距 = 2×基频 | $1/(2f_0)$ 处一根主峰 |
| **随机噪声** | 平坦毛糙 | 平坦毛糙 |
| **故障齿轮** | 谐波+边带两套梳齿混在噪声里 | 两根峰：$1/f_{mesh}$ 与 $1/f_{shaft}$ |

![域与单位](/images/cepstrum-analysis/domains-units.png)

*时域—频域—倒频谱的换算路径与各域常用单位（图源：Simcenter Testing Knowledge Base）*

::: warning quefrency 不是时间
倒频谱横轴量纲是秒，但它不是时域。取对数时相位已经扔掉，逆变换回不去原信号；峰位置只应读作"频域间距的倒数"（$f = 1/q$）。把 20.8 ms 解释成"每 20.8 ms 撞一次"碰巧对，把 rahmonic 的 41.7 ms 解释成"每 41.7 ms 撞一次"就错了——那是算法在峰的倍数位置生成的假峰。
:::

## 三、numpy 复现：两根峰读出啮合频率与轴频

仿真一只齿轮箱：6 阶啮合谐波（幅值 $1/h$），故障工况下谐波被轴频 4 Hz 调幅（边带族），叠加高斯噪声。按工程流程分帧、加汉宁窗、自功率谱（Autopower）能量平均后取 $\log_{10}$ 再 IFFT。

```python
import numpy as np

fs, Tf, navg = 4096, 1.0, 64              # 采样率、帧长 1 s、平均 64 帧
Nf = int(fs*Tf)
f_shaft, f_gmf = 4.0, 48.0                # 轴频 4 Hz、啮合频率 48 Hz
t = np.arange(navg*Nf)/fs
rng = np.random.default_rng(7)

def gear_vib(depth):
    # 6 阶啮合谐波（幅值 1/h），depth 为轴频调幅深度（模拟局部缺陷）
    x = sum((1/h)*(1+depth*np.sin(2*np.pi*f_shaft*t))*np.sin(2*np.pi*h*f_gmf*t)
            for h in range(1, 7))
    return x + rng.normal(0, 0.5, t.size)

def cepstrum(x):
    # 分帧 -> 汉宁窗 -> 自功率谱能量平均 -> log10 -> IFFT
    w = np.hanning(Nf)
    ap = sum(np.abs(np.fft.rfft(fr*w))**2 for fr in x.reshape(navg, Nf))/navg
    return np.abs(np.fft.irfft(np.log10(ap+1e-12)))

q = np.arange(Nf)/fs                       # 倒频率轴（秒）
for name, d in [("健康", 0.0), ("故障", 0.7)]:
    c = cepstrum(gear_vib(d))
    i1 = np.argmin(np.abs(q-1/f_gmf))      # 20.8 ms：啮合谐波梳齿
    i2 = np.argmin(np.abs(q-1/f_shaft))    # 250 ms：边带族
    print(f"{name}: c@20.8ms={c[i1]:.3f}  c@250ms={c[i2]:.3f}")
```

```
健康: c@20.8ms=0.019  c@250ms=0.006
故障: c@20.8ms=0.039  c@250ms=0.015
```

最值得看的是两个数：故障让 20.8 ms（$1/f_{mesh}$）峰翻倍——调幅把边带能量塞进每个谐波附近，梳齿变密变强；250 ms（$1/f_{shaft}$）峰涨到 2.5 倍——这一根是边带族独有的指纹，健康齿轮根本没有。知识库的实测案例里，缺陷数据的倒频谱峰同样显著高于正常数据，倒频率 0.02083 s，取倒数正好 48 Hz 啮合频率。

![实测倒频谱](/images/cepstrum-analysis/gear-cepstrum.png)

*同一对齿轮的倒频谱：缺陷（橙）在 20.8 ms 处的峰明显高于正常（蓝）（图源：Simcenter Testing Knowledge Base）*

![倒频率峰读数](/images/cepstrum-analysis/quefrency-peak.png)

*q = 0.02083 s，1/q = 48 Hz，正对啮合频率（图源：Simcenter Testing Knowledge Base）*

## 四、Testlab 实操：三条公式搭出倒频谱

倒频谱在 Testlab 里没有现成按钮，靠 Throughput Processing 和 Data Calculator 两件工具串起来：

1. **时域到频域**：Signature Throughput Processing 插件（36 tokens）。Function 选 **Autopowers Linear**（取幅值，正是倒频谱要的输入），窗用 Hanning 防泄漏，平均次数给足。
2. **取对数**：Data Calculator 里新建公式，选 LOG10 函数，作用于谱数据（如 F1），输出记为 log。
3. **逆变换**：再建一条公式选 FFT_INVERSE，作用于上一步的 log 结果。

算出来的数据在 Navigator 里以 "AutoCorrelation" 类型出现——别慌，这就是倒频谱。拖进 Front/Back 显示后做两件事：X 轴下限设为零（IFFT 输出是双边谱，负半边是镜像）；Y 轴放大缩小，峰在零点附近很尖，不放大看不见。

![Testlab 三步流程](/images/cepstrum-analysis/testlab-steps.png)

*倒频谱计算步骤（上）与所需软件模块（下）（图源：Simcenter Testing Knowledge Base）*

license 有一个硬门槛：Data Calculator 需要 Desktop Standard 与 Advanced 档许可，只有 Desktop Standard 时这步做不了（Advanced Desktop 下 Data Calculator 不额外耗 token）。另外截至 2406 版本，Testlab Neo 尚不支持倒频谱处理，得回 Classic 界面。

## 五、三个必踩的坑

### 坑一：不做平均，峰被对数噪底吃掉

$\log$ 是非线性运算，单帧谱的噪底在 log 域里起伏剧烈，倒频谱上表现为一片随机毛刺，把真峰埋掉。同样一组数据，单帧和 64 帧能量平均的差别：

```python
import numpy as np

fs, Tf = 4096, 1.0
Nf = int(fs*Tf)
t = np.arange(64*Nf)/fs
f_shaft, f_gmf = 4.0, 48.0
rng = np.random.default_rng(7)
x = sum((1/h)*(1+0.7*np.sin(2*np.pi*f_shaft*t))*np.sin(2*np.pi*h*f_gmf*t)
        for h in range(1, 7)) + rng.normal(0, 0.5, t.size)
fr, w = x.reshape(64, Nf), np.hanning(Nf)
ap64 = sum(np.abs(np.fft.rfft(k*w))**2 for k in fr)/64    # 64 帧平均
ap1  = np.abs(np.fft.rfft(fr[0]*w))**2                     # 单帧
q = np.arange(Nf)/fs
for name, ap in [("64 帧平均", ap64), ("单帧", ap1)]:
    c = np.abs(np.fft.irfft(np.log10(ap+1e-12)))
    i = np.argmin(np.abs(q-1/f_shaft))
    floor = np.median(c[np.logical_and(q > 0.4, q < 0.9)])
    print(f"{name}: 250 ms 峰 {c[i]:.3f} / 噪底 {floor:.3f} = {c[i]/floor:.1f} 倍")
```

```
64 帧平均: 250 ms 峰 0.016 / 噪底 0.001 = 19.8 倍
单帧: 250 ms 峰 0.024 / 噪底 0.005 = 5.0 倍
```

信噪比差 4 倍。这也是知识库建议**选能用的最粗频率分辨率**的真正原因：同样的总记录长度，粗分辨率意味着短帧、多帧数、更多次平均——log 域噪底方差随帧数增多而压下去。分辨率定到 0.5 Hz、1 Hz 这么细，帧变长、帧数骤减，噪底反而压不平。

频率分辨率还有第二重约束，方向相反：$\Delta f$ 决定了**最大可分辨倒频率** $q_{max} = 1/\Delta f$。要看间距 4 Hz 的边带族（250 ms 峰），谱必须能表示 250 ms 的倒频率，$\Delta f$ 不得超过 4 Hz；8 Hz 分辨率下 q 轴只到 125 ms，250 ms 峰直接出图。两个约束夹起来，分辨率的选择窗口是：**边带间距的 1/2 以下、同时尽可能粗**。

### 坑二：转速一波动，频域先糊

倒频谱的前提是梳齿在频率轴上位置稳定。转速哪怕缓慢漂移，谐波峰在谱上滑动拖尾，等间距结构被抹掉，倒频谱跟着失效。解法是阶次域：用转速信号把时域数据重采样到转角域（同步采样），再走同样的 FFT→log→IFFT 流程。数学完全同构，只是 $1/f$ 换成 $1/o$（阶次的倒数），阶次与齿数、减速比直接挂钩，多级齿轮箱的倒频谱峰可以对号入座到具体齿轮副。Simcenter Anovis 的下线检测（EOL）就是这么用倒频谱峰设合格限的。

### 坑三：rahmonic 假峰当成故障查

倒频谱峰自己在 $2q, 3q$ 处会生成 rahmonic。案例里 20.83 ms 的峰在两倍位置有伴峰，按 $f=1/q$ 反算得 24 Hz——机器里根本没有任何 24 Hz 的部件。查谱前先做除法：$2 \times 24 = 48$，正好是主峰频率的两倍关系，确认是 rahmonic，忽略。

::: tip 判读清单
- 峰在 $1/f_{mesh}$：啮合谐波族强度，做趋势监测——峰逐月抬高说明齿面磨损在发展
- 峰在 $1/f_{shaft}$：该轴上有局部缺陷（调幅边带的指纹），轴承内圈、外圈故障同理会给出各自间距的边带族
- 峰的倍数位置：先验 rahmonic，别急着下结论
- 转速不稳的工况：一律转阶次域再算
:::

## 六、方法边界与选择

| 你的数据 | 该不该用倒频谱 | 替代/补充手段 |
| --- | --- | --- |
| **稳速齿轮箱，谱上峰林分不清归属** | 首选，两根峰定位谐波族与边带族 | 谐波游标（Harmonic Cursor）辅助确认 |
| **变转速工况** | 频率域不可用，先同步采样转阶次域 | 阶次切片与倒频谱组合 |
| **轴承早期冲击故障** | 可用但非最强工具 | 希尔伯特包络解调更直接 |
| **单根离散音（电机电磁噪声）** | 没有梳齿结构，无峰可看 | 窄带谱与音源识别 |
| **下线检测要设合格限** | 峰位置绑定齿轮副，适合设限报警 | Simcenter Anovis 内置该流程 |

倒频谱不是又一棵分析树上的新枝，而是把"频域里的周期性"当成信号来分析的视角切换。齿轮和轴承的故障签名恰好都是频域梳齿，所以这套 1963 年为语音基音分析发明的工具，在旋转机械诊断里成了常青树——记住一点就够用：**峰的位置告诉你间距是多少，峰的高度告诉你这族结构有多强，峰的趋势告诉你机器正在往哪走**。
