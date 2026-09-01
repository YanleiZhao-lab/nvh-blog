---
title: "倒频谱：齿轮箱边带与谐波族的检测方法"
---

# 倒频谱：齿轮箱边带与谐波族的检测方法

> 变速箱近旁测得的声音信号经 FFT 后谱峰密集，难以区分齿轮啮合谐波与其他设备（如液压泵）的谱峰。倒频谱（Cepstrum）对对数化的幅值谱再做一次逆傅里叶变换，将频率轴上等间距排列的谐波族与边带族分别折叠为单根谱线：48 Hz 啮合频率对应 20.8 ms 处的峰，峰高指示该族谐波的总强度。本文从调幅公式出发分步推导"谱的谱"具备这种折叠能力的原理，用 numpy 复现完整流程，并给出 Testlab 中三步搭建倒频谱计算的路径与三类常见误用。

## 一、工程问题：谱峰密集，齿轮成分难以辨认

Simcenter 知识库给出过一个典型案例。一对齿轮：主动轮 42 齿、转速 68.57 rpm，从动轮 72 齿、转速 40 rpm。啮合频率（Gear Mesh Frequency）按两只齿轮计算结果相同：

$$f_{mesh} = \frac{N_A \cdot n_A}{60} = \frac{42 \times 68.57}{60}\ \text{Hz} = 48\ \text{Hz} = \frac{72 \times 40}{60}\ \text{Hz}$$

其中 $N_A$ 为齿数（无量纲），$n_A$ 为该齿轮所在轴的转速（单位 r/min，除以 60 换算为 Hz）。若以轴的转频为参考改用阶次域，啮合阶次在数值上等于齿数——旋转机械手册的示例中，86 齿齿轮在 600 rpm 轴上即产生 86 阶啮合。

在机器近旁录制两段声音，一段齿轮状态正常，另一段存在局部缺陷。时域波形难以区分，正常状态的幅值甚至略大。

![齿轮对时域录音对比](/images/cepstrum-analysis/gear-time-signals.png)

*有缺陷（上，橙）与无缺陷（下，蓝）的时域录音几乎无法区分（图源：Simcenter Testing Knowledge Base）*

转换到频域后谱峰依然密集：啮合频率的谐波与阀门、电机及车间背景噪声的谱峰混在一起，难以直接辨认那族"每隔 48 Hz 一个"的峰。

![频谱对比](/images/cepstrum-analysis/gear-spectrum.png)

*频域同样难以判读：谐波被其他设备与背景噪声掩盖（图源：Simcenter Testing Knowledge Base）*

但有一项频率结构特征保持不变：齿轮产生的谐波和边带在频率轴上**等间距**排列，间距即啮合频率（谐波之间）或轴频（边带之间）。倒频谱要解决的，就是把"等间距"这一结构特征从背景噪声中提取出来。

::: info 核心概念
- **倒频谱（Cepstrum）**：对时域信号先做 FFT 取幅值、取对数、再做逆 FFT 得到的函数，俗称"谱的谱"
- **倒频率（Quefrency）**：倒频谱的横轴，单位是秒但**不是时间**——相位在取对数时已经丢弃；峰的位置等于频域结构间距的倒数
- **边带（Sideband）**：载波频率 $F_c \pm F_m$ 两侧的峰族，旋转机械中通常由缺陷对幅值的调制引起
- **Rahmonic**：倒频谱峰自身的"谐波"，出现在 $2q, 3q\ldots$ 处，多数是算法产物
:::

## 二、从定义推起：为什么"谱的谱"能折叠谐波族

### 第一步：缺陷调幅，制造边带

局部缺陷（点蚀、剥落）每经过一次啮合即产生一次冲击，啮合振动的幅值随之周期起伏。数学上这是标准调幅：载波 $f_c$（啮合频率的谐波，单位 Hz）、调制频率 $f_m$（轴频，单位 Hz），信号写成

$$x(t) = \left[1 + m\cos(2\pi f_m t)\right]\cos(2\pi f_c t)$$

其中 $m$ 为调制深度（无量纲，$0<m<1$），反映缺陷程度。用积化和差展开乘积项：

$$m\cos(2\pi f_m t)\cos(2\pi f_c t) = \frac{m}{2}\cos\left(2\pi (f_c+f_m) t\right) + \frac{m}{2}\cos\left(2\pi (f_c-f_m) t\right)$$

结论：调幅不在 $f_m$ 处新增谱线，而是将载波分解为三根谱线——$f_c$ 与 $f_c \pm f_m$；$m$ 越大（缺陷越重），边带越高。频谱上每个啮合谐波两侧均出现以轴频为间距的边带族。

![调幅产生边带](/images/cepstrum-analysis/modulation.png)

*无调制（上）与被调制的载波（下）：调制让频谱长出边带族（图源：Simcenter Testing Knowledge Base）*

