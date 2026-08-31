---
title: "逐循环平均：发动机工况数据处理"
---

# 逐循环平均：发动机工况数据处理

> 同一台发动机、同一工况，每个缸压循环都不一样——燃烧循环变差（combustion variability）直接决定怠速稳定性和驾驶感。Simcenter Testlab 的逐循环角域处理能把一段连续数据切成一个一个 720° 循环，再做平均、包络、门区统计。这篇讲清楚背后的思路和操作路径。

## 一、为什么要"逐循环"看数据

看发动机数据，多数人的第一反应是拉一段时域波形，或者做 colormap 看阶次。但只要涉及**燃烧相关的评估**——缸内压力、燃烧振动、怠速抖动——时域和频域都不够用：

- **时域看不清**：发动机转速一直在小幅波动（每循环 720° 用的时间都不严格相等），直接按时间切波形，第 50 循环和第 51 循环的燃烧事件对不上位置；
- **频域抹掉了差异**：FFT 假设信号周期平稳，循环与循环之间的变差（cycle-to-cycle variation）恰恰是非平稳信息，一做平均就没了。

真正的物理基准是**曲轴转角**。四冲程发动机一个完整循环是 2 转 = 720°，无论转速怎么波动，压缩上止点永远在同一个角度位置。把数据从时域变换到**角域（Angle Domain）**，第 N 个循环和第 N+1 个循环就能严格逐点对齐——逐循环统计才有意义。

![Free Run (angle) 采集设置：按循环数而非时间截取数据](/images/cycle-cycle-averaging/free-run-angle-settings.png)

*（图源：Simcenter Testing Knowledge Base）*

::: info 核心概念
- **角域（Angle Domain）**：横轴为曲轴转角而非时间的数据表示，转一转 360°、四冲程一个循环 720°
- **循环变差（Cycle-to-cycle Variation）**：同一工况下相邻循环燃烧结果的差异，缸压峰值波动是直观体现
- **每转采样数（samples per rev）**：角域重采样的角度增量，决定后续处理的角度分辨率
:::

## 二、Testlab 里的四步操作路径

### 第 1 步：把数据切成循环

在 Time Data Processing 界面，"Change Settings" → "Acquisition Parameters"，把 Measurement Mode 设为 **Tracked**、Tracking Method 设为 **Free Run (angle)**——按转数而不是按时间取数据。界面上填 300，就是取前 300 个循环，升序排列。

再到 "AD Acquisition" 标签页设**每循环 2 转**。这一步常被漏掉：四冲程机一个循环是 720°，若按默认 1 转切，缸压曲线会被人为切成两半，压缩行程和排气行程错位对叠，统计全废。

### 第 2 步：算平均与包络

![Navigator 里的 5 个循环：左缸压、右振动，横轴均为 720°](/images/cycle-cycle-averaging/five-cycles-angle-domain.png)

*（图源：Simcenter Testing Knowledge Base）*

上图是切出来后的样子：每条曲线是一个循环，缸压与振动逐循环叠画。

切完循环，"Section Settings" → "Change Settings" → **Map Statistics AD** 标签页（注意认准带 AD 后缀的，那是角域统计；不带 AD 的 Map Statistics 是按时间块的），勾选 Angle averaged、Angle Peak Hold 等选项，重新 Calculate。结果存在 Angle Domain 文件夹下的 Map Statistics 子目录里：所有循环的**平均循环、最大包络、最小包络、标准差**。

![300 个循环的 max/min/average 曲线](/images/cycle-cycle-averaging/map-statistics-avg-max-min.png)

*（图源：Simcenter Testing Knowledge Base）*

平均循环告诉你"这台机器长什么样"，min/max 包络的宽度告诉你"它有多不稳定"。包络窄如发丝的机器是稳定的；包络在燃烧段撑开一大片，就是循环变差大的直接证据。

### 第 3 步：多缸对齐后再算派生量

