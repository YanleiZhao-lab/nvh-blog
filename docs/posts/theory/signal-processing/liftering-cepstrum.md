---
title: "倒频谱进阶：基于 liftering 的回波分离与消除方法"
---

# 倒频谱进阶：基于 liftering 的回波分离与消除方法

> 前一篇倒频谱文章回答"谱上哪一族峰来自齿轮"——属于检测问题。工程中还有一类反向需求：已知回波或传递路径污染了测量数据，需要将其从数据中分离并去除后再做后续分析。对数运算把"源乘路径"转换为"源加路径"之后，两项在倒频域内位于不同区段，将回波区段置零再逆变换回时域，即可去除回波——这一操作称为倒滤波（Liftering）。本文从复倒频谱的级数展开推导回波峰的位置与幅值公式，用 numpy 完整演示回波消除流程，并给出 Simcenter Testlab Data Calculator 中可落地的实现路径。
>
> 前置阅读：[倒频谱：齿轮箱边带与谐波族的检测方法](./cepstrum-analysis.html)

## 一、工程问题：测量信号是"源与路径的卷积"

试验室里敲击结构，力锤脉冲传到加速度计之前，先在台面反射一次、再在夹具反射一次——传感器收到的是一串延迟衰减的副本。声学测试更为典型：消声室吸声不完全，墙面反射使传声器录到直达声与回波的叠加。数学上写成：

$$x(t) = s(t) + a \cdot s(t-\tau)$$

$\tau$（单位：s）是反射路径的额外声程（或电程）延迟，$a$（无量纲）是反射系数。这个模型同样覆盖"传递路径"场景：齿轮箱体的频率响应相当于对啮合冲击串施加回声叠加。

回波的麻烦在频域。对上式做傅里叶变换，延迟变成相位因子：

$$X(f) = S(f)\left(1 + a\,e^{-j2\pi f\tau}\right)$$

**乘法结构**——源 $S$ 与路径项 $\left(1+a e^{-j2\pi f\tau}\right)$ 在频域耦合。$\left|1+a e^{-j2\pi f\tau}\right|$ 随频率以 $1/\tau$（单位：Hz）为周期起伏，谱上表现为叠加在源谱上的周期纹波：反射路径每增加半个波长，纹波完成一个周期。若要在频域直接滤除，需要已知 $a$ 与 $\tau$ 并完成一次复数除法——而这两个参数往往正是待求的未知量。

::: info 核心概念
- **倒滤波（Liftering）**：在倒频域对倒频谱做滤波（置零/加权），再逆变换回频域或时域；lifter 一词由 filter 颠倒拼写而来，和 quefrency、cepstrum 同一家族
- **复倒频谱（Complex Cepstrum）**：$\hat{x}(t) = \text{IFFT}\left[\log X(f)\right]$，对复数谱取对数（幅值和相位都进 log），因此**可逆**
- **实倒频谱（Real Cepstrum）**：对 $|X(f)|$ 取对数再逆变换——上一篇用的就是它，相位丢弃，不可逆
- **短通/长通倒滤波（Short-pass / Long-pass Liftering）**：倒频域的低通/高通——保留低倒频段等于保留频域缓变包络（传递路径），保留高倒频段等于保留频域细周期结构（谐波族、回波峰）
:::

## 二、推导：回波在倒频域长成什么样

### 第一步：对数把乘法拆成加法

对 $X(f)$ 取复对数：

$$\log X(f) = \log S(f) + \log\left(1 + a\,e^{-j2\pi f\tau}\right)$$

第一项是源的贡献，第二项是回波的贡献，两者**线性叠加**。接下来只看第二项——它是频率的周期函数（周期 $1/\tau$），逆变换后折叠为离散峰，这正是倒频谱对周期结构的压缩效应。

### 第二步：级数展开，峰位与峰高

$|a|<1$（反射存在损耗）时，$\log(1+z)$ 在 $|z|<1$ 处收敛的幂级数为：

$$\log(1+z) = \sum_{k=1}^{\infty} \frac{(-1)^{k+1}}{k} z^k$$

代入 $z = a\,e^{-j2\pi f\tau}$：

$$\log\left(1+a\,e^{-j2\pi f\tau}\right) = \sum_{k=1}^{\infty} \frac{(-1)^{k+1} a^k}{k}\, e^{-j2\pi f k\tau}$$

