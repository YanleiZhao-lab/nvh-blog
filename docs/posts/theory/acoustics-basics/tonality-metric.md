---
title: "音调度 Tonality：纯音成分的定量评价"
---

# 音调度 Tonality：纯音成分的定量评价

> 新款产品的声压级比上一代低了 3 dB，主观评审却说更吵了。问题往往出在纯音上：一条突出的谱线即使幅度很低，也比更响的宽带噪声更引人注意。音调度（Tonality）就是量化这种音调感的心理声学指标。本文讲两种主流算法——经典的 Aures/Terhardt 音调度（0~1 t.u.）与 ECMA-74:2019 附录 G 的心理声学音调度（t.u.HMS）——从纯音识别判据、响度占比加权一步步推出公式，再给出与信噪比类指标（TTNR/PR）的分工和 Simcenter Testlab 中的计算方法。

## 一、为什么分贝数管不住纯音

涡轮的啸叫、齿轮的呜呜声、蚊子的嗡鸣——纯音（tone）指频谱中突出于背景的单根谱线或窄带成分。它的麻烦在于**感知不取决于绝对声级**：

- 蚊子飞行声的声压级极低，但在安静的房间里格外刺耳；
- 一台总级 87.6 dB 的设备噪声中，81.5 dB 的单根纯音照样清晰可闻；
- 反过来，把纯音埋进足够高的宽带背景，即使谱图上峰还看得见，人耳也分辨不出来。

这说明能不能听到纯音由**纯音与紧邻背景的相对关系**决定，而不是它自己的分贝数。传统指标里，声压级（Sound Pressure Level, SPL，声压均方值对 20 uPa 参考值取对数）与 A 计权声级都只回答多响，不回答音调感多强。

音调度的思路由此而来：在包含纯音的频率邻域内，比较纯音能量与背景能量，再按人耳的听觉规律加权，输出一个与音调感强度对应的数。

::: info 核心概念
- **纯音（tone）**：频谱中窄于临界带宽、明显突出于背景的单根谱线或谱线族
- **临界带（critical band）**：人耳基底膜上约等于一个滤波通道的频率宽度，24 个临界带构成 Bark 刻度，纯音与背景的相对关系在临界带内结算
- **音调度（Tonality）**：量化声音中纯音成分可感知强度的心理声学指标，单位 t.u.（经典）或 t.u.HMS（听觉模型）
:::

![纯音识别示意：左图纯音不够突出、不被视为可闻纯音；右图纯音高于背景足够多、可闻为独立纯音](/images/tonality-metric/fig1.png)
*图 1　纯音必须在背景之上足够突出才算可闻纯音：左图差距不足，右图差距足够（图源：Simcenter Testing Knowledge Base）*

图 1 给出定性判据：谱图上看得见峰和听得出纯音是两回事。峰必须比紧邻的背景高出一定量，才会被听觉系统解析为独立的纯音。这个量正是各 tonal 指标的阈值来源。

## 二、经典音调度：Aures/Terhardt 方法

### 2.1 从谱线判据到 tonality 单位

经典音调度基于 Terhardt 与 Aures 的论文，输出 0 到 1 之间的 **tonality 单位（t.u.）**：

- 0.0 t.u.：纯随机噪声，无任何离散纯音；
- 1.0 t.u.：定义为 1 kHz、60 dB 的正弦纯音（无其他噪声）。

计算分四步。

**第一步：识别纯音谱线。** 算法在谱中逐线搜索，谱线 $S_i$ 须同时满足两个判据：

1. 判据一：$S_i$ 大于左右紧邻的两根谱线（$S_{i-1}$ 与 $S_{i+1}$），即局部峰值；
2. 判据二：$S_i$ 比左右第 2、3 根谱线（$S_{i\pm2}$ 与 $S_{i\pm3}$）都至少大 7 dB。

满足两个判据的七线组（$i-3$ 到 $i+3$）被认定为谱的纯音成分。7 dB 这个数字来自听觉实验：谱线必须比近邻背景高出约 7 dB，才会被听成纯音。

**第二步：构造无纯音谱。** 把所有纯音七线组从原谱中移除，补上平滑背景，得到一条去纯音谱。原谱与去纯音谱分别计算响度，纯音响度占总响度的比例记为 $W_N$：

$$
W_N = \frac{N_{tonal}}{N_{total}}
$$

其中 $N_{tonal}$ 是纯音成分贡献的响度，$N_{total}$ 是整个谱的总响度。纯音越强、背景越弱，$W_N$ 越接近 1。

