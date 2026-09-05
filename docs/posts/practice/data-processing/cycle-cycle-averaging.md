---
title: "逐循环平均：发动机工况数据处理"
---

# 逐循环平均：发动机工况数据处理

> 同一台发动机、同一工况，每个缸压循环都不一样——燃烧循环变差（combustion variability）直接决定怠速稳定性和驾驶性（driveability）。Simcenter Testlab 的逐循环角域处理能把一段连续数据切成一个一个 720° 循环，再做平均、包络、门区统计。本文说明其背后的原理和操作路径。

## 一、为什么要"逐循环"看数据

看发动机数据，常见的做法是拉一段时域波形，或者做 colormap 看阶次。但只要涉及**燃烧相关的评估**——缸内压力、燃烧振动、怠速抖动——时域和频域都不够用：

- **时域看不清**：发动机转速一直在小幅波动（每个 720° 循环占用的时间并不严格相等），直接按时间切波形，第 50 循环和第 51 循环的燃烧事件对不上位置；
- **频域抹掉了差异**：FFT 假设信号周期平稳，循环与循环之间的变差（cycle-to-cycle variation）恰恰是非平稳信息，一经平均就消失。

真正的物理基准是**曲轴转角（crank angle）**。四冲程发动机一个完整循环是 2 转 = 720°，无论转速怎么波动，压缩上止点（Top Dead Center, TDC）永远在同一个角度位置。把数据从时域变换到**角域（Angle Domain）**，第 N 个循环和第 N+1 个循环就能严格逐点对齐——逐循环统计才有意义。

![Free Run (angle) 采集设置：按循环数而非时间截取数据](/images/cycle-cycle-averaging/free-run-angle-settings.png)

*（图源：Simcenter Testing Knowledge Base）*

::: info 核心概念
- **角域（Angle Domain）**：横轴为曲轴转角而非时间的数据表示，转一转 360°、四冲程一个循环 720°
- **循环变差（Cycle-to-cycle Variation）**：同一工况下相邻循环燃烧结果的差异，缸压峰值波动是直观体现
- **每转采样数（samples per rev）**：角域重采样的角度增量，决定后续处理的角度分辨率
:::

## 二、Testlab 里的四步操作路径

### 第 1 步：把数据切成循环

前置准备：在 **Tools → Add-ins** 中加载 **Signature Throughput Processing** 与 **Angle Domain Processing** 两个插件。选中角域数据（放入 input basket 或设为 active run），进入 Time Data Processing 界面，"Change Settings" → "Acquisition Parameters"，把 Measurement Mode 设为 **Tracked**、Tracking Method 设为 **Free Run (angle)**——按转数而不是按时间取数据。界面上填 300，就是取前 300 个循环，升序排列。

再到 "AD Acquisition" 标签页设**每循环 2 转**，这样一个循环由 720° 组成。这一步常被漏掉：四冲程机一个循环是 720°，若按默认 1 转切，缸压曲线会被人为切成两半，压缩行程和排气行程错位对叠，统计结果失效。

### 第 2 步：算平均与包络

![Navigator 里的 5 个循环：左缸压、右振动，横轴均为 720°](/images/cycle-cycle-averaging/five-cycles-angle-domain.png)

*（图源：Simcenter Testing Knowledge Base）*

上图是 Calculate 之后 Navigator 里的结果：每条曲线是一个循环，缸压与振动逐循环叠画。

切完循环，"Section Settings" → "Change Settings" → **Map Statistics AD** 标签页（注意认准带 AD 后缀的，AD 即 Angle Domain，角域统计；不带 AD 的 Map Statistics 是按时间块的），勾选 Angle averaged、Angle Peak Hold 等选项，重新 Calculate。结果存在 Angle Domain 文件夹下的 Map Statistics 子目录里：所有循环的**平均循环、最大包络、最小包络、标准差**。

![300 个循环的 max/min/average 曲线](/images/cycle-cycle-averaging/map-statistics-avg-max-min.png)

*（图源：Simcenter Testing Knowledge Base）*

平均循环给出这台机器的典型工作状态，min/max 包络的宽度给出它的稳定程度：包络宽度接近测量噪声水平，说明循环变差小；包络在燃烧段明显撑开，就是循环变差大的直接证据。

### 第 3 步：多缸对齐后再算派生量

想算多缸之间的平均缸压，先做相位对齐：**Angle Domain Validation** 界面给每个通道填 **Cyl Offset**（各缸上止点的角度偏移量），把各缸压缩上止点拉到同一角度。对齐后回到 Time Data Processing → "Channel Processing" → Change Settings → **DerivedAD** 标签页，用 LINAVG 等函数在角域做通道间运算——比如 CH1~CH4 的平均缸压曲线。

