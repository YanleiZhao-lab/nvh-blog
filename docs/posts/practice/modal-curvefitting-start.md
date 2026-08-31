---
title: "模态拟合入门：稳定图与极点选择"
---

# 模态拟合入门：稳定图与极点选择

> 锤击法测得一组频响函数（Frequency Response Function, FRF）后，模态参数估计的核心是把曲线拟合问题转化为极点估计问题。本文说明模态拟合器所求解的数学模型，稳定图（Stabilization Diagram）上极点符号亮度的含义，以及选择物理极点的常用判据与注意事项。

## 一、拟合器在解什么：从 FRF 到极点

参数估计的基本问题，是调整模型参数使模型预示的数据尽可能逼近测量数据。对实验模态分析而言，粘性比例阻尼系统的运动方程经模态变换解耦后，每一阶模态等效为一个单自由度振荡器，测得的频响函数即各阶模态贡献的线性叠加：

$$H_{ij}(\omega) = \sum_{k=1}^{N} \frac{\psi_{ik}\psi_{jk}}{m_k\left[ \omega_{0,k}^2 - \omega^2 + 2 j \sigma_k \omega \right]}$$

其中 $N$ 为分析频带内的模态数，$m_k$ 为第 $k$ 阶模态质量（kg），$\psi_{ik}$、$\psi_{jk}$ 分别为响应点 $i$ 与参考点 $j$ 的振型系数（无量纲），$\omega_{0,k}$ 为无阻尼固有频率（rad/s），$\sigma_k$ 为阻尼因子（1/s）。把分母在复频域 $s = j\omega$ 上因式分解为 $(s - \lambda_k)(s - \lambda_k^{*})$，再作部分分式展开，就得到拟合器实际采用的极点-留数模型：

$$H_{ij}(\omega) = \sum_{k=1}^{N} \left( \frac{A_{ijk}}{j\omega - \lambda_k} + \frac{A^{*}_{ijk}}{j\omega - \lambda^{*}_k} \right)$$

即每一阶模态贡献一对共轭极点与一对共轭留数。实模态、质量归一标尺下，留数为

$$A_{ijk} = \frac{\psi_{ik}\psi_{jk}}{2 j\, m_k \omega_{d,k}}$$

留数等于两个振型系数之积与比例常数的组合。留数是有量纲的，单位由标尺常数赋予，振型系数本身是无量纲的相对量。极点、固有频率（有阻尼与无阻尼）、阻尼因子或阻尼比、模态振型与留数，合称模态参数。极点、频率与阻尼三者的关系为

$$\lambda_k = -\sigma_k + j\omega_{d,k}, \qquad \omega_{0,k} = \sqrt{\sigma_k^2 + \omega_{d,k}^2}, \qquad \zeta_k = \frac{\sigma_k}{\omega_{0,k}} \approx \frac{\sigma_k}{\omega_{d,k}} \;\; (\zeta_k \ll 1)$$

阻尼因子决定该阶自由衰减的速率，虚部为有阻尼固有频率，小阻尼条件下阻尼比可由两者之比直接估计。极点是全局量——同一阶模态，从结构上任何一个 FRF 估出的频率、阻尼都应相同，留数则随响应点与激励点位置变化，按上式分解后即得模态振型。

拟合因此分两步进行，先把所有 FRF 放在一起，统一估计全套极点（整体估计，Global Estimate），再对每条 FRF 解出留数，得到振型。最小二乘复指数法（Least Squares Complex Exponential, LSCE）即属此类，它在时域上把冲激响应表示为衰减复指数之和：

$$h_{ij}(t) = \sum_{k=1}^{N} \left( A_{ijk}\, e^{\lambda_k t} + A^{*}_{ijk}\, e^{\lambda^{*}_k t} \right), \qquad t \ge 0$$

然后由所有可得到的数据构建协方差矩阵，在最小二乘意义上求解线性方程组，一次算出全部模态的频率与阻尼。

但有一个必须预先回答的问题：**数据里到底有几阶模态？** 拟合器无法自行判断，它只按设定的阶数求解方程。

