---
title: "FFT窗函数选择"
---

# FFT窗函数选择

> 快速傅里叶变换（Fast Fourier Transform, FFT）是 NVH 频域分析的基础，但有限长采样会引入频谱泄漏（spectral leakage）。选择合适的窗函数可以抑制泄漏，但也以频率分辨力和幅值精度为代价。本文从泄漏成因出发，给出常用窗函数的特性指标、校正因子与选择判据。

## 一、为什么需要窗函数

离散傅里叶变换（DFT）假设采样窗内的数据代表了信号在所有时刻的取值，等价于将采样窗内的信号周期化。若正弦信号在采样时间 $T$ 内不是整周期截断，周期化拼接处会出现幅值跳变，能量从真实频率分散到整个分析带宽，这就是**频谱泄漏**。

泄漏是数字信号处理中最难处理的问题之一：混叠误差可以通过抗混叠滤波消除，而泄漏误差只能减小、无法完全消除。削减泄漏的途径有三种：

1. 保证采样时间与信号周期同步（整周期截断）；
2. 提高频率分辨率 $\Delta f = 1/T$，减小泄漏影响的谱线范围；
3. 对信号加窗，强制采样窗两端幅值趋近于零，消除拼接处的不连续。

![周期截断（红色）与非周期截断（绿色）正弦波的频谱对比：非周期截断导致能量泄漏到整个分析带宽](/images/fft-window-functions/fig3-leakage-periodic-vs-nonperiodic.png)
*图 1　整周期截断无泄漏，非周期截断产生全带宽泄漏（图源：Simcenter Testing Knowledge Base）*

加窗在时域上是信号与窗函数相乘：

$$
x_w(n) = x(n)\, w(n), \qquad n = 0, 1, \ldots, N-1
$$

时域相乘对应频域卷积，即加窗后的频谱等于原信号频谱与窗函数频谱 $W(f)$ 的卷积：

$$
X_w(f) = X(f) * W(f)
$$

因此窗函数的频域形状直接决定了泄漏的分布——主瓣越窄，频率分辨力越好；旁瓣越低，强信号旁边的弱信号越容易被分辨。

::: info 核心概念
- **主瓣宽度（main lobe width）**：决定频率分辨力，主瓣越窄越好
- **旁瓣衰减（sidelobe level）**：决定强信号旁能否看到弱信号，旁瓣越低越好
- **有效噪声带宽（Effective Noise Bandwidth, ENBW）**：衡量主瓣占用的谱线数，直接影响分辨相近频率的能力
- **最大幅值误差（maximum amplitude error）**：谱线落在主瓣内不同位置时的最坏幅值偏差
:::

需要强调的是：对整周期截断的信号（无泄漏），加窗反而会引入畸变。此时应使用矩形窗（不加窗），任何额外的窗都会把原本单一的一条谱线展宽。

## 二、窗函数的频域特性指标

各窗函数的差异主要体现在主瓣能量与旁瓣能量之比。有效噪声带宽越窄的窗，旁瓣衰减率通常越低——选择性（分辨强分量附近弱分量的能力）与噪声带宽是一对需要折衷的指标。

ENBW 由窗函数的时域序列直接计算：

$$
ENBW = \frac{N \sum_{n=0}^{N-1} w^2(n)}{\left[\sum_{n=0}^{N-1} w(n)\right]^2} \cdot \Delta f
$$

其中 $N$ 为采样点数，$\Delta f = 1/T$ 为频率分辨率。以汉宁窗为例：$\sum w(n) = N/2$，$\sum w^2(n) = 3N/8$，代入得 $ENBW = 1.5\,\Delta f$，即汉宁窗下泄漏集中在主谱线两侧各约 1.5 条谱线范围内。

## 三、常用窗函数对比

下表给出常用窗函数的主要特性（数据取自 LMS Test 测试理论手册表 1.1）：

