---
title: "MLMM 最大似然模态模型：从最小二乘到迭代优化"
---

# MLMM 最大似然模态模型：从最小二乘到迭代优化

> 稳定图上挑完极点，合成 FRF 和实测对不上是模态试验的日常。MLMM（Maximum Likelihood estimation of a Modal Model）把"人肉调极点"交给算法：以 Polymax 粗拟合结果为初值，对频率、阻尼、模态参与因子做最大似然迭代优化，官方案例里重阻尼结构的拟合误差从 74% 压到 10%。这篇从公分母模型的线性化最小二乘出发，推导 ML 代价函数为什么长那样、高斯-牛顿怎么解，再落到 Simcenter Testlab 里的实操与约束设置。

## 一、问题：线性化最小二乘拟合 FRF 到底差在哪

模态拟合的本质是给测得的频响函数 $\hat{H}(\omega_k)$ 找一个有理分式模型。LMS 模态理论手册采用带标尺的矩阵分式描述——公分母模型（Common Denominator Model）：输出 $o$ 与输入 $i$ 之间的 FRF 写成

$$
\hat{H}_{oi}(\omega_k) = \frac{N_{oi}(\omega_k)}{D(\omega_k)}
$$

分子多项式 $N_{oi}(\omega) = \sum_{r=0}^{p} A_r\, \Omega_r(\omega)$ 每对输入输出各有一个，公分母多项式 $D(\omega) = \sum_{r=0}^{p} B_{oir}\, \Omega_r(\omega)$ 全部 FRF 共享——物理直觉很简单：同一结构、同一组极点，分母理应相同；分子装的是各测点的振型信息。基函数取离散时间形式 $\Omega_r(\omega_k) = e^{j\omega_k \Delta t r}$，即 $z$ 变换基，为的是数值条件数好、系数不因频带宽窄而失衡。

这个模型对系数 $A_r$、$B_r$ 是线性的，但 FRF 本身是分式。经典做法是两边乘以分母"去分母"（线性化）：

$$
\sum_{r=0}^{p} A_r \Omega_r(\omega_k) - \hat{H}_{oi}(\omega_k) \sum_{r=1}^{p} B_{oir}\, \Omega_r(\omega_k) = 0
$$

对每条谱线列一个方程，堆叠成超定线性方程组，最小二乘一次解出全部系数——快，但埋着一个系统性偏差：**去分母之后，原始测量噪声不再等权进入方程**。真实情况是 $\hat{H} = N/D + n$，噪声 $n$ 加在分式上；去分母后方程残差变成 $N - \hat{H}D = -n D$，噪声被乘上了分母 $D$ 的模。而 $D(\omega)$ 在共振峰附近恰好塌到最小值（极点即分母的根），在反共振谷又很大——于是**共振区数据被自动降权、反共振区噪声被放大**，拟合出的曲线"峰不够峰、谷不够谷"。

::: info 核心概念
- **公分母模型**：所有 FRF 共享一个分母多项式（同一组极点），分子各自独立（各测点振型）
- **线性化最小二乘（LSFD/Polymax 路线）**：去分母把分式拟合化成线性 LS，参数线性、一次求解，代价是噪声模型被扭曲
- **最大似然估计（MLE）**：直接在分式域定义残差，按噪声方差定权，统计意义上最优，但参数非线性、需迭代求解
:::

再补一刀 LSCE 路线的结构性短板（手册 15.4 节原列）：参考自由度超过 3 个时多参考 LSCE 估计未必可靠；要求频率间隔均匀；强噪声污染下稳态图模棱两可；以及最关键的——**给不出模态参数的置信区间**。工程上阻尼比敢不敢报正负 10%，就取决于有没有这个区间。

## 二、推导：ML 代价函数为什么是"残差除以方差"的平方和

最大似然的出发点不是"拟合曲线"，而是问：**参数取什么值时，观测到手里这组数据的概率最大**。

设第 $k$ 条谱线的测量值为 $\hat{H}(\omega_k) = H(\omega_k, \theta) + n_k$，其中 $\theta = [A_0 \cdots A_p, B_1 \cdots B_p]$ 是待估参数，噪声 $n_k$ 服从零均值复高斯分布、方差 $\sigma_k^2$（不同谱线方差可以不同——这正是 ML 的发力点）。单条谱线的概率密度：