::: info 核心概念
- **极点（Pole）**：$\lambda_k = -\sigma_k + j\omega_{d,k}$，包含阻尼因子与有阻尼固有频率，是结构的总体（全局）特性
- **留数（Residue）**：复数幅值系数，随测点/激励点变化，分解后得到模态振型，注意它是有量纲的，单位由标尺常数赋予
- **整体估计（Global Estimate）**：所有 FRF 同时参与拟合，极点结果对所有测点一致，LSCE、PolyMAX 类方法均属此类
- **单自由度（SDOF）法**：峰值拾取、模态圆拟合等，只适用于频带内模态明显解耦的情形
:::

## 二、稳定图：区分物理模态与计算模态

拟合前要先设定模型阶数 $N$。真实系统若有 4 阶模态，理论上 $N=4$ 时误差最小——最小二乘误差图会在这个阶数处出现明显跌落。但实测数据带噪声，噪声使误差随阶数持续缩小，拐点变钝，仅凭误差图不足以确定阶数。

于是改用另一策略，令阶数从低到高逐步增加，把每一步估出的全部极点画到同一频率轴上。物理模态的极点由结构决定，阶数增加不会使其移动，在图上连成一条竖直的稳定线（工程上俗称光柱），计算模态（Computational Modes）是拟合器用来吸收噪声的数学构造，阶数一变就漂移。这就是稳定图（理论手册中亦译作稳态图）。

![稳定图](/images/modal-curvefitting-start/stability-diagram.png)

*（图源：Simcenter Testing Knowledge Base）*

![最小二乘误差图](/images/modal-curvefitting-start/ls-error-chart.png)

*（图源：Simcenter Testing Knowledge Base）*

软件中每个极点符号的亮度对应稳定程度，同一频率处，与上一阶数相比频率、阻尼、振型都满足判据的极点符号最亮，只满足部分判据的符号较暗。可信的物理模态应对应一条自低阶到高阶持续满足判据的竖直稳定线，而不是孤立出现的单个极点。

::: warning 工程注意
不要按 FRF 曲线的峰数选择极点。峰可能来自带外模态的残余影响、泄漏伪峰或结构非线性，密集的极点列中也可能存在两阶靠得很近的耦合模态。稳定图提供的信息比幅值谱峰丰富——先看稳定线，再对照谱峰。
:::

## 三、极点取舍判据：频率、阻尼与振型稳定性

判别物理极点通常用三条标准，将频率、阻尼、振型分别与相邻阶数的结果比对（下表为常用参考值，具体以所用软件的判据设置为准）：

| 判据 | 典型容差 | 物理含义 |
| --- | --- | --- |
| **频率稳定** | 相邻阶数间变化 < 2% | 极点位置由结构决定，不随模型阶数漂移 |
| **阻尼稳定** | 相邻阶数间变化 < 5% | 阻尼对噪声敏感，容差适当放宽 |
| **振型稳定** | 与相邻阶数振型的 MAC > 90% | 不仅频率吻合，空间形态也要一致 |
| **模态参与一致性** | 多参考数据各参考点均显著 | 密集模态/重根情形下，该极点的模态参与因子（Modal Participation Factor）在各参考点处应一致非零 |

振型一致性用模态置信准则（Modal Assurance Criterion, MAC）量化：

$$\mathrm{MAC}(\boldsymbol{\psi}_a, \boldsymbol{\psi}_b) = \frac{\left| \boldsymbol{\psi}_a^{\mathrm{H}} \boldsymbol{\psi}_b \right|^2}{\left( \boldsymbol{\psi}_a^{\mathrm{H}} \boldsymbol{\psi}_a \right)\left( \boldsymbol{\psi}_b^{\mathrm{H}} \boldsymbol{\psi}_b \right)}$$

取值范围从 0 到 1，度量两个振型向量空间方向的一致程度，稳定图上比较的是相邻模型阶数下同一极点的振型估计。