**第三步：音高加权。** 人耳对不同频率纯音的音调感敏感度不同，加权函数 $W_T$ 在 **700 Hz 处取最大值**——这是 Terhardt 音高感知实验的结果：中频段纯音最容易被识别为有音高的声音。

**第四步：归一化常数。** 常数 $C$ 把整体结果标定到参考条件：1 kHz、60 dB 纯音恰好等于 1 t.u.。

最终音调度 $K$ 等于三项相乘（式 1 截图即原文献公式，指数 0.29 对响度占比做非线性压缩，避免背景稍强就大幅拉低读数）：

$$
K = C \cdot (W_N)^{0.29} \cdot W_T
$$

![经典音调度计算公式：响度占比项、音高加权项与归一化常数组合成 tonality K](/images/tonality-metric/eq1-tonality.png)
*式 1　Aures/Terhardt 音调度公式（图源：Simcenter Testing Knowledge Base）*

::: warning 方法局限
- **分辨率依赖**：判据作用在单根谱线上，频率分辨率 $\Delta f$ 改变会改变谱线相对幅度，同一声音不同分辨率可能给出不同 t.u.
- **每个临界带只取一个纯音**：带内一旦确认一根纯音，其余纯音会被漏掉——齿轮啮合的纯音加边带族容易低估
- **窄带噪声识别不可靠**：对有音调感但非纯谱线的窄带噪声，经典方法的搜索逻辑经常失效（见 3.2 节）
- **700 Hz 最大加权与近期听觉研究不完全一致**
:::

### 2.2 数值行为：纯音增强与混合信号

理解 t.u. 的行为看两组实验。

**纯音幅度递增**：背景宽带噪声不变，2 kHz 纯音每次提高 3 dB。t.u. 随纯音增强单调上升——因为 $W_N$ 里纯音响度占比在涨。

![Simcenter Testlab 经典音调度计算：纯音幅度递增的谱（左）与对应 t.u. 随时间曲线（右），纯音越强 t.u. 越高](/images/tonality-metric/fig2.png)
*图 2　纯音幅度递增时经典音调度随之上升（图源：Simcenter Testing Knowledge Base）*

**三种信号对比**：纯随机噪声、噪声加纯音、纯音三段录音。t.u. 分别约为 0.0、0.5、1.0，即音调性占比。

![经典音调度对三种信号的计算：纯随机噪声 0 t.u.、混合信号约 0.5 t.u.、纯音 1 t.u.](/images/tonality-metric/fig3.png)
*图 3　经典音调度输出纯音能量占比式的 0~1 读数（图源：Simcenter Testing Knowledge Base）*

注意这套行为的本质：t.u. 衡量的是**纯音与背景的相对功率结构**。把整段信号（纯音与背景一起）幅度减半，比值不变，t.u. 也不变——这正是它与听觉不符的地方，也是新一代方法出现的动机。

## 三、心理声学音调度：ECMA-74 听觉模型

### 3.1 公式与数值刻度

心理声学音调度出自 **ECMA-74（第 17 版，2019）附录 G**。它不再直接对频谱做比值，而是先把信号送进一个**听觉模型（hearing model）**：

1. 声压信号经过外耳/中耳传递函数、听阈修正，变换为**特征响度**（specific loudness，即每 Bark 带内的响度分布）；
2. 频率轴采用 Bark 刻度，并划分为 **53 个重叠子带**（z = 0.5 到 26.5，覆盖 20 Hz 到 20 kHz；Testlab 中编号 0~52），比传统 24 带细一倍，纯音定位更准；
3. 在每个子带内用**滑动自相关函数**分离周期性成分（纯音）与非周期成分（噪声）；
4. 逐带比较纯音响度与噪声响度，得到各带的纯音突出度，累加成总音调度。

单位为 **t.u.HMS**（HMS = Hearing Model based Sine tones），刻度锚点与阈值：

| 数值 | 含义 |
| --- | --- |
| **1.0 t.u.HMS** | 定义为 1 kHz、40 dB 纯音（无其他噪声） |
| **0.1 t.u.HMS** | 纯音刚可察觉 |
| **0.4 t.u.HMS** | 开始构成烦扰问题 |
| **0.8 t.u.HMS 及以上** | 高度可闻、高度烦扰 |

