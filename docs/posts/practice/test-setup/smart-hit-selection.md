---
title: "智能选锤 Smart Hit Selection：让算法挑出最好的几锤"
author: "@NVH_Z"
---

# 智能选锤 Smart Hit Selection：让算法挑出最好的几锤

> 一块平板锤击模态收工，25 锤敲完，相干还是上不去；老工程师逐锤翻看时域波形，5 分钟就挑出 3 锤双击、2 锤过载、1 锤敲偏了位置——删掉重算，相干立刻贴回 1。问题来了：这 25 锤里到底该留哪几锤？人工挑锤靠经验，慢而且标准不统一；全留平均，坏锤把好数据拖下水。
> 
> Simcenter Testlab Neo 从 2506 版起在 Impact Acquisition 里内置了 Smart Hit Selection（智能选锤）：多敲几锤、让算法自动剔掉双击与过载、再按锤间一致性挑出最好的一组进平均。这篇讲清它的筛选流程、每个设置项的物理含义，以及两两相似度与两两相干两种挑锤标准差在哪。类比贯穿全文：它就是锤击试验的照相机连拍——多按几次快门，回家再挑不糊的那张。

## 一、为什么要让算法挑锤：平均是把双刃剑

先看一个现场尾尾：同一块平板、同一把锤子、同一个敲击点，两位工程师各测一遍同样 10 锤的 FRF，拿到的平均结果却能差出可观的幅值与相位差异。拆开时域波形一比，原因很小：一位敲出过 2 次双击、另有 1 锤过载；另一位每锤都干净但力度忽大忽小。平均本身不会区分好锤坏锤——把坏数据平均进去，它就永久地洼在结果里。

还有一个更隐蔽的误差源：人手敲击的位置偏移。操作员对着同一测点反复敲击，每锤的实际落锤位置总有毫米级的偏差。位置偏了，激励点正好挪动，各锤 FRF 的峰位就会出现小幅漂移；这些漂移被平均后，峰变胖、幅值变低，后续用 FRF 反演估算载荷时还会出现假峰。这类问题单看单锤时域波形很难发现，只有把多锤 FRF 摆在一起对比才显形。

![人手敲击位置偏差导致的 FRF 漂移：左图平均 FRF，中图各锤落锤位置（红点），右图各锤 FRF 的小漂移](/images/smart-hit-selection/fig1.png)

*（图源：网络官方公开资料）*

传统的解法是两个：一是测后人工逐锤复核（慢，且标准因人而异）；二是测前开好双击与过载自动剔除（把关双刃剑，但敲偏、力度飘、锤间不一致仍然漂网而过）。Smart Hit Selection 的思路是第三条路：与其事后挑锤，不如开测时就多敲几锤，让算法实时地把双击、过载、力度越界、锤间不一致全部拦下，只留最好的一组进平均。

## 二、连拍类比：为什么多敲反而更准

把 Smart Hit Selection 想象成旅行时的连拍：风景稍纵即逝，手一拖，照片就糊一半——但快门几乎不要钱，正确的做法是对同一个场景连按五快门，回家再挑出最清楚的那张。锤击试验一模一样：每一锤都是一次性快门，双击是手抖了，过载是爆光了，敲偏是构图挪了——坏照片删掉就行，代价只是多按几次快门。锤击的单位时间成本极低（每锤几秒），而重新开一轮试验、或带着坏数据走到模态拟合阶段才发现问题，代价要高几个数量级。多敲几锤、让算法挑锤，本质上是用便宜的冗余换取数据质量的确定性。

这个思路有个前提要说在前面：算法能挑锤，是因为每一锤的原始时域数据都单独存了下来，选锤发生在平均之前、而不是事后。传统采集每敲一锤立刻算一条 FRF 并累加平均，坏锤一旦进了平均就取不出来；Smart Hit Selection 把逐锤时域数据全部留档，所以既能自动挑，也允许事后手工改选、改完参数重算。