除了平均，DerivedAD 里还可以定义 DIFFERENTIATE 之类的函数，对缸压求角域导数，得到**压力升高率（pressure rise rate）** $dP/d\theta$——其峰值是评估燃烧粗暴度（爆震倾向、燃烧噪声）的关键指标。设 $P_k(\theta)$ 为第 $k$ 个循环的缸压曲线、$\Delta\theta$ 为角域采样间隔（由每转采样数决定），采样点 $\theta_i$ 处的导数用中心差分近似：

$$\left(\frac{dP}{d\theta}\right)_{k,i} \approx \frac{P_k(\theta_i+\Delta\theta)-P_k(\theta_i-\Delta\theta)}{2\,\Delta\theta}$$

物理意义：用 $\theta_i$ 前后各一个采样点连线的斜率代替该点的瞬时导数，逐点计算得到整条 $dP/d\theta$ 曲线，其最大值即峰值压力升高率（peak pressure rise rate）。这个量必须在角域里计算——时域求导时转速波动会使同一段导数在不同循环对应不同的曲轴位置，结果没有可比性。

### 第 4 步：门区统计抓每循环特征值

![Frame Statistics AD 门区设置与每循环最大值结果](/images/cycle-cycle-averaging/frame-statistics-gate.png)

*（图源：Simcenter Testing Knowledge Base）*

有些评估只关心特定角度窗口：比如缸压峰值预期出现在 10°~30° 曲轴角之间。"Section Settings" → **Frame Statistics AD** 标签页（通常在最右侧，AD 即角域）里定义角度门（gate），对每个循环在门内取最大值、均值等统计量。结果存放在 Frame Statistics 文件夹，用 XY 图可以同时查看门内最大值及其出现的角度位置。输出不再是一条曲线，而是**每循环一个数**的序列——300 个循环就是 300 个峰值点，可以直接看散布、做 CPK、挑异常循环。

::: warning 三个常见错误
- **忘设每循环 2 转**：四冲程按 1 转切，缸压曲线相位错乱，结果看似正常、相位实际已错——检查压缩上止点位置是否落在 0°/720° 可快速自查
- **用错统计标签页**：Map Statistics（时域）和 Map Statistics AD（角域）是两套东西，选错标签页算出来的是按时间块的平均，循环对不齐
- **多缸不对齐就平均**：四缸机各缸上止点相差约 180°，不做 Cyl Offset 直接 LINAVG，得到的是一条因相位未对齐而被抹平、失去工程意义的曲线
:::

## 三、逐循环统计到底在看什么

门区统计把一段连续记录转化为逐循环的特征值序列，四个层次的信息依次展开：

| 统计量 | 物理含义 | 工程用途 |
| --- | --- | --- |
| **平均循环** | 所有循环的典型形态 | 燃烧相位、峰值压力的基准值 |
| **min/max 包络** | 极端循环的边界 | 循环变差的直观幅度 |
| **标准差循环** | 逐角度点的波动强度 | 找变差集中的角度段（通常是燃烧段） |
| **门区每循环峰值** | 单循环特征值序列 | 散布分析、CPK、异常循环挑拣 |

前三个量可以严格定义。设第 $k$ 个循环的角域信号为 $x_k(\theta)$，$\theta \in [0^{\circ}, 720^{\circ})$，$k = 1, \dots, N$。**平均循环**是在每个角度位置上对全部循环做平均：

$$\bar{x}(\theta) = \frac{1}{N}\sum_{k=1}^{N} x_k(\theta)$$

物理意义：固定角度 $\theta$，把 $N$ 个循环在该角度的取值平均——循环间的随机涨落相互抵消，保留所有循环共有的确定性成分，即"典型形态"。

**标准差循环**度量每个角度位置上的散布强度：

$$\sigma(\theta) = \sqrt{\frac{1}{N-1}\sum_{k=1}^{N}\left[x_k(\theta) - \bar{x}(\theta)\right]^2}$$

分三步理解：先求每个循环相对平均循环的偏差 $x_k(\theta)-\bar{x}(\theta)$，再对偏差平方取平均（除以 $N-1$ 得无偏估计），最后开方恢复原量纲；$\sigma(\theta)$ 大的角度段就是循环变差集中的区段。

对门区统计得到的每循环峰值序列 $P_1, P_2, \dots, P_N$，同样先算均值 $\mu$ 和标准差 $\sigma$，再归一为**变异系数（Coefficient of Variation, CoV）**：

$$\mathrm{CoV} = \frac{\sigma}{\mu}\times 100\%$$