注意参考声级是 **40 dB**，比经典方法的 60 dB 低 20 dB——听觉模型对纯音敏感得多，t.u.HMS 数值分布也远超 1：理论上不设上限，纯音越响、感知越强，数值可以到十几。

### 3.2 与经典方法的三个行为差异

**差异一：对响度敏感。** 把纯音加宽带噪声整体缩放 0.5 倍：经典 t.u. 完全不变（比值不变）；心理声学 t.u.HMS 明显下降。这与听觉一致——纯音越响越容易被听成纯音。

![经典音调度对整体缩放不敏感：原始信号与幅度减半信号给出相同的 t.u. 曲线](/images/tonality-metric/fig5.png)
*图 5　整体幅度减半后经典音调度读数不变（图源：Simcenter Testing Knowledge Base）*

![心理声学音调度对整体缩放敏感：减半信号（绿）给出更低的 t.u.HMS，符合人耳感知](/images/tonality-metric/fig6.png)
*图 6　同一缩放实验中心理声学音调度正确地给出更低读数（图源：Simcenter Testing Knowledge Base）*

**差异二：识别窄带噪声的音调感。** 一段约 200 Hz 宽的窄带噪声（3800~4000 Hz）突出于背景——频谱上没有纯谱线，但它听起来有明显的音调感。经典方法按谱线判据搜索，找不到合格谱线，输出 0.0 t.u.；听觉模型按自相关分离周期成分，能给出约 0.4 t.u.HMS，恰在开始烦扰阈值附近。

![窄带噪声案例：3800~4000 Hz 约 200 Hz 宽的噪声带突出于背景，经典音调度输出 0.0 t.u.](/images/tonality-metric/fig7.png)
*图 7　窄带噪声有音调感但无纯谱线，经典方法漏检（图源：Simcenter Testing Knowledge Base）*

![同一窄带噪声的心理声学音调度随时间曲线：约 0.4 t.u.HMS，接近开始烦扰阈值](/images/tonality-metric/fig8.png)
*图 8　听觉模型方法正确识别窄带噪声的音调感（图源：Simcenter Testing Knowledge Base）*

**差异三：给出频率信息。** 经典方法只有一个总数；听觉模型把 53 个子带分开算，可以回答音调感在哪些频率上、各有多强——对整改（在哪个频段做吸声/隔声）这是关键信息。

![吸尘器录音的心理声学音调度对频率的分布：时间平均后逐 Bark 带给出音调感分布](/images/tonality-metric/fig9.png)
*图 9　心理声学音调度可按临界带给出频率分布，经典方法无此能力（图源：Simcenter Testing Knowledge Base）*

### 3.3 混合信号的读数对比

对纯噪声、噪声加纯音、纯音的同一组录音：经典 t.u. 给 0、约 0.5、1 的占比式读数；t.u.HMS 给出的是绝对可感知强度——混合段约 15 t.u.HMS，与纯音段的 15.7 t.u.HMS 几乎一样高。听觉上这两种情况里纯音确实同样突出（背景噪声没有把它掩蔽掉），t.u.HMS 抓住了这一点。

![心理声学音调度对三种信号的计算：混合段约 15 t.u.HMS、纯音段 15.7 t.u.HMS，纯音可感知强度几乎相同](/images/tonality-metric/fig4.png)
*图 4　t.u.HMS 反映纯音的绝对可感知强度而非能量占比（图源：Simcenter Testing Knowledge Base）*

## 四、与 TTNR/Prominence Ratio 的分工

音调度与信噪比类指标（TTNR、PR）都在量化纯音，但回答的问题不同：

- **TTNR（Tone-to-Noise Ratio，纯音信噪比）**：单根纯音比其所在临界带内的掩蔽噪声级高多少 dB；**达到 8 dB 判为突出可闻**（1 kHz 以下需更高）。输出是/否型判据。
- **PR（Prominence Ratio，突出比）**：含纯音的临界带比两侧相邻临界带平均高多少 dB；**达到 9 dB 判为突出**。适合成簇的纯音族（如齿轮啮合频率加边带）。
- **Tonality（音调度）**：连续量，回答音调感有多强，听觉模型版还能按频带分解。