::: info 核心概念
- <strong>Smart Hit Selection（SHS，智能选锤）</strong>：Simcenter Testlab Neo 2506 版起 Impact Acquisition 内置的自动选锤功能：多采几锤，自动剔除双击与过载，再按锤间一致性或相干挑出最优一组进平均
- <strong>双击（Double Hit）</strong>：锤头反弹后再次回敲结构，力信号里出现第二个脉冲，会搅乱幅值与相位
- <strong>过载（Overload）</strong>：信号超出采集卡量程，波形被削顶，频域失真且幅值不可信
- <strong>两两相似度 / 两两相干（Pairwise Similarity / Pairwise Coherence）</strong>：两种挑锤判据——前者比各锤即时 FRF 曲线形状的相似程度，后者比合成相干函数（激励与响应的线性关系强弱）
- <strong>DOF（Degree of Freedom）</strong>：一次测量的名字，测点名与方向的组合
:::

## 三、筛选流程：四道关卡顺序过

Smart Hit Selection 在每敲完一锤、力与加速度信号入库之后，按固定顺序做四道检查，任何一道没过，这锤就进不了平均：

![Smart Hit Selection 的处理流程图：双击与过载先剔除，再做力级别检查（可选），最后按一致性/相干选锤](/images/smart-hit-selection/fig2.png)

*（图源：网络官方公开资料）*

1. <strong>过载检查</strong>：过载让频域失真、幅值掊才，直接剔除。
2. <strong>双击检查</strong>：测量时间内出现第二脉冲，直接剔除。
3. <strong>峰值力检查（可选）</strong>：力偏离目标级别超过阈值的锤被标记或剔除——面向非线性结构（响应随力级别变化）时尤其重要。
4. <strong>一致性/相干选锤</strong>：前三关全过的锤之间再两两比较，挑出一致性最高的一组进平均。

它运行在 Neo Impact Acquisition 的 Measure 步骤里，是采集过程的一部分而不是事后工具：

![Simcenter Testlab Neo Impact Acquisition 界面，Smart Hit Selection 就在 Measure 步骤中](/images/smart-hit-selection/fig3.png)

*（图源：网络官方公开资料）*

## 四、锤数的账：敲多少、留多少

先看一组具体数字，再说设置项。一个典型配置：每个激励点总共敲 10 锤（Target impacts per hammer = 10），最终平均只用其中 3 到 6 锤（Minimum impacts = 3，Maximum impacts = 6）。多敲的 4 到 7 锤就是给算法的挑锤余量。

![Minimum impacts = 3、Maximum impacts = 6、Target impacts per hammer = 10 的实测结果：平均用其中 3～6 锤](/images/smart-hit-selection/fig4.png)

*（图源：网络官方公开资料）*

三个参数各有归宿：Target impacts per hammer 在 Campaign Settings 里定，是实际采集的总锤数；Minimum 与 Maximum impacts 在 Automatic Impact Selection （魔杒图标菜单）里定，是允许进平均的锤数区间。Target 应该大于或等于 Maximum，否则挑锤余量为零。还有一个细节：相似度/相干百分比只有在已采锤数达到 Minimum 后才会显示——若双击剔除导致剩余锤数不足 Minimum，算法不做比较，直接继续敲。

这笔账可以写成一个简单的概率模型。这个公式回答的问题是：每锤独立地以概率 p 合格、以 1-p 失败（双击、过载或不一致）时，想保证至少拿到 m 锤好锤，应该总共敲多少锤？其中 N 是总敲锤数，二项分布给出概率：

$$
P(X \ge m) = \sum_{k=m}^{N} \binom{N}{k}\, p^{k} (1-p)^{N-k}
$$

拿典型数字代入：操作员状态好时单锤合格率约 0.8，想至少留 3 锤。只敲 4 锤时只要坏两锤就凑不够；敲满 10 锤时拿不到 3 锤好锤的概率已小到可以忽略。下面用 numpy 把这笔账算出来：

```python
import numpy as np
from math import comb

def p_at_least(m, N, p):
    # probability of at least m good hits (binomial)
    return sum(comb(N, k) * p**k * (1-p)**(N-k) for k in range(m, N+1))

p = 0.8                       # per-hit pass rate, good operator
for N in (4, 6, 8, 10):      # total hits acquired
    print(f"N={N:2d}: >=3 good hits with prob {p_at_least(3, N, p):.3f}")

p = 0.5                       # rushed operator, half the hits bad
for N in (6, 10, 12):
    print(f"p=0.5 N={N:2d}: >=3 good hits with prob {p_at_least(3, N, p):.3f}")
```