每一项都是 $e^{-j2\pi f k\tau}$——频率轴上周期为 $1/(k\tau)$ 的复指数。逆傅里叶变换把它们分别映射到 $t = k\tau$ 的位置（IFFT 对 $e^{-j2\pi f k\tau}$ 给出 $t=k\tau$ 处的冲激）。于是复倒频谱在回波作用下成为一串**等间距脉冲**：

$$\hat{x}(k\tau) = \frac{(-1)^{k+1} a^k}{k}, \quad k = 1, 2, 3, \ldots$$

三个直接可用的结论：

| 读数 | 公式 | 工程含义 |
| --- | --- | --- |
| **峰间距** | $\tau$（s） | 反射路径延迟，乘声速/波速得路径长度差（m） |
| **首峰幅值** | $a$（无量纲） | 反射系数，量化回波强度 |
| **峰高衰减** | $a^k/k$，符号交替 | 二次回波（回波的回波）快速减弱 |

$a=0.6$ 时理论序列：$+0.6$、$-0.18$、$+0.072$——首峰之后幅值快速衰减，检测时以首峰为准即可。

### 第三步：回波消除为何必须用复倒频谱

实倒频谱丢弃相位，$\log|X|$ 中的回波项变为 $\log\left|1+a e^{-j2\pi f\tau}\right|$，级数展开的系数不再是标准的 $a^k/k$，峰之间还会发生**符号抵消**（第四节演示中可见 k=2 峰被抵消到接近零的实例）。更重要的是不可逆：丢弃的相位无法恢复，逆变换只能回到 $|X|$ 的包络，无法回到时域波形。

复倒频谱全链路保留信息：$\log X = \log|X| + j\arg X$，幅值和相位分居实虚部。逆运算是 $\exp$ 顶着正变换回去：

$$x(t) = \text{IFFT}\left[\exp\left(\text{FFT}\left[\hat{x}(t)\right]\right)\right]$$

对 $\hat{x}$ 先做编辑（liftering）再沿这条逆路径变换，即可输出一个"编辑过"的时域信号——这就是同态信号处理（Homomorphic Processing）的完整闭环：卷积域到加法域，线性滤波，再回到卷积域。

::: warning 相位解卷绕的常见错误
$\arg X$ 只在 $(-\pi, \pi]$ 内取值，直接使用会处处出现 $2\pi$ 跳变，必须先解卷绕（unwrapping）。实信号的频谱共轭对称，若沿全频率轴解卷绕，会在正负频率交界处破坏相位的反对称性，引入半个 $2\pi$ 的模糊——逆变换回来的波形**整体反号**。正确做法：只对正频率半轴解卷绕，负半轴按反对称构造。本文演示代码即按此实现。
:::

## 三、numpy 全流程：回波检测与消除

仿真一个典型场景：结构脉冲响应（300 Hz 单模态、阻尼比 10%）叠加 30 ms 后反射系数 0.6 的回波。复倒频谱检测，倒频域开槽，逆变换重建：

```python
import numpy as np

fs, N = 8192, 8192
t = np.arange(N)/fs
fr, zeta = 300.0, 0.10                    # 结构脉冲响应：300 Hz、阻尼比 10%
sig = fr*zeta/np.sqrt(1-zeta**2)
s = np.exp(-2*np.pi*fr*zeta*t)*np.sin(2*np.pi*sig*t)
n0, a = 246, 0.6                          # 回波延迟 246 样本、反射系数 0.6
echo = np.concatenate([np.zeros(n0), a*s[:N-n0]])
x = s + echo                              # 测到 = 源 + 延迟衰减副本

def cceps(u):                             # 复倒频谱（保留相位）
    U = np.fft.fft(u)
    P = np.unwrap(np.angle(U[:N//2+1]))   # 只解正半轴卷绕
    ph = np.concatenate([P, -P[-2:0:-1]]) # 负半轴反对称构造
    return np.real(np.fft.ifft(np.log(np.abs(U)+1e-12) + 1j*ph))

c = cceps(x)
print("复倒频谱回波峰:")
for k in (1, 2, 3):
    print(f"  q={k*n0/fs*1000:5.1f} ms: {c[k*n0]:+.3f}   (理论 {(-1)**(k+1)*a**k/k:+.3f})")

notch = np.zeros(N, bool)                 # liftering：在 k*tau 处开槽
for k in range(-5, 6):
    if k != 0:
        notch |= np.abs(np.arange(N) - k*n0) <= 1
cl = c.copy(); cl[notch] = 0.0
x_rec = np.real(np.fft.ifft(np.exp(np.fft.fft(cl))))   # 逆变换回时域
r = lambda u, v: np.corrcoef(u, v)[0, 1]
print(f"\n回波残留  corr(x, echo)       = {r(x, echo):+.3f}")
print(f"liftering 后 corr(x_rec, echo) = {r(x_rec, echo):+.3f}")
```