| 指标 | 评价对象 | 输出 | 突出判据 | 依据标准 |
| --- | --- | --- | --- | --- |
| **TTNR** | 单根纯音 | dB（T 减 M） | 8 dB 以上（1 kHz 以下更高） | ECMA-74 / ISO 7779 |
| **PR** | 临界带（可含纯音族） | dB（B 减两侧带平均） | 9 dB 以上（1 kHz 以下更高） | ECMA-74 / ISO 7779 |
| **经典 Tonality** | 整个谱 | 0~1 t.u. | 无固定阈值 | Aures/Terhardt 论文 |
| **心理声学 Tonality** | 逐听觉子带 | t.u.HMS（无上限） | 0.1 可闻 / 0.4 烦扰 / 0.8 严重 | ECMA-74:2019 附录 G |

工程分工：**认证与合规**（IT 设备、家电噪声标注）多用 TTNR/PR 的阈值判据，因为标准写死了 dB 数；**声品质开发与整改排序**用 Tonality，因为它是连续量且能指出哪个频段贡献音调感。两者经常一起算——TTNR/PR 找出哪些纯音超标，Tonality 排序哪个最烦人。

::: tip 指标选择
- 对标标准限值（打印机、计算机等 IT 设备噪声）：TTNR 加 PR，按 8/9 dB 阈值出是/否结论
- 电驱/齿轮啸叫整改、声品质排序：心理声学 Tonality（t.u.HMS），用 0.4 烦扰阈值筛选问题点
- 需要指出音调感在哪个频段：听觉模型版的 Tonality 对频率输出或 Tonality Map
:::

## 五、Python 演示：判据与加权的数值行为

```python
import numpy as np

# 经典音调度的纯音识别判据演示：构造一根突出谱线 + 平坦背景
np.random.seed(0)
bg = 40 + np.random.normal(0, 1.0, 200)     # 背景谱线级（均值 40 dB，抖动 1 dB）
tone_db = 52.0                              # 突出纯音（比背景均值高 12 dB）
i = 100
spec = bg.copy()
spec[i] = tone_db

# 判据一：局部峰值（大于 i-1 与 i+1 两线）；判据二：比 i-3..i+3 至少大 7 dB
c1 = spec[i] > spec[i-1] and spec[i] > spec[i+1]
neigh = [spec[i+k] for k in (-3, -2, 2, 3)]
c2 = all(tone_db - s >= 7.0 for s in neigh)
print(f"判据一(局部峰值): {c1}, 判据二(高出邻线7dB): {c2}")

# 响度占比项 W_N 的行为：纯音级每 +3 dB，能量占比涨多少
for extra in (0, 3, 6):
    p_tone = 10 ** ((tone_db + extra) / 10)     # 纯音功率（线性）
    p_bg = np.sum(10 ** (spec / 10)) - 10 ** (tone_db / 10)
    w_n = p_tone / (p_tone + p_bg)
    print(f"纯音 {tone_db + extra:.0f} dB: W_N = {w_n:.3f}")

# 心理声学刻度锚点换算：1 kHz 纯音 40 dB -> 1.0 t.u.HMS，每 +10 dB 约翻倍
for db in (30, 40, 50, 60):
    print(f"1 kHz 纯音 {db} dB ~= {2 ** ((db - 40) / 10):.1f} t.u.HMS（近似）")
```

运行结果要点：判据一、二均通过；纯音从 52 dB 升到 58 dB（功率涨 4 倍）时 $W_N$ 只从 0.071 涨到 0.233——占比类读数受背景谱线数制约、增长次线性，纯音再强也到不了 1，这正是经典 t.u. 区分度受限的数值体现；后半段显示 t.u.HMS 随声级按每 10 dB 翻倍增长，56 dB 时约 4 t.u.HMS，不饱和。

## 六、Simcenter Testlab 中的计算

### 6.1 经典音调度与 TTNR/PR

- **2D 谱线判读**：在 FrontBack 显示中给谱加 Single X Cursor，置于纯音峰上，右键 Cursor、Calculations 里选 Tone-to-Noise Ratio 或 Prominence Ratio（另有对应的 Prominent 是/否判读项）。TTNR 光标放在纯音峰上即得；PR 以临界带为单位，**光标偏离纯音峰时可能得到更大值**——因为两侧背景带的取值位置变了。
- **3D 图谱**：Tools、Add-ins 打开 Signature Throughput Processing（36 token）与 Sound Quality Metrics（33 token）；在 Time Data Processing 的 Section Settings 中勾选 Prominence Ratio Map 或 Tone-to-Noise Ratio Map，按 rpm 或时间跟踪计算出随工况变化的纯音图谱。

### 6.2 心理声学音调度（Testlab Neo，2019.1.2 起）

在 Process Designer 的 Method Library、Sound Quality 区，带 t.u.HMS 后缀的方法即听觉模型版，共三种：Tonality、Tonality Frequency、Tonality Map。