| 窗类型 | 最高旁瓣 (dB) | 旁瓣衰减 (dB/十个旁瓣) | 有效噪声带宽 ($\times \Delta f$) | 最大幅值误差 (dB) |
| --- | --- | --- | --- | --- |
| 矩形窗 (Uniform) | -13 | -20 | 1.00 | 3.9 |
| 汉宁窗 (Hanning) | -32 | -60 | 1.50 | 1.4 |
| 哈明窗 (Hamming) | -43 | -20 | 1.36 | 1.8 |
| 凯赛窗 (Kaiser-Bessel) | -69 | -20 | 1.80 | 1.0 |
| 布莱克曼窗 (Blackman) | -92 | -20 | 2.00 | 1.1 |
| 平顶窗 (Flattop) | -93 | 0 | 3.43 | <0.01 |

### 3.1 矩形窗（Uniform）

矩形窗即不加窗，不改变能量的时域分布，属于**自窗函数**。当信号天然满足整周期采样或瞬态特性（脉冲、猝发信号在采样窗起止点幅值为零）时，矩形窗优于任何其他窗。若信号不能保证周期性，矩形窗的幅值误差最大可达 36%（3.9 dB），且能量泄漏到整个分析带宽。

### 3.2 汉宁窗（Hanning）

汉宁窗是随机信号通用分析中最常用的窗，其时域表达式为：

$$
w(n) = \frac{1}{2}\left[1 - \cos\left(\frac{2\pi n}{N-1}\right)\right], \qquad n = 0, 1, \ldots, N-1
$$

窗函数起止值为零、中心值为 1，时域上的渐变过渡使乘窗后的信号在采样窗两端平滑归零，从而抑制非周期截断产生的泄漏。

![汉宁窗作用于随机信号：时域两端强制归零（右下），消除 abrupt 截断](/images/fft-window-functions/fig4-hann-on-random.png)
*图 2　汉宁窗（中）作用于随机信号（左上），使时域端点平滑归零（右下），抑制泄漏（图源：Simcenter Testing Knowledge Base）*

![汉宁窗时域形状（左）及其对周期/非周期正弦波的频域影响（右）](/images/fft-window-functions/fig5-hann-shape.png)
*图 3　汉宁窗的时域形状与频域效果：对周期信号反而展宽谱线，对非周期信号显著抑制泄漏（图源：Simcenter Testing Knowledge Base）*

汉宁窗对频率分辨力和幅值精度的影响适中：最大幅值误差 15%（1.4 dB），出现在信号频率正好落在两条谱线正中间时；泄漏范围限于主谱线两侧各 1.5 条谱线。对整周期截断的正弦信号，汉宁窗的幅值误差为零——最大误差 15% 只发生在非周期截断情形。

### 3.3 平顶窗（Flattop）

平顶窗因通带内波纹度极低而得名，用于纯音（单频）信号的精确幅值测量，特别是测量系统标定——Simcenter Testlab 的 AC Calibration 模式固定使用平顶窗，且不允许用户更改。其最大幅值误差小于 0.01%（汉宁窗为 15%），代价是泄漏范围展宽到主谱线两侧各 3.43 条谱线，频率精度变粗。

![汉宁窗与平顶窗对周期（左）、非周期（右）正弦波频谱的差异](/images/fft-window-functions/fig9-hann-vs-flattop.png)
*图 4　汉宁窗与平顶窗的频谱对比：平顶窗幅值精度高，但谱线更宽（图源：Simcenter Testing Knowledge Base）*

![相距 4 Hz 的两个周期截断音：汉宁窗（绿）分出两个峰，平顶窗（蓝）只显示一个峰](/images/fft-window-functions/fig11-hann-vs-flattop-two-tones.png)
*图 5　两音间隔 4 Hz、分辨率 1 Hz 时：汉宁窗能分开两个峰，平顶窗因泄漏叠加只显示一个峰（图源：Simcenter Testing Knowledge Base）*

当频率峰不能保证彼此充分分开时，应优先选用汉宁窗，避免相邻峰被平顶窗的宽主瓣淹没。

### 3.4 哈明窗、布莱克曼窗与凯赛窗

- **哈明窗**：与汉宁窗相比最高旁瓣更低（-43 dB），但旁瓣衰减慢（-20 dB/十个旁瓣），适用的动态范围约 50 dB；
- **布莱克曼窗**：适用于检测强信号中存在的弱分量；
- **凯赛窗（Kaiser-Bessel）**：选择性最好，适合区分幅值差别很大的多音信号；随机激励下与汉宁窗相比会引起较大的泄漏误差。