$$
p(\hat{H}_k \mid \theta) = \frac{1}{\pi \sigma_k^2} \exp\!\left( -\frac{|\hat{H}_k - H(\omega_k,\theta)|^2}{\sigma_k^2} \right)
$$

物理意义：测量值落在真值正负 1 个标准差内的概率最大，离得越远概率按指数衰减。假设各条谱线噪声独立（测量上成立：不同谱线的 FFT 分块误差近似不相关），全部数据的联合概率就是连乘：

$$
L(\theta) = \prod_{k=1}^{K} p(\hat{H}_k \mid \theta)
$$

取负对数（连乘变连加，单调变换不改极值点），丢掉与参数无关的常数项，得 ML 代价函数：

$$
J_{ML}(\theta) = \sum_{k=1}^{K} \frac{|\hat{H}(\omega_k) - H(\omega_k,\theta)|^2}{\sigma_k^2}
$$

**每一步的物理意义**：方差大的谱线（信噪比差，比如反共振谷、泄漏污染区）自动分到小权重；方差小的谱线（共振峰，信噪比高）权重大。这不是人为技巧，是概率论推导的必然结论——与线性化 LS 把权重锁死成 $|D|^2$ 形成直接对照。实际操作中 $\sigma_k^2$ 由多次平均的样本方差估计（非参数噪声模型），求解器因此对噪声模型误差鲁棒，也能应付大动态范围测量——手册对 ML 求解器的两句原话。

细看这个代价函数和线性化 LS 的关系，还能看出一层联系：若取 $\sigma_k^2 \propto |D(\omega_k)|^2$，即"噪声等价地来自分母"，则 ML 权重 $1/\sigma_k^2$ 恰好还原线性化 LS 的隐含权重。换句话说，**线性化 LS 是 ML 在特定噪声假设下的特例**；反过来，把线性化 LS 的解当初值、按 $1/|D|^2$ 逐次重加权，就是在逼近 ML 解——这正是 Simcenter 实现 MLMM 的工程路线，也是下文 Python 演示复现的机制。

::: warning 工程注意
ML 求解器要的是 FRF 直接做输入，而不是输入谱/输出谱。它默认噪声在输出端、各 FRF 不相关，因此**锤击移动传感器得到的 FRF 是标准喂法**；但要小心 FRF 里的系统性误差（锤子双击、结构非线性、泄漏）——ML 只能重新分配权重，不能消除偏置。
:::

## 三、求解：高斯-牛顿迭代与置信区间

$J_{ML}$ 对参数是非线性的（分式模型），没有闭式解。手册采用高斯-牛顿（Gauss-Newton）算法：在当前参数点一阶泰勒展开 $H(\omega,\theta) \approx H(\omega,\theta^{(i)}) + J_a \Delta\theta$（$J_a$ 为雅可比矩阵，每行是偏导 $\partial H/\partial\theta_j$ 在该谱线的取值），代入 $J_{ML}$ 后对增量求极小——又回到一个加权线性最小二乘：

$$
\Delta\theta = \arg\min_{\Delta} \sum_k \frac{\left|\hat{H}_k - H_k(\theta^{(i)}) - J_{a,k}\Delta\right|^2}{\sigma_k^2}
\quad\Rightarrow\quad
\theta^{(i+1)} = \theta^{(i)} + \Delta\theta
$$

每轮迭代解一个线性 LS，代价函数值单调下降（在收敛半径内），一般 5~10 轮就收敛。这就是 MLMM 界面上那个 Maximum number of iterations 和逐次下降的误差曲线背后的算法。