![Testlab Neo Process Designer 中带 t.u.HMS 后缀的三种心理声学音调度方法](/images/tonality-metric/fig10.png)
*图 10　Testlab Neo 中的三种 t.u.HMS 方法（图源：Simcenter Testing Knowledge Base）*

![心理声学音调度的设置面板：跟踪策略、单值保存、标准版本、频率限、输出轴、单双耳六项设置](/images/tonality-metric/fig11.png)
*图 11　tonality 方法设置项 A 到 F（图源：Simcenter Testing Knowledge Base）*

设置面板六项（对应图 11 标注 A 到 F）：

- **A 跟踪策略**：默认 Free Run、75% 重叠（固定值）；也可按时间或通道（如 rpm）指定增量；
- **B Save single values**：保存整个时间历程的单值平均（各时刻 53 个子带最大值的时间平均）；
- **C Method**：默认 ECMA-74:2019；保留 2018 版供历史数据对比；
- **D 频率限**：默认 20 到 20000 Hz，可收窄分析频段；
- **E Tonality versus**：Time 输出每个时刻所有子带的最大 t.u.HMS；Frequency 输出时间平均后的逐带音调谱；
- **F Type**：Monaural 逐通道独立；Binaural 取左右耳最大值（立体声录音）。

三种输出形态各有用途：

**Tonality 对时间**：每个跟踪点取全部 53 个子带的最大 t.u.HMS，底部给出时间平均单值。看音调感强度随工况（如转速拉升）怎么变。

![Tonality 方法对时间轴输出：每个跟踪点取全部 53 个子带的最大 t.u.HMS，底部为时间平均单值](/images/tonality-metric/fig12.png)
*图 12　音调度随时间的输出形式（图源：Simcenter Testing Knowledge Base）*

**Tonality 对频率**：时间平均后逐 Bark 带给出音调谱，直接指出需要整改的频段——吸声、隔声、隔振该往哪个频段投入，这张图就是依据。

![Tonality 对频率轴输出：时间平均后逐 Bark 带的音调谱，直接指出需要整改的频段](/images/tonality-metric/fig13.png)
*图 13　音调度按频率的输出形式（图源：Simcenter Testing Knowledge Base）*

**Tonality Frequency**：追踪最强纯音的频率随时间或跟踪参数的变化——变速工况下啸叫频率跟着阶次走，这张图把轨迹画出来。

![Tonality Frequency 方法：追踪最强纯音的频率随时间或跟踪参数的变化](/images/tonality-metric/fig14.png)
*图 14　最强纯音频率轨迹（图源：Simcenter Testing Knowledge Base）*

**Tonality Map**：频率对时间的 t.u.HMS 彩色图谱，把强度、频率、时间信息合成一张图，是变速工况纯音分析的总览。

![Tonality Map：频率对时间的 t.u.HMS 彩色图谱，综合全部音调度信息](/images/tonality-metric/fig15.png)
*图 15　音调度图谱输出（图源：Simcenter Testing Knowledge Base）*

::: warning 测试条件注意
纯音是否突出取决于背景。**部件单独台架试验的 tonal 结论不能直接外推到整车/整机状态**——装配后其他声源会填高背景、掩蔽纯音；反之，台架上无背景时任何纯音都会显得突出。评价必须在接近真实使用工况的声环境下进行，或叠加代表使用场景的背景噪声后再计算。
:::

## 七、小结

纯音的可感知性由纯音与紧邻背景的相对关系决定，绝对分贝数与听感脱钩，这是 tonal 指标存在的理由。经典 Aures/Terhardt 音调度以纯音响度占比 $W_N$ 与 700 Hz 峰值的音高加权 $W_T$ 构造 0 到 1 的 t.u. 读数，参考点 1 kHz、60 dB；它对整体幅度缩放不敏感、每临界带只认一根纯音、漏检窄带噪声。心理声学音调度（ECMA-74:2019 附录 G）把信号送入 53 子带听觉模型，用自相关分离纯音与噪声，输出无上限的 t.u.HMS（参考点 1 kHz、40 dB），对响度缩放敏感、能识别窄带噪声的音调感、并能按频带分解。与阈值型的 TTNR（8 dB）和 PR（9 dB）分工：合规判据用后者，整改排序与频段定位用前者。计算条件上，tonal 评价必须在有真实背景的工况下进行，单独部件台架数据不足为凭。