### 3.5 瞬态信号窗：力窗与指数窗

锤击法模态试验中，激励与响应通道使用不同的瞬态窗：

- **力窗（Force window）**：用于激励通道，脉冲作用期间取 1、其余时间取 0，削减力信号通道的杂散噪声；
- **指数窗（Exponential window）**：$w(t) = e^{-\beta t}$，用于采样时间内未充分衰减的响应信号，强迫末端趋零。注意指数窗会引入附加的人为阻尼，后续模态拟合必须计入其影响；
- **Tukey 窗**：大部分时间接近 1，通过渐变长度（taper length）参数控制两端过渡，用于瞬态事件（如路面冲击、柴油机的 clatter）分析，可避免汉宁窗对瞬态时域幅值的衰减。

## 四、窗函数校正因子

加窗同时也会削减信号的幅值和能量，需要在频域乘以校正因子补偿。校正分两类：

**幅值校正（amplitude correction）**——恢复单频信号的真实峰值。校正因子为相干增益（coherent gain）的倒数：

$$
K_A = \frac{N}{\sum_{n=0}^{N-1} w(n)}
$$

对汉宁窗，$\sum w(n) = N/2$，故 $K_A = 2$：正弦波加汉宁窗后谱的峰值降为真实幅值的一半，全谱乘 2 即可复原。单频信号的幅值测量必须采用幅值校正。

**能量校正（energy correction）**——恢复宽带信号的总能量（RMS）。校正因子为：

$$
K_E = \sqrt{\frac{N}{\sum_{n=0}^{N-1} w^2(n)}}
$$

对汉宁窗，$\sum w^2(n) = 3N/8$，故 $K_E = \sqrt{8/3} \approx 1.63$：加窗后信号能量仅为原信号的约 61%，乘 1.63 复原。

两种校正不能同时施加：幅值校正后峰值正确但频带内能量偏大，能量校正后能量正确但峰值偏低。Simcenter Testlab 在 Tools → Options → General 的 2D Correction Mode 中默认 Automatic——谱、自功率谱与阶次自动采用幅值校正，功率谱密度自动采用能量校正。

各窗的校正因子如下（取自 LMS Test 测试理论手册表 1.2）：

| 窗类型 | 幅值校正因子 | 能量校正因子 |
| --- | --- | --- |
| 矩形窗 | 1.00 | 1.00 |
| 汉宁窗 ×1 | 2.00 | 1.63 |
| 汉宁窗 ×2 | 2.67 | 1.91 |
| 汉宁窗 ×3 | 3.20 | 2.11 |
| 哈明窗 | 1.85 | 1.59 |
| 凯赛窗 | 2.49 | 1.86 |
| 布莱克曼窗 | 2.80 | 1.97 |
| 平顶窗 | 4.18 | 2.26 |

::: warning 校正不能省略
不加校正因子的加窗频谱，其幅值和能量均系统偏小。汉宁窗幅值偏小约 50%，平顶窗偏小约 76%（$1/4.18$）。查看测试软件显示的谱线时，应确认其校正模式（幅值/能量）与后续计算的需求一致。
:::

## 五、Python 示例对比

```python
import numpy as np
from scipy import signal
from scipy.fft import fft, fftfreq

fs = 8192          # 采样率
T = 1.0            # 采样时长
N = int(fs * T)
t = np.linspace(0, T, N, endpoint=False)

# 构造信号: 两个频率 + 一个强信号旁的弱信号
f1, f2, f3 = 50, 80, 80.5
x = 10 * np.sin(2*np.pi*f1*t) \
    + 1.0 * np.sin(2*np.pi*f2*t) \
    + 0.01 * np.sin(2*np.pi*f3*t)  # 弱信号

def apply_window(x, window_name):
    """应用窗函数并计算单边幅度谱"""
    if window_name == 'rect':
        win = np.ones(N)
    else:
        win = signal.get_window(window_name, N)

    xw = x * win
    X = fft(xw)
    freqs = fftfreq(N, 1/fs)

    # 单边幅度谱，补偿窗函数能量损失
    mag = 2.0 / N * np.abs(X[:N//2])
    scale = N / np.sum(win)        # 幅值校正因子 K_A = N/sum(w)
    return freqs[:N//2], mag * scale

freqs, spec_hann   = apply_window(x, 'hann')
freqs, spec_rect   = apply_window(x, 'rect')
freqs, spec_flat   = apply_window(x, 'flattop')
```