想算多缸之间的平均缸压，先做相位对齐：**Angle Domain Validation** 界面给每个通道填 **Cyl Offset**（各缸上止点的角度偏移量），把各缸压缩上止点拉到同一角度。对齐后回到 Time Data Processing → "Channel Processing" → Change Settings → **DerivedAD** 标签页，用 LINAVG 等函数在角域做通道间运算——比如 CH1~CH4 的平均缸压曲线。

除了平均，DerivedAD 里还可以定义 DIFFERENTIATE 之类的函数：对缸压求角域导数，就得到**压力升高率 dP/dCA**，其峰值是评估燃烧粗暴度（爆震倾向、燃烧噪声）的关键指标——这个量在时域里算没有意义，因为转速波动会让相邻循环的同一段导数对应不同的曲轴位置。

### 第 4 步：门区统计抓每循环特征值

![Frame Statistics AD 门区设置与每循环最大值结果](/images/cycle-cycle-averaging/frame-statistics-gate.png)

*（图源：Simcenter Testing Knowledge Base）*

有些评估只关心特定角度窗口：比如缸压峰值预期出现在 10°~30° 曲轴角之间。"Section Settings" → "Frame Statistics AD" 里定义角度门（gate），对每个循环在门内取最大值、均值等统计量。输出不再是一条曲线，而是**每循环一个数**的序列——300 个循环就是 300 个峰值点，可以直接看散布、做 CPK、挑异常循环。

::: warning 三个高频坑
- **忘设每循环 2 转**：四冲程按 1 转切，缸压曲线相位错乱，统计结果看似正常实则全错——检查压缩上止点位置是否落在 0°/720° 可快速自查
- **用错统计标签页**：Map Statistics（时域）和 Map Statistics AD（角域）是两套东西，选错标签页算出来的是按时间块的平均，循环对不齐
- **多缸不对齐就平均**：四缸机各缸上止点相差约 180°，不做 Cyl Offset 直接 LINAVG，得到的是一条被抹平的无意义曲线
:::

## 三、逐循环统计到底在看什么

把门区统计的结果排开看，本质上是把"一段录音"变成"每一拍的体检报告"。四个层次的信息依次展开：

| 统计量 | 物理含义 | 工程用途 |
| --- | --- | --- |
| **平均循环** | 所有循环的典型形态 | 燃烧相位、峰值压力的基准值 |
| **min/max 包络** | 极端循环的边界 | 循环变差的直观幅度 |
| **标准差循环** | 逐角度点的波动强度 | 找变差集中的角度段（通常是燃烧段） |
| **门区每循环峰值** | 单循环特征值序列 | 散布分析、CPK、异常循环挑拣 |

::: tip 怎么用这些量
- 判断燃烧稳定性 → 看包络宽度和标准差集中的角度区间
- 对比不同工况（油品、点火角、EGR 率）→ 比较门区峰值的散布，而不是只比平均值
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

输出里最值得看两个数：**标准差最大处是 392°**——比峰值位置（374°）滞后了十几度，落在压力陡降段。原因不难理解：±3° 的峰值角度漂移在曲线平缓处几乎看不出差别，但在斜率最陡的地方被放大成最大的逐循环差异。循环变差不是均匀撒在 720° 里的，它集中在燃烧峰两侧的陡峭段。**门区峰值散布比 5.9%**，与构造时 ±8% 的幅度扰动量级吻合（随机扰动的标准差约 8%，取包络内最大值后收敛到 6% 附近）。实测数据里这个比例若超过 10%，怠速工况下驾驶员多半能感知到明显的转速波动。

## 五、小结

逐循环分析的关键只有一句：**先到角域，再谈统计**。时域切循环对不齐相位，频域平均抹掉变差，角域是唯一能让第 N 循环与第 N+1 循环逐点对齐的域。操作上记住三件事：AD Acquisition 里把每循环设成 2 转（四冲程）；统计认准带 AD 后缀的标签页；多缸运算前先做 Cyl Offset 对齐。拿到每循环峰值序列后，散布（std/mean）比平均值更能说明燃烧品质。