实测输出：

```
复倒频谱回波峰:
  q= 30.0 ms: +0.596   (理论 +0.600)
  q= 60.1 ms: -0.182   (理论 -0.180)
  q= 90.1 ms: +0.071   (理论 +0.072)

回波残留  corr(x, echo)       = +0.508
liftering 后 corr(x_rec, echo) = -0.014
```

三个数值值得注意：倒频谱峰 $+0.596$、$-0.182$、$+0.071$ 与级数推导的 $+0.6$、$-0.18$、$+0.072$ 一致——**首峰幅值直接给出反射系数**，峰位取倒数即得延迟。liftering 后重建信号与回波的相关系数从 +0.508 降至 -0.014，回波基本消除，源波形完整保留（相位信息未丢失，幅值保真）。

## 四、实倒频谱与功率倒频谱：适用于检测，不适用于重建

工程现场多数情况下只做检测不做重建——废弃数据前先确认回波位置与强度。此时无需处理相位，用 Testlab 常规链路（Autopower、LOG10、FFT_INVERSE）得到的实倒频谱即可满足需求，但要清楚它与理论值的偏差：

```python
import numpy as np

fs, N = 8192, 8192
t = np.arange(N)/fs
fr, zeta = 300.0, 0.10
sig = fr*zeta/np.sqrt(1-zeta**2)
s = np.exp(-2*np.pi*fr*zeta*t)*np.sin(2*np.pi*sig*t)
n0, a = 246, 0.6
x = s + np.concatenate([np.zeros(n0), a*s[:N-n0]])

X2 = np.abs(np.fft.rfft(x))**2          # 功率谱（Testlab Autopower 同类）
c_real = np.fft.irfft(np.log10(X2))     # 实倒频谱（丢相位）
c_pow  = c_real**2                      # 功率倒频谱
for k in (1, 2, 3):
    print(f"k={k}: 实倒频谱 {c_real[k*n0]:+.4f}  功率倒频谱 {c_pow[k*n0]:.5f}")
```

```
k=1: 实倒频谱 +0.2606  功率倒频谱 0.06791
k=2: 实倒频谱 -0.0782  功率倒频谱 0.00611
k=3: 实倒频谱 +0.0313  功率倒频谱 0.00098
```

实倒频谱首峰 $0.2606 = 0.6/\ln 10$——**对数底数只改变刻度，不改变峰位**，Testlab 里选 LOG10 还是 LN 不影响判读，只影响与理论公式对表时相差一个 $\ln 10$ 因子（LOG10 结果乘以 $\ln 10 \approx 2.303$ 即回到自然对数刻度）。更值得注意的是符号：k=2 峰是 $-0.078$，为负值。如果趋势监测只关注"峰高"而取错符号，二次回波峰会被当作噪声略过。功率倒频谱取平方规避了符号问题（$0.0679 = 0.2606^2$），代价是动态范围被进一步压缩，弱峰更矮。

| 变体 | 定义 | 可逆 | 峰符号 | 典型用途 |
| --- | --- | --- | --- | --- |
| **复倒频谱** | IFFT[$\log X$]，含相位 | 可逆（exp 逆变换） | $(-1)^{k+1}$ 交替 | 回波消除、源-路径分离重建 |
| **实倒频谱** | IFFT[$\log\|X\|$] | 不可逆 | 交替，可能有抵消 | 峰位检测、趋势监测 |
| **功率倒频谱** | 实倒频谱的平方 | 不可逆 | 恒正 | 自动找峰、设报警限 |

## 五、Testlab 实现：可做与不可做的

Simcenter Testlab 没有倒频谱的一键功能，Data Calculator 公式串是官方实现路径。核心三步（上一篇详细走过，这里只列关键参数）：

1. 时域到频域：Signature Throughput Processing，Function 选 **Autopowers Linear**，Hanning 窗，分辨率选能用的最粗档
2. 取对数：Data Calculator 新建公式，函数选 **LOG10**，作用于谱数据（如 F1）

![LOG10 函数选择](/images/liftering-cepstrum/log10-function.png)

*Data Calculator 的 Select Function 面板里找 LOG10（图源：Simcenter Testing Knowledge Base）*