更值钱的是副产品：**协方差矩阵与置信区间**。高斯-牛顿最后一轮的正规方程矩阵 $\mathrm{Re}\{J_a^H \Sigma^{-1} J_a\}$ 的逆就是参数协方差的近似——即克拉美-罗下界（CRLB，Cramer-Rao Lower Bound）的良好近似，无偏估计器的方差不可能低于它。ML 估计在大样本下渐近达到 CRLB，所以手册说 ML 估计的协方差矩阵通常接近 CRLB。工程读法：只关心频率和阻尼的不确定性时，只需要分母系数那块子矩阵的协方差，不必对全矩阵求逆——算得快，报告里能写"35.15 Hz +/- 0.03 Hz（95%）"这种有统计底气的话。

| | **线性化 LS（Polymax 粗拟合）** | **MLMM（ML 迭代优化）** |
| --- | --- | --- |
| **模型域** | 去分母后的多项式域 | 直接在 FRF 分式域 |
| **求解** | 一次线性 LS，毫秒级 | 高斯-牛顿迭代 5~10 轮 |
| **噪声处理** | 隐含权 $\|D\|^2$，共振区被降权 | 按 $1/\sigma_k^2$ 定权，统计最优 |
| **置信区间** | 无 | 有，协方差接近 CRLB |
| **对初值** | 不需要 | 需要（Polymax / Time MDOF 结果） |
| **适用场景** | 轻阻尼、信噪比高、快速出结果 | 重阻尼、声腔、内饰车身、密频 |

::: tip 什么时候值得上 MLMM
- 初拟合误差已经很小（轻阻尼金属结构）：不必，MLMM 改善有限
- 重阻尼结构、声腔模态、内饰车身（trimmed body）：MLMM 官方点名收益最大的场景
- 需要阻尼/频率的置信区间撑报告结论：ML 是手册路线里唯一给得出区间的
- OMA（运行模态）数据：不行，MLMM 输入必须是 FRF，Polymax/Time MDOF 初值是硬前提
:::

## 四、Python 演示：重加权怎么把 25% 误差压到 3%

先看权重机制的真实效果。构造双模态 FRF 加常数方差噪声（复高斯），分别用等权线性化 LS 和按 $1/|D|^2$ 迭代重加权拟合同一个公分母模型，分共振带/反共振区统计相对误差：

```python
import numpy as np
# 双模态 FRF + 常数方差噪声：线性化最小二乘 vs 迭代重加权(ML 思想)
rng = np.random.default_rng(3)
f = np.linspace(20, 60, 801); w = 2*np.pi*f; s = 1j*w/(2*np.pi*60)  # 归一化基函数
wn = 2*np.pi*np.array([30.5, 44.0]); zt = np.array([0.02, 0.03]); R = np.array([0.4, -0.3])
H = sum(R[r]/(1j*w - (-zt[r]*wn[r] + 1j*wn[r]*np.sqrt(1-zt[r]**2))) for r in range(2))
Hm = H + (rng.normal(0,.0025,801) + 1j*rng.normal(0,.0025,801))     # 测量FRF
V = s[:,None]**np.arange(5)                       # 基函数矩阵(分母4阶/分子3阶)
def fit(wt):
    X = np.hstack([V[:,:4], -Hm[:,None]*V[:,1:]]) # N - H*D = 0 线性化，D首项=1
    Xw = X*np.sqrt(wt)[:,None]
    th, *_ = np.linalg.lstsq(Xw, Hm*np.sqrt(wt), rcond=None)
    D = V@np.concatenate([[1], th[4:]]); return (V[:,:4]@th[:4])/D, D
err = lambda h,m: np.sqrt(np.mean(np.abs(h[m]-H[m])**2)/np.mean(np.abs(H[m])**2))*100
band = (np.abs(f-30.5)<3)|(np.abs(f-44)<3)        # 共振带
val  = np.abs(H) < np.abs(H).max()*0.3            # 反共振谷区
h, D = fit(np.ones(801))                          # 第0次：等权线性化LS
print(f"线性化LS初值 : 共振带误差 {err(h,band):5.1f}% | 反共振区误差 {err(h,val):5.1f}%")
for k in range(1, 8):                             # 迭代重加权：权=1/|D|^2
    h, D = fit(1/np.maximum(np.abs(D)**2, 1e-12))
    if k in (1, 4, 7):
        print(f"重加权第{k}次(ML): 共振带误差 {err(h,band):5.1f}% | 反共振区误差 {err(h,val):5.1f}%")
```

