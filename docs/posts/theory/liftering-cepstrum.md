---
title: "倒频谱再深一层：用 liftering 把回波从信号里削掉"
---

# 倒频谱再深一层：用 liftering 把回波从信号里削掉

> 前一篇倒频谱文章回答"谱上哪族峰是齿轮的"——检测。工程里还有一类反向需求：知道回波/传递路径把测量污染了，想把它**从数据里拿掉**再往下分析。对数把"源乘路径"变成"源加路径"之后，倒频域里两者落在不同区段，开槽置零再逆变换回去，回波就没了——这套操作叫倒滤波（Liftering）。这篇从复倒频谱的级数展开推出回波峰的位置和幅值公式，用 numpy 完整走一遍"回波消除"，并给出 Testlab Data Calculator 里能落地的那部分路径。
>
> 前置阅读：[倒频谱：齿轮箱边带与谐波族的检测方法](./cepstrum-analysis.html)

## 一、工程问题：测到的信号是"源卷上路径"

试验室里敲一下结构，力锤脉冲传到加速度计之前，先在台面反射一次、再在夹具反射一次——传感器收到的是一串延迟衰减的副本。声学测试更典型：消声室不完美，墙面反射让传声器录到直达声加回波。数学上写成：

$$x(t) = s(t) + a \cdot s(t-\tau)$$

$\tau$ 是反射路径的额外声程（或电程）延迟，$a$ 是反射系数。这个模型同样覆盖"传动路径"场景：齿轮箱体的频率响应相当于把啮合冲击串"回声化"。

回波的麻烦在频域。对上式做傅里叶变换，延迟变成相位因子：

$$X(f) = S(f)\left(1 + a\,e^{-j2\pi f\tau}\right)$$

**乘法结构**——源 $S$ 和路径 $\left(1+a e^{-j2\pi f\tau}\right)$ 在频域纠缠。$\left|1+a e^{-j2\pi f\tau}\right|$ 随频率以 $1/\tau$ 为周期起伏，谱上表现为叠在源谱上的周期纹波：反射路径每多半个波长，纹波完成一个周期。想直接在频域滤掉它，需要知道 $a$ 和 $\tau$ 并且做一个复数除法——而这两个参数往往正是未知量。

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

第一项是源的贡献，第二项是回波的贡献，**线性叠加**。接下来只看第二项——它是频率的周期函数（周期 $1/\tau$），逆变换后会塌缩成离散峰，这正是倒频谱的折叠效应。

### 第二步：级数展开，峰位峰高一次到位

$|a|<1$（反射总有损耗）时，$\log(1+z)$ 在 $|z|<1$ 收敛的幂级数是：

$$\log(1+z) = \sum_{k=1}^{\infty} \frac{(-1)^{k+1}}{k} z^k$$

代入 $z = a\,e^{-j2\pi f\tau}$：

$$\log\left(1+a\,e^{-j2\pi f\tau}\right) = \sum_{k=1}^{\infty} \frac{(-1)^{k+1} a^k}{k}\, e^{-j2\pi f k\tau}$$

每一项都是 $e^{-j2\pi f k\tau}$——频率轴上周期为 $1/(k\tau)$ 的复指数。逆傅里叶变换把它们分别送回 $t = k\tau$ 的位置（IFFT 对 $e^{-j2\pi f k\tau}$ 给出 $t=k\tau$ 处的冲激）。于是复倒频谱在回波作用下变成一串**等间距脉冲**：

$$\hat{x}(k\tau) = \frac{(-1)^{k+1} a^k}{k}, \quad k = 1, 2, 3, \ldots$$

三个直接可用的结论：

| 读数 | 公式 | 工程含义 |
| --- | --- | --- |
| **峰间距** | $\tau$ | 反射路径延迟，乘声速/波速得路径长度差 |
| **首峰幅值** | $a$ | 反射系数，量化回声强度 |
| **峰高衰减** | $a^k/k$，符号交替 | 二次回波（回波的回波）快速减弱 |

$a=0.6$ 时理论序列：$+0.6$、$-0.18$、$+0.072$——首峰之后断崖式下跌，检测时认准首峰即可。

### 第三步：为什么必须用复倒频谱

