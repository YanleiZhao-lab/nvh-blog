---
title: "斑马带接缝修正：识别与消除每转一次的转速伪影"
---

# 斑马带接缝修正：识别与消除每转一次的转速伪影

> 测量轴系扭振（torsional vibration）常用激光探头配合斑马带（zebra tape）：黑白条纹胶带缠在轴上，每条白纹经过记一个脉冲。缠绕收尾处两端搭接形成接缝（butt joint），该处条纹间距偏离理论值，每转产生一次假的转速骤降或尖峰，频率位置恰好落在扭振分析最关注的低阶区间。本文说明接缝误差的几何成因、它在一转之内如何表现为扭振伪影，以及 Simcenter Testlab 中 ZEBRA_MOMENTS_TO_RPM 函数的完整修正流程。

## 一、接缝：缠绕收尾引入的系统性误差

先看测量原理。激光垂直照射带面，第 $i$ 条白纹经过时记一个脉冲，相邻脉冲的时间间隔 $\Delta t_i$ 对应一段固定的圆周角度。设带子标称每转 $N$ 条纹——即每转脉冲数（Pulses Per Revolution, PPR）——则每个脉冲间隔对应的角度增量为

$$\Delta\theta = \frac{360^\circ}{N}$$

这是条纹提供的角向分辨率。由角度与时间的关系，该角度区间内的平均转速为

$$n_i = \frac{60}{N\,\Delta t_i}\ \mathrm{rpm}$$

推导只有两步：一步是几何关系——一转被 $N$ 条纹均分为 $N$ 个角度格，每个角度格占一转的 $1/N$；另一步是时间换算——一个角度格耗时 $\Delta t_i$，则一转耗时 $N\Delta t_i$，取倒数并换算到每分钟即得上式。条纹越密（$N$ 越大），一转之内可分辨的转速波动越细；曲轴每转一圈内的燃烧行程波动，靠的就是这个角向分辨率。

![激光与斑马带](/images/zebra-tape-correction/laser-zebra-tape.png)

*（图源：Simcenter Testing Knowledge Base）*

按采样定理，PPR 至少要达到目标扭振阶次的 2 倍：测第 60 阶扭振至少需要 120 PPR；工程上通常再取约 10 倍安全系数，因为 PPR 采样没有抗混叠保护。

理想情况是所有条纹沿圆周严格等距，此时 $\Delta t_i$ 的变化只反映真实转速波动。现实是胶带缠到最后总有收尾：两头一搭，搭接处的条纹间距就变了。这个搭接处就是接缝。它只有一处、只占圆周上很小一段，但每转都会经过激光一次——误差是**严格每转一次的系统性偏差**，不是随机噪声，平均不能消除。

![缠在轴上的斑马带](/images/zebra-tape-correction/wrapped-shaft.png)

*（图源：Simcenter Testing Knowledge Base）*

接缝出错分两种，方向相反：

- **留了豁口**：两头没接上，条纹间距比理论值大。激光等这个脉冲等得久，算出来的瞬时转速偏低——每转一次的假"骤降"（dip）；
- **挤在一起**：收尾多压了一条，两条纹间距比理论值小。脉冲提前到达，转速算高——每转一次的假"尖峰"（spike）。

![接缝处搭接不齐](/images/zebra-tape-correction/butt-joint.png)

*（图源：Simcenter Testing Knowledge Base）*

::: info 核心概念
- **接缝（Butt joint）**：斑马带两端搭接处，条纹间距偏离理论值的那个位置；每转经过激光一次
- **假骤降 / 假尖峰**：豁口让瞬时转速被低估、挤压让它被高估；二者都是每转一次的人工伪影
- **系统性 vs 随机**：接缝误差每转固定出现，平均不能消除，必须在角度域重新分布脉冲
:::

## 二、误差特征：每转一次的低阶伪影

接缝误差的麻烦不在于幅值大，在于**频率位置不利**。每转一次的转速波动就是 1 阶成分，而扭振分析最基础的就是低阶段——接缝伪影恰好落在这一区间，且与真实扭振叠加在同一通道里，频域滤波无法分离。