### 第二步：对数把"乘"变"加"

实测谱并非纯源谱：结构传递路径对源做了一次滤波，时域卷积 $x(t)=s(t)*h(t)$ 对应频域相乘 $X(f)=S(f)\cdot H(f)$。取对数：

$$\log|X(f)| = \log|S(f)| + \log|H(f)|$$

乘法化为加法后，源与路径**线性叠加**在 $\log|X|$ 上。这是倒频谱能够分离源与传递路径的关键：齿轮源 $S(f)$ 呈频域梳齿（周期性强），路径 $H(f)$ 为缓变的共振包络（平滑）。取对数同时压缩动态范围——啮合谐波幅值按 $1/h$ 衰减，线性尺度下六次谐波比基波低约 16 dB、易被噪底掩盖，取对数后各谐波纹波的贡献被拉到可比的水平，周期结构得以显现。

### 第三步：频域周期 → 倒频域单峰

关键对偶：时域周期 $T$ 的信号，频谱是间距 $1/T$ 的离散谱线（傅里叶级数）。把同样的逻辑用在频率轴上——$\log|X(f)|$ 若以 $\Delta f$ 为周期起伏（梳齿间距），它即可展开为以 $n/\Delta f$ 为变量的傅里叶级数，而逆 FFT 正是计算这组系数的运算。于是：

$$c(q) = \left|\,\text{IFFT}\big[\log|\text{FFT}(x)|\,\big]\right|$$

峰值出现在 $q = 1/\Delta f$ 处。间距 48 Hz 的谐波梳齿折叠为 20.8 ms 处的一根峰；间距 4 Hz 的边带族折叠为 250 ms 处的一根峰。构成梳齿的谱线越多、间距越一致，峰越高——峰高是该族谐波总强度的直接度量，也是健康/故障判别的依据。

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
倒频谱横轴量纲是秒，但它不是时域。取对数时相位已经丢弃，逆变换回不去原信号；峰位置只应读作"频域间距的倒数"（$f = 1/q$）。将 20.8 ms 解释为"每 20.8 ms 冲击一次"在该例中恰与冲击周期一致，但将 rahmonic 的 41.7 ms 作同样解释则不成立——那是算法在峰的整数倍位置生成的假峰。
:::

## 三、numpy 复现：两根峰读出啮合频率与轴频

仿真一组齿轮箱信号：6 阶啮合谐波（幅值 $1/h$），故障工况下谐波被轴频 4 Hz 调幅（边带族），叠加高斯噪声。按工程流程分帧、加汉宁窗、自功率谱（Autopower）能量平均后取 $\log_{10}$ 再 IFFT。

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

关键看两个数值：故障使 20.8 ms（$1/f_{mesh}$）峰约翻倍——调幅将边带能量叠加到每个谐波附近，梳齿加密增强；250 ms（$1/f_{shaft}$）峰增至约 2.5 倍——该峰为边带族特有，健康齿轮数据中不存在。知识库的实测案例里，缺陷数据的倒频谱峰同样显著高于正常数据，倒频率 0.02083 s，取倒数正好是 48 Hz 啮合频率。

![实测倒频谱](/images/cepstrum-analysis/gear-cepstrum.png)

*同一对齿轮的倒频谱：缺陷（橙）在 20.8 ms 处的峰明显高于正常（蓝）（图源：Simcenter Testing Knowledge Base）*

![倒频率峰读数](/images/cepstrum-analysis/quefrency-peak.png)

*q = 0.02083 s，1/q = 48 Hz，正对啮合频率（图源：Simcenter Testing Knowledge Base）*

## 四、Testlab 实操：三步计算倒频谱

倒频谱在 Testlab 里没有现成的直接计算入口，需通过 Throughput Processing 和 Data Calculator 两个工具依次完成：

1. **时域到频域**：Signature Throughput Processing 插件（36 tokens）。Function 选 **Autopowers Linear**（取幅值，正是倒频谱要的输入），窗用 Hanning 防泄漏，平均次数给足。
2. **取对数**：Data Calculator 里新建公式，选 LOG10 函数，作用于谱数据（如 F1），输出记为 log。
3. **逆变换**：再建一条公式选 FFT_INVERSE，作用于上一步的 log 结果。

算出来的数据在 Navigator 里以 "AutoCorrelation" 类型出现——该类型即倒频谱。拖入 Front/Back 显示后需注意两点：X 轴下限设为零（IFFT 输出是双边谱，负半边是镜像）；Y 轴需放大，峰集中在零点附近，不放大难以分辨。

![Testlab 三步流程](/images/cepstrum-analysis/testlab-steps.png)

*倒频谱计算步骤（上）与所需软件模块（下）（图源：Simcenter Testing Knowledge Base）*