实倒频谱丢相位，$\log|X|$ 里的回波项变成 $\log\left|1+a e^{-j2\pi f\tau}\right|$，级数展开的系数不再是干净的 $a^k/k$，峰之间还会发生**符号抵消**（下一节演示里会看到 k=2 峰被抵消到接近零的实例）。更致命的是不可逆：丢掉的相位找不回来，逆变换只能回到 $|X|$ 的包络，回不到时域波形。

复倒频谱全链路保留信息：$\log X = \log|X| + j\arg X$，幅值和相位分居实虚部。逆运算是 $\exp$ 顶着正变换回去：

$$x(t) = \text{IFFT}\left[\exp\left(\text{FFT}\left[\hat{x}(t)\right]\right)\right]$$

对 $\hat{x}$ 先动刀（liftering）再走这条逆路径，就能输出一个"编辑过"的时域信号——这就是同态信号处理（Homomorphic Processing）的完整闭环：卷积态到加法态，线性滤波，再回卷积态。

::: warning 相位解卷绕的暗坑
$\arg X$ 只在 $(-\pi, \pi]$ 内取值，直接用会处处跳变 $2\pi$，必须解卷绕（unwrapping）。实信号的频谱共轭对称，若沿全频率轴解卷绕，会在正负频率交界处破坏相位的反对称性，引入半个 $2\pi$ 的模糊——逆变换回来的波形**整体反号**。正确做法：只对正频率半轴解卷绕，负半轴按反对称手工构造。本文演示代码就是这么写的。
:::

## 三、numpy 全流程：检测回波、削掉回波

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

三个数值得看：倒频谱峰 $+0.596$、$-0.182$、$+0.071$ 与级数推导的 $+0.6$、$-0.18$、$+0.072$ 对上了——**首峰直接读出反射系数**，峰位倒数一除就是延迟。liftering 后重建信号与回波的相关性从 +0.508 掉到 -0.014，回波基本干净，源波形完整保留（相位信息没丢，幅值也保真）。

## 四、实倒频谱与功率倒频谱：检测够用，重建不行

工程现场多数时候只做检测不做重建——报废数据前先确认回波在哪、有多强。这时不必伺候相位，用 Testlab 常规链路（Autopower、LOG10、FFT_INVERSE）得到的实倒频谱就够，但要清楚它和理论的偏差：

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

实倒频谱首峰 $0.2606 = 0.6/\ln 10$——**对数底数只改刻度不改峰位**，Testlab 里选 LOG10 还是 LN 不影响判读，只影响和理论公式对表时差一个 $\ln 10$ 因子。更值得注意的是符号：k=2 峰是 $-0.078$，负的。如果趋势监测只盯"峰高"而取错符号，二次回波峰会被当成噪声略过。功率倒频谱取平方规避了符号问题（$0.0679 = 0.2606^2$），代价是动态范围再压一次，弱峰更矮。

| 变体 | 定义 | 可逆 | 峰符号 | 典型用途 |
| --- | --- | --- | --- | --- |
| **复倒频谱** | IFFT[$\log X$]，含相位 | 可逆（exp 逆变换） | $(-1)^{k+1}$ 交替 | 回波消除、源-路径分离重建 |
| **实倒频谱** | IFFT[$\log\|X\|$] | 不可逆 | 交替，可能有抵消 | 峰位检测、趋势监测 |
| **功率倒频谱** | 实倒频谱的平方 | 不可逆 | 恒正 | 自动找峰、设报警限 |

## 五、Testlab 落地：能做的与做不了的

Simcenter Testlab 没有倒频谱一键按钮，Data Calculator 公式串是官方路径。核心三步（上一篇详细走过，这里只列关键参数）：

1. 时域到频域：Signature Throughput Processing，Function 选 **Autopowers Linear**，Hanning 窗，分辨率选能用的最粗档
2. 取对数：Data Calculator 新建公式，函数选 **LOG10**，作用于谱数据（如 F1）

![LOG10 函数选择](/images/liftering-cepstrum/log10-function.png)

*Data Calculator 的 Select Function 面板里找 LOG10（图源：Simcenter Testing Knowledge Base）*

3. 逆变换：第二条公式选 **FFT_INVERSE**，作用于上一步的 log 输出，Point Id 起个有意义的名字

