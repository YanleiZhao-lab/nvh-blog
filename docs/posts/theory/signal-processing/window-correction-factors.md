---
title: "窗函数修正系数：幅值校正 vs 能量校正"
---

# 窗函数修正系数：幅值校正 vs 能量校正

> 加窗抑制了泄漏，却也把信号的幅值和能量都"压小"了——汉宁窗直接让谱峰缩水一半。窗函数修正系数就是补回这笔账的手段，但幅值校正和能量校正只能二选一，选错了，峰值读数或 RMS 能量就会差出 20% 以上。本文讲清两种校正各自修的是什么、Simcenter Testlab 里怎么设、以及 RMS 计算背后自动做的手脚。

## 一、加窗的代价：数据被整体压低了

用汉宁窗对付泄漏是对的，但窗不是免费午餐。时域上信号乘以窗函数，相当于把中间抬高、两端压到零，信号的峰值和曲线下的面积（能量）同时被削减。

![汉宁窗压低信号的幅值与能量](/images/window-correction-factors/fig1-hann-distortion.png)

*（图源：Simcenter Testing Knowledge Base）*

对一个周期正弦信号加汉宁窗，谱峰幅值恰好被压低为原来的一半。不补回来，频谱上读到的每一条谱线都系统性偏低——做阶次切片、对标声学目标线时，这个偏差会一路带进结论。

::: info 核心概念
- **幅值失真**：加窗后谱线峰值整体降低，读到的"这条频率有多大"偏小
- **能量失真**：频谱曲线下的总面积（对应信号总能量/RMS）同步缩小
- **修正系数（Correction Factor）**：对窗后频谱的每条谱线统一乘一个固定系数，由窗类型决定，在频域实施
:::

## 二、幅值校正与能量校正：只能修一个

两种失真对应两种修正系数，但它们不相等——汉宁窗幅值修正系数是 2.00，能量修正系数是 1.633。同一条谱线不可能同时乘两个系数，所以**幅值校正和能量校正只能二选一**：

| 窗类型 | 幅值修正系数 | 能量修正系数 | 适用对象 |
| --- | --- | --- | --- |
| **Uniform（不加窗）** | 1.00 | 1.00 | 唯一两种系数相同的窗 |
| **Hanning** | 2.00 | 1.633 | 通用频谱分析 |
| **Flattop** | — | 2.225 | 幅值精度要求高的标定类测量 |

选幅值校正（×2.00），谱峰回到真实值——原始信号和校正后信号的峰对得整整齐齐；但峰值对了，曲线下面积就过了头，能量偏大。

![幅值校正后谱峰一致但能量偏大](/images/window-correction-factors/fig4-amplitude-corrected.png)

*（图源：Simcenter Testing Knowledge Base）*

改用能量校正（×1.633），曲线下面积与原始信号一致，总能量对了；代价是谱峰只回到 0.82 左右，单条谱线的峰值读数偏低。

![官方修正系数表](/images/window-correction-factors/fig2-correction-table.png)

*（图源：Simcenter Testing Knowledge Base）*

::: warning 工程注意
拿幅值校正后的频谱去做能量类计算（部分频段 RMS、总声压级合成），结果会系统性偏大——汉宁窗下 RMS 偏差约 +22%。反过来，用能量校正的谱去读单条谱峰，峰值偏低约 18%。两种校正的差异不是四舍五入误差，是方法选择问题。
:::

::: tip 怎么选
- 看单条谱线的幅值（阶次幅值、峰值对标、标定）→ 幅值校正
- 看能量类指标（频段 RMS、声压级、PSD）→ 能量校正
- Simcenter Testlab 默认的 Automatic 模式就是按这个逻辑分的：Spectrum/Autopower/Orders 用幅值校正，Power Spectral Density 用能量校正
:::

## 三、Testlab 的设置与 RMS 计算的"后台转换"

在 Simcenter Testlab 中，`Tools -> Options -> General` 下的 **2D Correction Mode** 决定二维图（FrontBack、Bode、UpperLower 等）用哪种校正显示：

| 选项 | 行为 |
| --- | --- |
| **Automatic**（默认） | 按数据类型自动选：Spectrum/Autopower/Orders→幅值校正，PSD→能量校正 |
| **Fixed Amplitude** | 所有谱一律幅值校正显示 |
| **Fixed Energy** | 所有谱一律能量校正显示 |
| **Not Corrected** | 不修正，幅值是所有模式里最低的 |
| **Original** | 按采集时保存的校正模式显示 |

最容易踩坑的一点在 RMS 计算：在图上右键 `Add Double Cursor -> X`，再 `Calculations -> RMS` 取某频段的均方根值时，**Testlab 会自动在后台把数据转成能量校正值再算**——哪怕屏幕上显示的是幅值校正的谱。

![幅值校正显示下 RMS 仍与原始信号一致](/images/window-correction-factors/fig7-rms-identical.png)

*（图源：Simcenter Testing Knowledge Base）*

所以会出现图上"两条曲线面积明显不一样、RMS 读数却相同"的现象。这不是软件 bug，恰恰是软件替你挡掉了选错校正模式带来的能量偏差。

## 四、Python 演示：一个系数修不齐两个量

手写汉宁窗，用周期正弦验证：幅值系数和能量系数各修各的，谁也没法同时救回峰值和 RMS。

```python
import numpy as np

N, fs = 4096, 4096.0
t = np.arange(N) / fs
x = np.sin(2*np.pi*100.0*t)                     # 峰值 1.0 的周期正弦

w = 0.5 - 0.5*np.cos(2*np.pi*np.arange(N)/N)    # 手写汉宁窗
amp_corr = N / w.sum()                          # 幅值修正系数（谱峰补偿）
eng_corr = np.sqrt(N / (w**2).sum())            # 能量修正系数（能量补偿）
print(f"汉宁窗 幅值修正系数 = {amp_corr:.3f}   能量修正系数 = {eng_corr:.3f}")

X = np.abs(np.fft.rfft(x*w)) * 2/N              # 加窗未修正的单边幅值谱
for name, k in [("未修正", 1.0), ("幅值校正", amp_corr), ("能量校正", eng_corr)]:
    peak = X.max() * k                          # 谱线峰值
    rms  = np.sqrt(((X*k)**2).sum() / 2)        # 由全部谱线能量合成总 RMS
    print(f"{name}: 谱峰 = {peak:.4f}, 总RMS = {rms:.4f}")
print(f"真值:   谱峰 = 1.0000, 总RMS = {np.sqrt(np.mean(x**2)):.4f}")
```

运行结果要点：系数算出来正是 2.000 和 1.633，与手册一致。幅值校正把谱峰精确修回 1.0000，但总 RMS 冲到 0.8660，比真值 0.7071 偏大 22%；能量校正把 RMS 严丝合缝修回 0.7071，谱峰却停在 0.8165。两个系数各救一个量，谁也兼顾不了另一个。

## 五、小结

判断标准只有三条：读单条谱线幅值就选幅值校正，算能量和 RMS 就用能量校正；Testlab 的 Automatic 默认已经按数据类型分好了，不要随手改成 Fixed；RMS 计算软件永远在后台用能量校正值，图上曲线面积不同而 RMS 相同是正常现象。