许可方面有一个限制：Data Calculator 需要 Desktop Standard 与 Advanced 档许可，仅有 Desktop Standard 时无法完成该步骤（Advanced Desktop 下 Data Calculator 不额外消耗 token）。另外截至 2406 版本，Testlab Neo 尚不支持倒频谱处理，需返回 Classic 界面。

## 五、三类常见误用

### 误用一：平均次数不足，真峰被对数域噪底淹没

$\log$ 是非线性运算，单帧谱的噪底在 log 域起伏剧烈，倒频谱上表现为一片随机毛刺，将真实峰掩盖。同一组数据，单帧与 64 帧能量平均的对比：

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

信噪比相差约 4 倍。这也是知识库建议**选用可用范围内最粗频率分辨率**的原因：总记录长度一定时，粗分辨率意味着短帧、多帧数、更多次平均——log 域噪底方差随帧数增加而降低。若将分辨率设至 0.5 Hz、1 Hz 这一量级，帧变长、帧数骤减，噪底反而无法压低。

频率分辨率还有第二重方向相反的约束：$\Delta f$（单位 Hz）决定**最大可分辨倒频率**

$$q_{max} = \frac{1}{\Delta f}$$

要检测间距 4 Hz 的边带族（250 ms 峰），谱必须能表示 250 ms 的倒频率，即 $\Delta f$ 不得超过 4 Hz；8 Hz 分辨率下 q 轴上限仅 125 ms，250 ms 峰超出可表示范围。两个约束合并，分辨率的选择窗口是：**不大于边带间距的 1/2，同时取可用范围内最粗**。

### 误用二：转速波动使频域梳齿失稳

倒频谱的前提是梳齿在频率轴上位置稳定。转速即使缓慢漂移，谐波峰也会在谱上滑动并展宽，等间距结构被破坏，倒频谱随之失效。处理办法是转入阶次域：用转速信号把时域数据重采样到转角域（同步采样），再走同样的 FFT→log→IFFT 流程。数学结构完全同构，只是 $1/f$ 换成 $1/o$（阶次的倒数）；阶次与齿数、减速比直接对应，多级齿轮箱的倒频谱峰可对应到具体齿轮副。Simcenter Anovis 的下线检测（EOL）即以倒频谱峰设置合格限。

### 误用三：把 rahmonic 假峰当成故障频率

倒频谱峰自身会在 $2q, 3q$ 处生成 rahmonic。案例里 20.83 ms 的峰在两倍位置有伴峰，按 $f = 1/q$ 反算得 24 Hz——该机器内不存在 24 Hz 的部件。判读前先做除法核验：$2 \times 24 = 48$，与主峰频率呈两倍关系，确认是 rahmonic，应予忽略。

::: tip 判读清单
- 峰在 $1/f_{mesh}$：啮合谐波族强度，做趋势监测——峰逐月抬高说明齿面磨损在发展
- 峰在 $1/f_{shaft}$：该轴上存在局部缺陷（调幅边带的特征），轴承内圈、外圈故障同理会给出各自间距的边带族
- 峰的倍数位置：先按 rahmonic 处理，不应直接下结论
- 边带间距对应调制机理而非物理部件：旋转机械手册指出，62 齿偏心齿轮每转 2 次的调制在 60、64 阶产生边带，而系统中并不存在 60 齿或 64 齿的齿轮——判读应回到调制源（偏心、局部缺陷、不对中），而非按间距寻找部件
- 转速不稳的工况：一律转阶次域再算
:::

## 六、方法边界与选择

| 数据特征 | 是否适用倒频谱 | 替代/补充手段 |
| --- | --- | --- |
| **稳速齿轮箱，谱峰密集分不清归属** | 首选，两根峰定位谐波族与边带族 | 谐波游标（Harmonic Cursor）辅助确认 |
| **变转速工况** | 频率域不可用，先同步采样转阶次域 | 阶次切片与倒频谱组合 |
| **轴承早期冲击故障** | 可用但非最优工具 | 希尔伯特包络解调更直接 |
| **单根离散音（电机电磁噪声）** | 没有梳齿结构，无峰可看 | 窄带谱与音源识别 |
| **下线检测要设合格限** | 峰位置绑定齿轮副，适合设限报警 | Simcenter Anovis 内置该流程 |

倒频谱的分析对象不是信号本身，而是频域结构中的周期性。齿轮与轴承的故障签名均表现为频域梳齿，因此这一 1963 年为语音基音分析提出的方法在旋转机械诊断中长期适用。使用时需满足三项前提：谱峰位置稳定（稳速或已转阶次域）、足够的平均次数、以及分辨率选择同时覆盖目标倒频率的上限约束。在此前提下，**峰的位置给出间距，峰的高度给出该族结构的强度，峰高的趋势指示故障发展方向**。