![IFFT 公式](/images/liftering-cepstrum/ifft-formula.png)

*第二条公式：FFT_INVERSE 作用于 log 结果（图源：Simcenter Testing Knowledge Base）*

![Calculate 执行](/images/liftering-cepstrum/datacalc-calculate.png)

*公式串就绪后点 Calculate，结果出现在 Data Set 列表（图源：Simcenter Testing Knowledge Base）*

输出在 Navigator 里以 **AutoCorrelation** 类型出现——这不是算错了，IFFT 在 Testlab 里就按这个类型挂牌。拖进 Front/Back 显示，X 轴下限设零（双边谱负半边是镜像），Y 轴放大——峰在零点附近很尖，不放大看不见。

![FrontBack 显示](/images/liftering-cepstrum/frontback-display.gif)

*倒频谱拖入 Front/Back 显示：零点尖峰加镜像谱是数学产物，属正常（图源：Simcenter Testing Knowledge Base）*

这条链路产出的是**实/功率倒频谱**，用于检测和趋势监测完全够。要做本文第三节的 liftering 重建（回波消除），必须保相位走复倒频谱全链路——Data Calculator 的函数作用于幅值类数据，相位保持这一环在 Classic 界面里没有现成通道，工程上更实际的做法是把时间数据导出，在 Python/MATLAB 里完成"FFT、log（幅值加解卷绕相位）、编辑、exp、IFFT"，再把干净信号导回 Testlab 继续后续分析。

::: tip 判断标准
- 只想知道"有没有回波/哪族谐波在涨"：实倒频谱（Autopower、LOG10、FFT_INVERSE）就够，Testlab 全流程可做
- 要把回波从数据里拿掉、或把源和传递路径分开重建：复倒频谱加 liftering，导出到脚本环境做
- 反射系数定量：复倒频谱首峰幅值直接给 $a$；实倒频谱记得乘回 $\ln 10$
:::

## 六、三个坑

### 坑一：延迟不是整数个样本，峰就劈叉

推导假设 $e^{-j2\pi f k\tau}$ 落在离散频率栅格上。$\tau \cdot f_s$ 不是整数时（比如 $\tau = 31.3$ ms、$f_s = 8192$，$\tau f_s = 256.4$），倒频谱峰的能量分给相邻两个 bin，单 bin 读数偏低、自动找峰可能找错。处理办法：读峰时取理论位置附近 1 个 bin 邻域内的最大值；帧长尽量取 2 的幂并让关注的 $\tau$ 接近整数 bin；对回波定位精度要求高时，先粗读峰位再局部细化。

### 坑二：全轴解卷绕把波形弄反

前面 warning 说过的半个 $2\pi$ 模糊：实信号频谱共轭对称，$\arg X$ 天然反对称。沿全频率轴 unwrap 时，正负频率交界处的跳变处理会让反对称性破掉，相位整体偏 $\pi$，逆变换回来的信号反号。对纯检测无影响（只看幅值），对重建是致命的——相关性算出来 -0.99 就是这个坑。解法就一句：只解正半轴，负半轴反对称构造。

### 坑三：把 liftering 当万能滤波器

倒频域开槽削回波峰，前提是回波峰和源信息在倒频轴上**分得开**：回波峰在 $k\tau$（毫秒级），源的缓变包络集中在低倒频段，谐波族峰在谐波间距的倒数处（微秒到毫秒级）。两者靠得近（比如反射延迟与谐波间距倒数接近）时开槽会误伤源信息，逆变换后波形畸变。开槽前先把倒频谱全貌画出来，确认要削的峰不和要保的峰重叠；槽宽取峰宽的 1~2 倍即可，宁窄勿宽。

## 七、小结

回波消除这条线，判断次序是：谱上看到周期纹波，怀疑反射，实倒频谱确认峰位（$\tau$ 读路径长度），需要干净数据就上复倒频谱 liftering（首峰幅值即反射系数 $a$，符号交替衰减 $a^k/k$）。检测在 Testlab 里三步公式搞定；重建保相位，脚本环境做更稳。齿轮箱边带诊断（上一篇）加上这篇的回波消除，倒频谱家族的两类主战场就齐了：前者读峰找故障源，后者削峰还原数据。