输出（numpy 2.x 实测）：合格率 0.8 时 N=4/6/8/10 对应 0.819/0.983/0.999/1.000；当单锤合格率跌到 0.5（赶工、结构难敲、锤头不匹配），N=6 只有 0.656，N=10 才升到 0.945。这就是 Target 应高于或等于 Maximum 的统计理由：挑锤余量不是浪费，是保险。改完 Automatic Impact Selection 的设置后点 Close 即生效；菜单里的 Save 是用来存预设条件模板的，不点也不影响当前设置。

## 五、双击与过载：两道硬门槛

过载与双击是前两道关，判据硬、不可调和。八锤里只留四锤的实测例子：

![八锤中只接受四锤：两锤因双击被剔、两锤因过载被剔](/images/smart-hit-selection/fig5.png)

*（图源：网络官方公开资料）*

过载的危害在频域：波形被削顶后幅值不可信、调波失真，信号已不可逆地损坏，没有任何后处理能救。双击的危害在相位：两个脉冲对应两组输入输出关系，平均到一起后峰附近相位转不动、相干莫名掉落（双击的物理机制详见锤击窗函数一文）。

过载剔除还有一个更彻底的选项：Campaign Settings 的 Measurement advanced 里有 Auto reject with overload 开关，打开后过载锤直接不进列表，画面更干净；代价是事后想人工看一眼过载锤长什么样也看不到了。

## 六、峰值力限带：给非线性结构的专属开关

第三道关是可选的峰值力检查，默认关闭。它回答的问题是：结构响应随力级别变化（非线性）时，如何强制每锤都敲在同一个力点上？开启后只保留峰值力在目标附近的锤。

为什么力级别一致很重要：非线性结构的 FRF 本身依赖激励幅值，力度飘忽大忽小，各锤实际测的就不是同一条曲线，平均没有物理意义。对比实验很直观：开启峰值力筛选后相干明显改善，尤其在噪声大的频段；效果大小取决于结构的非线性程度。

![峰值力筛选开（黄）与关（蓝）的对比：开启后相干改善，尤其在噪声大的频段](/images/smart-hit-selection/fig6.png)

*（图源：网络官方公开资料）*

设置在两处：目标力级别在 Hammer Setup 标签页的 More 里填（例如 4 牛）；上下容忍阈值在 Measure 标签页的 Automatic Impact Selection（魔杒图标）里分别设上下限百分比（例如各 20%，即目标 4 N 正负 0.8 N）。

![Hammer Setup 标签页的 More 里设置 Target force level](/images/smart-hit-selection/fig7.png)

*（图源：网络官方公开资料）*

![Automatic Impact Selection 里分别设置上下阈值：峰值力标橙为待定、标红为剔除](/images/smart-hit-selection/fig8.png)

*（图源：网络官方公开资料）*

阈值判定的颜色语言：黑色在容差内；橙色超差但 Auto exclude force level 未开，由人工决定去留；红色超差且自动排除开启，直接剔除。阈值可以在测量中途任意时候调整。默认阈值 100% 相当于不检查：所有锤都能过力这一关。

## 七、两两相似度 vs 两两相干：挑锤的两把尺子

第四道关是真正的选锤环节：前三关全过的锤之间两两比较，挑出最优组合。Automatic Impact Selection 菜单里二选一：Pairwise similarity 或 Pairwise coherence。

![Pairwise coherence 与 Pairwise similarity 的选择入口](/images/smart-hit-selection/fig9.png)

*（图源：网络官方公开资料）*

两者的区别在比什么：

| 方法 | 比较对象 | 判据 |
| --- | --- | --- |
| <strong>两两相似度</strong> | 各锤的即时 FRF 曲线（幅值-频率形状） | 两条 2D 曲线形状像不像 |
| <strong>两两相干</strong> | 合成相干函数的统计评估 | 激励与响应的线性关系强不强（重复性） |

相似度是纯几何判据：两条曲线峰位、峰高、走向都一致就算相似，不问相位。相干是统计判据：它问的是这一锤的响应里有多大比例真的由这一锤的力造成。两把尺子大多数时候结论一致，但对反共振点、噪声频段的敏感度不同：反共振处响应接近零、噪声占比大，相干天然低，却不妙碍两条曲线的形状相似。

配套的 Target Value 在 1% 到 100% 之间设置，越高越苛刻，100% 意味着只接受最好的组合。下图例子：目标 98%，算法找到六锤（恰好 Minimum）相干达 99%，超标完成。