真实运行输出：

```text
线性化LS初值 : 共振带误差   8.1% | 反共振区误差  25.3%
重加权第1次(ML): 共振带误差   1.5% | 反共振区误差   6.1%
重加权第4次(ML): 共振带误差   1.5% | 反共振区误差   3.2%
重加权第7次(ML): 共振带误差   1.5% | 反共振区误差   3.2%
```

最值得看的是反共振区那一列：25.3% 到 3.2%，压掉近 8 倍。这正是第二节的理论预言——线性化 LS 在 $|D|$ 大的地方放大噪声权重，而重加权把它纠正回来。共振带从 8.1% 到 1.5% 同向改善。注意第 1 次重加权就基本到位、4 次后不再变化——迭代算法"前几轮吃掉大误差、后面精修"的典型节奏，对应 MLMM 界面上那条很快走平的误差曲线。

## 五、Python 演示：MLMM 内核——高斯-牛顿直接优化模态参数

MLMM 实际做的事更进一步：不拟合多项式系数，而是直接把**模态参数**（频率、阻尼、模态参与因子/留数）当优化变量，对合成 FRF 与实测 FRF 的残差做高斯-牛顿迭代。复现一个重阻尼车身模态的例子——35 Hz、12% 阻尼，初值故意给偏（模拟 Polymax 粗拟合的典型偏差）：

```python
import numpy as np
# MLMM 内核复现：对频率/阻尼/留数直接做高斯-牛顿迭代(重阻尼车身模态)
rng = np.random.default_rng(7)
f = np.linspace(10, 80, 1401); w = 2*np.pi*f
lam = -0.12*2*np.pi*35 + 1j*2*np.pi*35*np.sqrt(1-0.12**2)   # 真值:35Hz/12%
H = 1.0/(1j*w - lam) - 30.0/w**2                 # 含带外低频残余项
Hm = H + (rng.normal(0,.01,1401) + 1j*rng.normal(0,.01,1401))
p = np.array([33.0, 0.09, 0.8])                  # 初值:频率/阻尼/留数,故意给偏
def model(p):
    l = -p[1]*2*np.pi*p[0] + 1j*2*np.pi*p[0]*np.sqrt(1-p[1]**2)
    return p[2]/(1j*w - l) - 30.0/w**2
for it in range(6):
    r = model(p) - Hm                            # 复残差
    J = np.zeros((1401,3), complex)
    for j in range(3):                           # 数值雅可比
        dp = np.zeros(3); dp[j] = 1e-6*abs(p[j])
        J[:,j] = (model(p+dp) - model(p-dp))/(2*dp[j])
    Jr = np.vstack([J.real, J.imag]); rr = np.concatenate([r.real, r.imag])
    p = p - np.linalg.lstsq(Jr, rr, rcond=None)[0]   # 高斯-牛顿修正
    print(f"迭代{it}: f={p[0]:7.3f} Hz  z={p[1]*100:5.2f}%  R={p[2]:5.3f}  代价={np.mean(np.abs(r)**2):.2e}")
print(f"真值    : f=35.000 Hz  z=12.00%  R=1.000")
```

真实运行输出：

```text
迭代0: f= 34.340 Hz  z=13.55%  R=0.951  代价=2.39e-04
迭代1: f= 35.303 Hz  z=12.22%  R=0.962  代价=2.02e-04
迭代2: f= 35.148 Hz  z=11.85%  R=0.952  代价=1.96e-04
迭代3: f= 35.154 Hz  z=11.84%  R=0.952  代价=1.95e-04
迭代4: f= 35.154 Hz  z=11.84%  R=0.952  代价=1.95e-04
迭代5: f= 35.154 Hz  z=11.84%  R=0.952  代价=1.95e-04
真值    : f=35.000 Hz  z=12.00%  R=1.000
```