::: info 幅值校正的实现
上例中的 `scale = N / np.sum(win)` 即幅值校正因子 $K_A$：汉宁窗给出 2.0，scipy 的 flattop 给出约 4.2（与手册表 1.2 的 4.18 为不同系数的平顶窗实现，量级一致）。
:::

## 六、不同窗函数的频谱表现

```python
# 可视化对比
import matplotlib.pyplot as plt

fig, axes = plt.subplots(3, 1, figsize=(10, 8), sharex=True)
for ax, (name, spec) in zip(axes, [
    ('Rectangular', spec_rect),
    ('Hann',       spec_hann),
    ('Flat Top',   spec_flat),
]):
    ax.semilogy(freqs, spec)
    ax.set_xlim(40, 100)
    ax.set_ylim(1e-5, 20)
    ax.set_title(name)
    ax.grid(True, which='both', alpha=0.3)
ax.set_xlabel('Frequency (Hz)')
plt.tight_layout()
plt.savefig('window_comparison.png', dpi=150)
```

对比结果：矩形窗下 50 Hz 强信号的旁瓣将 80.5 Hz 弱信号完全淹没；汉宁窗旁瓣以 -60 dB/十个旁瓣的速度衰减，弱信号清晰可见；平顶窗幅值最准，但三个峰均明显展宽。

## 七、工程选择决策表

::: tip 快速决策
| 使用场景 | 推荐窗函数 |
| --- | --- |
| 随机信号通用频谱分析 | **汉宁窗** |
| 精确测量正弦幅值 / 系统标定 | **平顶窗** |
| 区分幅值差别很大的谐波分量 | 布莱克曼窗或凯赛窗 |
| 整周期截断的正弦、脉冲、猝发随机 | 矩形窗 |
| 锤击模态试验——力通道 | 力窗 |
| 锤击模态试验——响应通道 | 指数窗（拟合时计入人工阻尼） |
| 瞬态事件（冲击、clatter）时域幅值 | Tukey 窗 |
| 随机激励的 FRF 测量 | 汉宁窗（参考与响应通道） |
| 伪随机激励的 FRF 测量 | 矩形窗 |
:::

不知道选什么窗时，汉宁窗是 NVH 通用分析的合理默认——这是随机信号通用分析的工业惯例，而非万无一失的选择：每当信号能保证整周期截断时，矩形窗才是正确答案。

## 八、注意事项

::: warning 频率分辨率与窗函数
- 窗函数的主瓣宽度会**降低**有效频率分辨率：汉宁窗下可分辨的两个等幅频率间隔约为 $4\,\Delta f$
- 平顶窗的泄漏范围为主谱线两侧各 3.43 条谱线，比汉宁窗（1.5 条）宽一倍以上
- 若需要分辨相近频率，应优先增大采样时长 $T$（即减小 $\Delta f$），而非更换窗函数
:::

::: danger 常见错误
不要对密集频率成分直接使用平顶窗。平顶窗主瓣极宽，相邻成分的能量会叠加，导致峰值判读错误（见图 5）。阶次分析中相邻阶次往往间隔较近，同理应使用汉宁窗并配合角域重采样。
:::

## 九、参考

- **LMS Test 测试理论手册（LMS Theory）** — 第 1.3 节"泄漏与加窗"，表 1.1 时窗特性、表 1.2 窗校正因子
- **Simcenter Testing Knowledge Base** — "Window Types"、"Window Correction Factors"、"Leakage and Windows"
- **Heinzel et al. (2002)** — *Spectrum and spectral density estimation by the DFT*, with a window performance survey
- **Brüel & Kjær Technical Review** — Window functions in FFT analyzers