3. 逆变换：第二条公式选 **FFT_INVERSE**，作用于上一步的 log 输出，Point Id 起个有意义的名字

![IFFT 公式](/images/liftering-cepstrum/ifft-formula.png)

*第二条公式：FFT_INVERSE 作用于 log 结果（图源：Simcenter Testing Knowledge Base）*

![Calculate 执行](/images/liftering-cepstrum/datacalc-calculate.png)

*公式串就绪后点 Calculate，结果出现在 Data Set 列表（图源：Simcenter Testing Knowledge Base）*

输出在 Navigator 里以 **AutoCorrelation** 类型出现——这不是计算错误，IFFT 结果在 Testlab 里即按该类型标识。拖入 Front/Back 显示，X 轴下限设零（双边谱负半轴是镜像），放大 Y 轴——峰在零点附近很尖，不放大难以观察。

![FrontBack 显示](/images/liftering-cepstrum/frontback-display.gif)

*倒频谱拖入 Front/Back 显示：零点尖峰加镜像谱是数学产物，属正常（图源：Simcenter Testing Knowledge Base）*

这条链路产出的是**实/功率倒频谱**，用于检测和趋势监测完全够用。要做本文第三节的 liftering 重建（回波消除），必须保留相位走复倒频谱全链路——Data Calculator 的函数作用于幅值类数据，相位保持这一环在 Classic 界面里没有现成通道，工程上更实际的做法是把时间数据导出，在 Python/MATLAB 里完成"FFT、log（幅值加解卷绕相位）、编辑、exp、IFFT"，再将处理后的信号导回 Testlab 继续后续分析。

::: tip 判断标准
- 只想知道"有没有回波/哪一族谐波在增长"：实倒频谱（Autopower、LOG10、FFT_INVERSE）即可，Testlab 全流程可实现
- 要把回波从数据中去除、或将源与传递路径分离重建：复倒频谱加 liftering，导出到脚本环境完成
- 反射系数定量：复倒频谱首峰幅值直接给出 $a$；实倒频谱（LOG10 底数）乘以 $\ln 10$ 后再对表
:::

## 六、三类常见问题

### 问题一：延迟不是整数个样本时峰被分裂

推导假设 $e^{-j2\pi f k\tau}$ 落在离散频率栅格上。$\tau \cdot f_s$ 不是整数时（例如 $\tau = 31.3$ ms、$f_s = 8192$ Hz，$\tau f_s = 256.4$），倒频谱峰的能量分配给相邻两个 bin，单 bin 读数偏低、自动找峰可能出错。处理办法：读峰时取理论位置附近 1 个 bin 邻域内的最大值；帧长尽量取 2 的幂并让关注的 $\tau$ 接近整数 bin；对回波定位精度要求高时，先粗读峰位再局部细化。

### 问题二：全轴解卷绕导致波形反号

第二节 warning 所述的半个 $2\pi$ 模糊：实信号频谱共轭对称，$\arg X$ 天然反对称。沿全频率轴 unwrap 时，正负频率交界处的跳变处理会破坏反对称性，相位整体偏移 $\pi$，逆变换回来的信号反号。对纯检测无影响（只看幅值），对重建是致命的——相关系数算出 -0.99 即源于此。解决方法：只解正半轴卷绕，负半轴按反对称构造。

### 问题三：liftering 的适用条件

倒频域开槽去除回波峰，前提是回波峰与源信息在倒频轴上**可分离**：回波峰在 $k\tau$（毫秒级），源的缓变包络集中在低倒频段，谐波族峰在谐波间距的倒数处（微秒到毫秒级）。两者靠近（例如反射延迟与谐波间距倒数接近）时开槽会误伤源信息，逆变换后波形畸变。开槽前先把倒频谱全貌绘出，确认要去除的峰不与要保留的峰重叠；槽宽取峰宽的 1~2 倍即可，宁窄勿宽。

## 七、小结

回波消除的判断流程：谱上出现周期纹波，怀疑存在反射，用实倒频谱确认峰位（$\tau$ 读路径长度），需要干净数据时采用复倒频谱 liftering（首峰幅值即反射系数 $a$，符号交替按 $a^k/k$ 衰减）。检测在 Testlab 里三步公式即可完成；重建需保留相位，在脚本环境中实现更可靠。齿轮箱边带诊断（上一篇）与本文的回波消除，构成倒频谱分析的两类主要应用：前者读峰定位故障源，后者去除回波峰还原数据。