看点有三个。其一，频率初值偏 2 Hz、阻尼初值偏四分之一，一轮迭代就跨到 34.34 Hz/13.55%，三轮后稳定在 35.154 Hz/11.84%——收敛值与真值的残余偏差来自噪声实现，不是算法误差，这类偏差正是置信区间要量化的事。其二，代价列从 $2.39\times10^{-4}$ 降到 $1.95\times10^{-4}$，单调下降且很快走平，与 Testlab 界面误差曲线的行为一致。其三，这是单模态、三个参数的最小例子；真实 MLMM 是几十阶模态、上百个参数（每阶模态每个参考点一个参与因子）同时迭代，但雅可比与正规方程的结构完全相同。

## 六、在 Simcenter Testlab 里用 MLMM

MLMM 随 LMS Test.Lab 17 发布，Classic 界面需在 Tools -> Add-ins 勾选 MLMM（26 tokens；Neo 版本从 2606 起在 Modal Analysis 里带 MLMM 任务页）。流程不变的是前端：照常跑 Polymax 或 Time MDOF，稳定图上选极点、生成极点表，然后按 MLMM 按钮把整套极点交给迭代求解器。

![MLMM 改善效果](/images/mlmm-modal-estimation/MLMM_Improvement.png)

*重阻尼结构上 MLMM 自动迭代的效果：该 FRF 合成误差从 74% 降到 10%（图源：Simcenter Testing Knowledge Base）*

![MLMM 插件勾选](/images/mlmm-modal-estimation/mlmm_addin.png)

*Tools -> Add-ins -> MLMM，Classic 界面入口（图源：Simcenter Testing Knowledge Base）*

![MLMM 工作表](/images/mlmm-modal-estimation/mlmm_worksheet.png)

*Polymax 工作表顶部新增的 MLMM 页签（图源：Simcenter Testing Knowledge Base）*

MLMM 工作表里设 Maximum number of iterations（频率/阻尼/参与因子被调整的次数）后点 Calculate，界面中部实时显示合成 FRF 与实测 FRF 的误差，逐次迭代应该越来越小、后期变化越来越小。

![迭代误差下降](/images/mlmm-modal-estimation/iteration_smaller_differences.png)

*每次迭代，合成 FRF 与实测 FRF 的误差逐次变小（图源：Simcenter Testing Knowledge Base）*

跑完到 Modal Synthesis 页检查合成质量，界面直接给两个数：**correlation**（合成 FRF 形状贴合实测形状的程度，理想 100%）和 **error**（幅值差，理想 0%）。Advanced 按钮下有三类约束可设——这组设置比迭代次数本身更影响结果质量：

![高级约束选项](/images/mlmm-modal-estimation/advanced_options.png)

*Advanced 选项：可对频率和阻尼设约束（图源：Simcenter Testing Knowledge Base）*

- **Keep mode frequency constant**：锁住频率不动，只迭代阻尼和参与因子。前一轮分析已确认频率（比如和 CAE 模型对齐过）时用，防止迭代把频率拉跑
- **最大阻尼上限**（默认 70%）：MLMM 判断某阶模态对描述 FRF 没贡献时，会把它"压死"——阻尼直接给到上限值，等效从模型中剔除。看到 70% 阻尼的模态别惊讶，那是算法在说"这阶是多余的"
- **每次迭代最大变化量**：限制单步调整幅度，初值可疑时防发散

Neo 里流程类似：Modal 任务下 MLMM 页签，Run 后代价函数实时更新，满意了点 Accept 保存这套新模态。

![模态合成检查](/images/mlmm-modal-estimation/synthesis.png)

*迭代完成后的 Modal Synthesis 检查：上方 correlation 与 error 百分比（图源：Simcenter Testing Knowledge Base）*

## 七、小结

MLMM 不是新算法取代旧算法，是把 Polymax 的快（线性 LS 一次解）和 ML 的准（分式域加权 + 置信区间）串成一条流水线：Polymax 稳定图解决"有哪些模态"，MLMM 迭代解决"参数到底多准"。工程判断标准三条——轻阻尼金属结构初拟合已够准，不必上；重阻尼、声腔、内饰车身、密频系统，MLMM 是官方点名的高收益场景；要报带置信区间的阻尼，ML 是手册路线里唯一给得出的。初值质量决定上限，稳定图没选对极点，再多次迭代也救不回来。