阻尼容差比频率宽，因为阻尼本身就是对噪声最敏感的参数——这与锤击试验中指数窗人为增大阻尼是同一类问题，凡影响衰减速率的因素，都会首先反映到阻尼估计上。Simcenter Testlab 的模态拟合器可依据记录在数据中的指数窗衰减参数，对阻尼估计做相应修正。

::: tip 选择原则
- 默认做法，先在稳定图上找频率、阻尼、振型同时稳定的竖直稳定线，且频率与 FRF 峰位对应的才是物理模态
- 阶数宁多勿少——多出的计算模态会在稳定图上自行漂移，不干扰判断
- 密集模态或重根情形必须使用多参考点数据，依靠模态参与因子解耦，单参考点数据难以胜任
- 极点选定后，应检查拟合的综合 FRF 曲线与实测曲线的覆盖程度，峰谷均吻合方可确认结果
:::

## 四、Python 数值演示：计算模态随阶数漂移

下面按 LSCE 思路做一个最小实现，构造含两个模态（32 Hz/2.5%、87 Hz/1.0%）的冲激响应并叠加噪声，对相关函数作 Prony 拟合（噪声的自相关近似为零，拟合更稳定），阶数从 2 逐步增加到 10，观察哪些极点保持稳定。

```python
import numpy as np

# 含两个物理模态的脉冲响应（32 Hz/2.5%，87 Hz/1.0%），叠加噪声模拟实测
fs = 2048; dt = 1/fs
n = np.arange(1024)
h = 4*np.exp(-2*np.pi*32*0.025*n*dt)*np.cos(2*np.pi*32*n*dt) \
  + 2*np.exp(-2*np.pi*87*0.010*n*dt)*np.cos(2*np.pi*87*n*dt)
rng = np.random.default_rng(0)
h = h + 0.05*rng.standard_normal(h.size)

# LSCE 思路: 对相关函数做 Prony（噪声的相关近似为零，极点与原信号相同）
full = np.correlate(h, h, 'full') / h.size
r = full[h.size-1:]                    # 正滞后部分的相关函数

def prony_poles(x, order):
    M = 150                            # 用 150 个相关滞后值，方程强超定
    A = np.column_stack([x[order-i:M+order-i] for i in range(1, order+1)])
    b, *_ = np.linalg.lstsq(A, x[order:M+order], rcond=None)
    z = np.roots(np.concatenate(([1], -b)))
    s = np.log(z.astype(complex))/dt   # 离散根换算回连续极点
    f = np.abs(s.imag)/2/np.pi
    zeta = -s.real/np.abs(s)
    ok1 = np.logical_and(f > 5, f < 500)
    ok2 = np.logical_and(zeta > 0, zeta < 0.2)
    keep = np.logical_and(np.logical_and(ok1, ok2), s.imag > 0)
    return f[keep], zeta[keep]

print("真实极点: 32.0Hz/2.5%   87.0Hz/1.0%")
for N in (2, 4, 6, 8, 10):
    f, z = prony_poles(r, N)
    pairs = "  ".join(f"{fi:6.1f}Hz/{zi*100:4.1f}%" for fi, zi in zip(f, z))
    print(f"order {N:3d}: {pairs}")
```

运行结果要点，阶数 6、8、10 时，32 Hz 与 87 Hz 两个极点基本不变（31.9-31.9-32.0 Hz，阻尼 3.1%-2.7%-2.6%），对应稳定图上的竖直稳定线，而 order 10 出现的 450.3 Hz/11.1% 极点在低阶数时并不存在，阶数一变就漂移——即典型的计算模态。极点选择的依据正在于此，物理模态的参数估计对模型阶数不敏感。

## 五、小结

极点选择有明确的工程判据，物理模态 = 稳定图上频率、阻尼、振型同时稳定的竖直稳定线 + 与 FRF 峰位对应 + 综合曲线回代吻合。阶数可适当设高，让计算模态自行漂移，不干扰判断，阻尼对噪声与窗函数敏感，交叉验证时宜保留约 5% 余量，密集模态不宜依赖单参考点，多参考数据的模态参与因子才是解耦的有效途径。