误差幅值还会被"间隔倒数"运算显著放大。设豁口使第 $j$ 个脉冲间隔从与转速一致的理论值 $\Delta t_j$ 拉长为 $(1+\varepsilon)\Delta t_j$（$\varepsilon>0$ 为相对加长量），其余条纹间隔不变。由转速公式，激光系统在该处反算出的转速为

$$\hat{n}_j = \frac{60}{N\,(1+\varepsilon)\,\Delta t_j} = \frac{n_j}{1+\varepsilon}$$

对应的转速误差为

$$\delta n_j = \hat{n}_j - n_j = -\frac{\varepsilon}{1+\varepsilon}\, n_j$$

推导分三步：第一步，间隔被拉长 $(1+\varepsilon)$ 倍，直接进入分母；第二步，转速与间隔成反比，故反算转速按 $1/(1+\varepsilon)$ 缩小；第三步，相对误差为 $-\varepsilon/(1+\varepsilon)$。取 $\varepsilon = 0.30$、真实转速 $n_j = 1800$ rpm，则 $\delta n_j = -0.231 \times 1800 \approx -415$ rpm。挤压情形 $\varepsilon<0$，误差为正，表现为尖峰。一个只占圆周一格的几何缺陷，经过倒数运算放大后即成为数据中的主导误差——这也是接缝不能靠平均、必须按角度重排修正的原因。

放大 RPM 曲线看，接缝的特征很典型：每一转的同一个角度位置，规律地出现一次尖峰或凹陷，形状一致。它还会顺着阶次分析往下传播：假 1 阶成分混进 colormap，在低阶段拉出一条不存在的阶次线；做扭振角位移积分时，每转一次的转速误差累积成锯齿状的假角位移。

![接缝造成的假转速波动](/images/zebra-tape-correction/rpm-artifact.png)

*（图源：Simcenter Testing Knowledge Base）*

识别判据就一条：**每转固定角度、每转一次、形状可重复**的转速突跳，先怀疑接缝，再怀疑别的。随机毛刺（油污、丢脉冲）没有固定角度位置，据此可以区分。

::: warning 工程注意
接缝误差与码盘偏心造成的假 1 阶很像，但机理不同：接缝是**一转内一个角度位置上的一次跳变**，偏心是**一整圈内条纹先密后疏的连续调制**。修正手段也不同——接缝用 ZEBRA_MOMENTS_TO_RPM 重排脉冲，偏心用 HARMONIC_FILTER 扣整条假 1 阶，两类手段不可混用。
:::

## 三、修正：把脉冲按理论角度重新分布

Simcenter Testlab 的修正思路不是平滑（平滑会把真实扭振一并衰减），而是**按理论几何重建**：既然带子标称 $N$ 条纹/转，就把实测脉冲时刻序列 $t_k$（$k=0,1,2,\dots$）重新映射到均匀的角度网格上

$$\theta_k = k \cdot \frac{360^\circ}{N} \ (\mathrm{mod}\ 360^\circ)$$

每个脉冲按其序号获得理论角度位置，接缝处的间距偏差在整体重排中被几何约束吸收。物理上，重排只承认"第 $k$ 个脉冲对应第 $k$ 个角度格"这一标称几何，不引入任何平滑或滤波，因此扭振信息得以保留。

操作在 **Time Signal Calculator**（Tools → Add-ins 勾选后，工作表上方点 **f(x)**，函数组选 **Tacho**）里完成，函数名 **ZEBRA_MOMENTS_TO_RPM**：

1. **Function1** 指到含接缝误差的转速数据，填通道号或通道名都行；
2. **Pulses_per_rev** 填带子的标称条纹数；
3. 确定后生成一条新 trace，原始数据不动。

![函数设置对话框](/images/zebra-tape-correction/function-dialog.png)

*（图源：Simcenter Testing Knowledge Base）*

修正效果直接看前后对比：原始曲线（红）每转一跳的锯齿被压平，修正后（绿）只剩真实扭振波动。

![修正前后对比](/images/zebra-tape-correction/correction-result.png)

*（图源：Simcenter Testing Knowledge Base）*

16A 版本起支持一条带子多个搭接段的修正——轴径大、带子长、中间加固点多的场合用得上。

### 三种修正工具怎么选