![Target Value = 98%：找到六锤相干 99% 超过目标](/images/smart-hit-selection/fig10.png)

*（图源：网络官方公开资料）*

## 八、采集与回看：状态栏、手动覆写与重算

正式采集：设置完成后按 Start，每敲一锤列表多一行，左下角状态栏同步更新，四种可能的状态：

![每敲一锤后的四种状态：Overload / Double Hit / Deviation / OK](/images/smart-hit-selection/fig14.png)

*（图源：网络官方公开资料）*

| 状态 | 含义 |
| --- | --- |
| Overload | 过载被剔 |
| Double Hit | 双击被剔 |
| Deviation | 与其他锤的 FRF 偏差过大被剔 |
| OK | 当前被接受（后续可能被更优的锤顶掉） |

最后一行值得展开：选锤不是先到先得。若设 Minimum 为 3，前三锤都 OK，第四锤比其中某锤更一致，算法会把原先那锤的 OK 改成拒收，换第四锤进入平均。平均的永远是当前最优组合，不是早到的那个组合。

回看与手动覆写：高亮列表某一行，该锤 FRF 与平均结果叠加显示；点击 Selected 单元格可以手动改选，Mode 列的图标从齿轮（自动）变成人形（手动）。

![高亮单行可看单锤 FRF 与平均的叠加对比](/images/smart-hit-selection/fig11.png)

*（图源：网络官方公开资料）*

![点击 Selected 单元格手动改选：人形图标代表手动选择，齿轮代表自动](/images/smart-hit-selection/fig12.png)

*（图源：网络官方公开资料）*

Measure 区右上角有一排 SHS 操作按钮，从左到右依次是：新增 DOF（橙）、改设置（黄）、全部 DOF 重算（蓝，数据大时耗时）、仅当前激励 DOF 重算（红）、清除所有手动选择回到全自动（绿）、刷新 Campaign（紫）。

![Smart Hit Selection 的操作按钮组：新增 DOF / 设置 / 全部重算 / 当前 DOF 重算 / 清除手动 / 刷新](/images/smart-hit-selection/fig13.png)

*（图源：网络官方公开资料）*

保存：底部 Save 按钮把平均 FRF 存进名为 Campaign 的文件结构，逐锤时域数据存在 Measurement Run 里；同时可给 Campaign 命名。注意：不按 Save 就开新测量，项目里不会留下 FRF；补救方法是从 Desktop 标签页恢复该 Run 的 Archived Settings，回到 Measure 重存一次。

![Save 按钮保存平均 FRF 并命名 Campaign](/images/smart-hit-selection/fig15.png)

*（图源：网络官方公开资料）*

## 九、小结：开机前的五项清单

1. <strong>锤数三件套</strong>：Target impacts per hammer ≥ Maximum impacts > Minimum impacts；典型 10 / 6 / 3，挑锤余量就是保险。
2. <strong>硬剔除默认开</strong>：双击与过载自动剔除；过载锤不想上列表，再开 Auto reject with overload。
3. <strong>非线性结构才开峰值力带</strong>：目标力加上下阈值（如 4 N 正负 20%）；线性结构默认关闭即可，免得好锤被误伤。
4. <strong>挑锤尺子二选一</strong>：看曲线形状用两两相似度，看激励-响应线性关系用两两相干；Target Value 尽量高，100% 即只要最好的组合。
5. <strong>Save 才落地</strong>：平均 FRF 存进 Campaign、逐锤时域存进 Run；忘了 Save 就只能靠 Archived Settings 回滞补存。

一个容易忽略的细节：相似度/相干百分比要采满 Minimum 锤才显示。如果敲完 Target 数量仍然没有百分比，说明双击剔除后不足 Minimum，先检查操作手法与锤头选型，而不是降低 Target Value 掩盖问题。

来源：网络官方公开资料，经整理与复核。

## 一句话记住

多敲几锤、让算法挑：双击过载先剔、力级带宽再筛、最后按相似度或相干选最优组合进平均——Target 大于 Maximum、Minimum 保底，平均永远用当前最好的锤。

---

*作者：@NVH_Z · [NVH Test](https://www.nvhtest.cn/blog/) · 本文采用 [CC BY-NC-ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/deed.zh-Hans) 许可，禁止搬运*