物理意义：用均值归一，使散布指标无量纲化，不同峰值水平、不同工况之间可以直接比较——CoV 是量化循环变差最常用的指标。

::: tip 怎么用这些量
- 判断燃烧稳定性 → 看包络宽度和标准差集中的角度区间
- 对比不同工况（油品、点火角、EGR 率）→ 比较门区峰值的散布，和相关参数，而不是只比平均值
- 挑问题循环 → 在每循环峰值序列里找离群点，回到对应循环的原始曲线核对
:::

## 四、Python 演示：切循环、平均、包络

这段代码模拟 300 个循环的缸压信号——固定平均循环上叠加随机循环变差，演示逐循环切分、平均、包络与门区统计的完整逻辑（角域数据按 720° 一循环组织，与 Testlab 的 Map Statistics AD 同思路）：

```python
import numpy as np

rng = np.random.default_rng(42)

# 角域轴：每循环 720 度，每 2 度一个点
n_cycles, deg_per_cyc, step = 300, 720, 2
theta = np.arange(0, deg_per_cyc, step)      # 单循环角度轴
n_pts = len(theta)

# 构造缸压平均循环：压缩-燃烧-膨胀的简化形态，燃烧峰在 375 度
def cyl_press(t, shift=0.0):
    return 15 + 60 * np.exp(-((t - 375 - shift) / 28) ** 2)

# 循环变差三要素：峰值幅度扰动、峰值角度漂移、背景噪声
amp   = 1 + 0.08 * rng.standard_normal(n_cycles)   # 峰值幅度 ±8%
phase = 3.0 * rng.standard_normal(n_cycles)        # 峰值角度 ±3 度
noise = rng.standard_normal((n_cycles, n_pts))     # 传感器噪声

cycles = np.empty((n_cycles, n_pts))
for k in range(n_cycles):   # 幅度变差 + 角度漂移 + 噪声，逐循环生成
    cycles[k] = 15 + amp[k] * (cyl_press(theta, phase[k]) - 15) + 0.3 * noise[k]

avg = cycles.mean(axis=0)                          # 平均循环
lo, hi = cycles.min(axis=0), cycles.max(axis=0)    # min/max 包络
std = cycles.std(axis=0)                           # 逐角度标准差

# 门区统计：燃烧段 360~390 度内每循环最大值
gate = (theta >= 360) & (theta <= 390)
p_max = cycles[:, gate].max(axis=1)

i_pk = int(std.argmax())
print(f"平均循环峰值: {avg.max():6.2f} bar @ {theta[avg.argmax()]:.0f} deg")
print(f"峰附近包络宽: {(hi - lo)[i_pk]:6.2f} bar")
print(f"标准差最大处: {theta[i_pk]:6.0f} deg（变差最集中的角度）")
print(f"门区峰值序列: mean={p_max.mean():.2f}  std={p_max.std():.2f}  "
      f"min={p_max.min():.2f}  max={p_max.max():.2f} bar")
print(f"散布比 std/mean = {p_max.std()/p_max.mean()*100:.1f}%")
```

输出里最值得看两个数：**标准差最大处是 392°**——比峰值位置（374°）滞后了十几度，落在压力陡降段。原因不难理解：±3° 的峰值角度漂移在曲线平缓处几乎不产生差异，但在斜率最陡的地方被放大成最大的逐循环差异——循环变差不是均匀分布在 720° 里的，它集中在燃烧峰两侧的陡峭段。**门区峰值散布比（CoV）5.9%**，与构造参数吻合：±8% 的幅度扰动作用在 60 bar 的燃烧增量上，峰值散布约 $0.08 \times 60 = 4.8$ bar，相对约 75 bar 的峰值总水平，理论散布比 $4.8/75 \approx 6.4\%$，实测 5.9%（有限样本与门内取最大值带来小幅修正）。燃烧研究的经典判据（Heywood）以 IMEP 的变异系数超过 10% 作为驾驶性明显恶化的界限；门区峰值 CoV 可参考同一量级——实测怠速数据若超过 10%，通常伴随可感知的转速波动。

## 五、小结

逐循环分析的关键只有一句：**先到角域，再谈统计**。时域切循环对不齐相位，频域平均抹掉变差，角域是唯一能让第 N 循环与第 N+1 循环逐点对齐的域。操作上记住三件事：AD Acquisition 里把每循环设成 2 转（四冲程）；统计认准带 AD 后缀的标签页；多缸运算前先做 Cyl Offset 对齐。拿到每循环峰值序列后，变异系数（CoV）比平均值更能说明燃烧品质。