| 对比项 | ZEBRA_MOMENTS_TO_RPM | TACHO 毛刺剔除函数 | HARMONIC_FILTER |
|---|---|---|---|
| **针对误差** | 接缝：每转一次的系统性跳变 | 油污、丢脉冲等随机毛刺 | 码盘偏心等假阶次线 |
| **修正思路** | 脉冲按理论角度全局重排 | 滑动窗口中位数剔除离群脉冲 | 角域平均估计同步成分再减掉 |
| **扭振信息** | 保留（几何重排，不平滑） | 保留（只动出错的少数脉冲） | 目标阶次被扣掉 |
| **伤害风险** | Pulses_per_rev 填错则全错 | 门槛太低误删正常波动 | 扣错阶次误伤真信号 |

按手册说明：毛刺剔除工具只处理零星出错脉冲，属于局部修正；接缝修正要求全部脉冲绕轴重新均布，属于全局重排。两者解决的问题不同，数据里两类误差并存时需要先后都用。

::: tip 使用判断
- 数据里既有接缝跳变又有随机毛刺：先跑毛刺剔除，再做接缝修正——重排前先把离群脉冲清干净
- 只在 colormap 上看到一条可疑的低阶线时，先放大 RPM 曲线确认是"每转一次固定角度跳变"再处理，不应见到毛刺就直接套用 ZEBRA_MOMENTS_TO_RPM
- 修正前另存原始数据。转速通道是全场的基准轴，一旦覆盖无法恢复
:::

## 四、Python 演示：接缝误差如何伪装成扭振

```python
import numpy as np

# 模拟一根轴：平均 1800 rpm，叠加真实的 2 阶扭振波动
rpm_mean = 1800.0
n_stripe = 30                      # 斑马带标称 30 条纹/转
n_rev = 5                          # 看 5 转
dt_theory = 60.0 / (rpm_mean * n_stripe)   # 理论脉冲间隔 (s)

# 真实扭振：瞬时转速含 2 阶波动（幅度 8 rpm），角域生成脉冲到达时刻
theta = np.linspace(0, n_rev * 2 * np.pi, n_rev * n_stripe, endpoint=False)
speed = rpm_mean + 8.0 * np.sin(2 * theta)        # 每转 2 次波动
dt_real = 60.0 / (speed * n_stripe)               # 每个脉冲的真实间隔
# 接缝：第 0 号条纹处留有豁口，该处间隔比理论值长 30%（相对加长量 0.30）
dt_bad = dt_real.copy()
dt_bad[::n_stripe] *= 1.30

rpm_measured = 60.0 / (dt_bad * n_stripe)         # 从间隔反算转速
rpm_true = speed

err = rpm_measured - rpm_true
print(f"真实扭振幅值: ±{8.0:.1f} rpm (2 阶)")
print(f"接缝处误差: {err[::n_stripe].max():+.1f} rpm, 每转出现 1 次")
print(f"其余条纹误差: {np.abs(np.delete(err, np.arange(0, len(err), n_stripe))).max():.1f} rpm")
print(f"接缝误差是真实扭振的 {abs(err[::n_stripe].max()) / 8.0:.1f} 倍")
```

运行结果与第二节公式一致：豁口让一个间隔拉长 30%（$\varepsilon=0.30$），按 $\delta n_j = -\frac{\varepsilon}{1+\varepsilon}n_j$ 反算，瞬时转速跌至约 1385 rpm、误差约 $-415$ rpm——是真扭振幅值（±8 rpm）的 52 倍，而其余 145 个条纹的误差为零。单点几何缺陷经过"间隔倒数"运算被急剧放大，这就是接缝不能靠平均、必须按角度重排修正的原因。

## 五、小结

接缝是斑马带测量方式的固有缺陷，不是操作失误——缠带就有收尾，收尾就有搭接。识别靠三要素：每转一次、固定角度、形状可重复；修正靠 ZEBRA_MOMENTS_TO_RPM 按理论角度全局重排脉冲，标称条纹数 Pulses_per_rev 是唯一关键参数，填错则整条数据全错。随机毛刺先用 TACHO 毛刺剔除函数清理，偏心假阶次用 HARMONIC_FILTER 扣除，三类工具各针对一类误差，不可混用。
