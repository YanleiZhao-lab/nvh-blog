---
title: "用户自定义敲击序列：多锤/多点的组织"
---

# 用户自定义敲击序列：多锤/多点的组织

> 同样是"3 只加速度计、15 个测点、5 轮搬家"的平板锤击模态，有人一轮敲完点一下按钮，软件就自动跳到下一组测点；有人却得每敲完一轮回软件里手改一遍 Point ID，改漏一处整批数据串行。差别不在手速，在序列表。本文把敲击序列比作剧组的**分镜表**——哪场戏、哪台机位、拍几条，开机前全部排死，场记按表翻页——讲清 Testlab 默认"+1"递增什么时候够用、什么时候会把测点表带进沟里，以及 User Defined Impact Sequence（用户自定义敲击序列）如何用一张表管住多锤、多点的推进节奏。

## 一、为什么需要自定义序列：默认"+1"不认识你的布点图

先看一个最常见的现场场景。一块平板布了 15 个测点，手里只有 3 只单向加速度计。计划是"定点锤击 + 游动加速度计"：锤子每轮都敲 1 号点当固定参考，3 只加速度计整组下移——第 1 轮贴红色位置（1、2、3 号点），第 2 轮贴黄色（4、5、6 号），第 3 轮贴绿色……5 轮正好贴完 15 个点。

![平板的几何与布点：共定义 15 个测点，3 只加速度计分 5 轮贴完](/images/impact-sequence-defined/fig1-geometry-15points.png)

*（图源：Siemens Simcenter Testing Knowledge Base）*

![期望的敲击序列：每轮锤固定敲 plate:1，三只加速度计整组步进三个点](/images/impact-sequence-defined/fig2-desired-sequence.png)

*（图源：Siemens Simcenter Testing Knowledge Base）*

问题出在软件的默认行为上。Testlab 的递增按钮（increment button）默认按"数值 +1"推进：每敲完一轮，每只加速度计的 Point ID 自动加 1。于是第 1 轮测 1/2/3 号点，第 2 轮变 2/3/4 号，第 3 轮 3/4/5 号……5 轮下来只覆盖 7 个点，其中 8 次是重复测量，8 到 15 号点根本没有数据。把账摆开（第四节用 numpy 复算）：

| 序列 | 覆盖测点 | 重复测量 | 缺测 |
| --- | --- | --- | --- |
| 默认 +1 递增 | 7 / 15 | 8 次 | 8~15 号点 |
| 自定义整组步进 3 | 15 / 15 | 0 次 | 无 |

![默认的数值递增序列：每轮每通道 +1，5 轮后大量测点缺测](/images/impact-sequence-defined/fig3-default-increment.png)

*（图源：Siemens Simcenter Testing Knowledge Base）*

注意这不是软件缺陷——"+1"是为"单表逐点顺次推进"这类简单场景设计的默认值；它只是不认识你的布点图。布点一"跳跃"（整组步进、隔点跳测、多锤分工），就得自己写分镜表，这正是 User Defined Impact Sequence 的用途（Simcenter Testlab 16 及以后版本提供，旧称 LMS Test.Lab）。

## 二、序列背后的账本：一轮敲击买来 FRF 矩阵的多少格

分镜表排什么，取决于每场"戏"能买到多少数据。这一节把账算清楚。

下面这个公式回答的问题是：一次锤击到底测到了什么。其中 $X_i$ 是 $i$ 号测点的响应（加速度），$F_j$ 是 $j$ 号点的锤击力——一条 FRF 占的是 FRF 矩阵里的一个格子。

$$
H_{ij}(f) = \frac{X_i(f)}{F_j(f)}
$$

锤击模态的两种组织方式由此分家（LMS 理论手册）：**游动锤击**（roving hammer）——加速度计不动、锤子逐点游走，每敲一点补齐一列；**定点锤击 + 游动加速度计**——锤固定在一个参考点，加速度计搬家，每轮补齐参考列的几行。两者测到的是同一批函数，依据是下面的互易关系。

这个公式回答的问题是：为什么"锤动表不动"和"表动锤不动"可以互相替代。其中 $H_{ij}$ 与 $H_{ji}$ 对应物理里的 Maxwell-Betti 互易原理——线性结构上换激励点与响应点，传递函数不变。

$$
H_{ij}(f) = H_{ji}(f)
$$

于是本文场景的账本就三行：锤固定 1 号点，目标是凑齐参考列全部 15 行；每轮 3 只表贡献 3 行；需要 5 轮。写成通用的覆盖条件——

这个不等式回答的问题是：几轮、几只表，才够把布点图盖满。其中 $N_{run}$ 对应物理里的搬运轮数，$N_{ch}$ 是同步采集的响应通道数（多锤时每个锤通道同理各占一格输入）。

$$
N_{run} \times N_{ch} \;\ge\; N_{point}
$$

再加上工作量：总敲击数 $N_{hit} = N_{run} \times N_{avg}$，每轮通常敲 3~5 锤取平均，本例 $5 \times 5 = 25$ 锤。这张表机制上对多锤同样成立——两把锤分别固定在两个参考点时，Edit Points 表里每轮给两个锤通道各指定一个固定点即可，账本按输入通道数再开一列。

::: info 核心概念
- **游动锤击（roving hammer）**：锤逐点游走、传感器固定的锤击试验组织方式，每敲一点补 FRF 矩阵一列
- **游动加速度计（roving accelerometer）**：锤固定参考点、传感器分轮搬家的组织方式，靠互易性获得等价的一列
- **递增按钮（increment button）**：Testlab 测量界面上推进到下一轮测点的按钮，默认按数值 +1，自定义序列后按表推进
:::

一张警示牌：序列表救不了选错的参考点。若 1 号点恰好落在某阶关心模态的节点附近，该模态在这整列 FRF 里都会缺席——留数正比于激励点的振型投影。开表之前先做驱动点查勘，把参考点放在关心模态都有明显响应的位置。

## 三、Testlab 实操：从 All Settings 到 Edit Points

完整路径四步（Testlab 16+）：

1. **开通道**：Channel Setup 里打开实际使用的通道数——本例 1 个力锤 + 3 只单向加速度计。

![Channel Setup：确认 1 锤 + 3 表共 4 个通道已打开](/images/impact-sequence-defined/fig4-channel-setup.png)

*（图源：Siemens Simcenter Testing Knowledge Base）*

2. **开开关**：Measure 工作表点 **All Settings**，在弹出窗口勾选 **User Defined Increment Sequence**，关窗。

![Measure 工作表的 All Settings 入口](/images/impact-sequence-defined/fig5-all-settings.png)

*（图源：Siemens Simcenter Testing Knowledge Base）*

![All Settings 窗口：勾选 User Defined Impact Sequence](/images/impact-sequence-defined/fig6-all-settings-window.png)

*（图源：Siemens Simcenter Testing Knowledge Base）*

3. **填分镜表**：回到 Measure 界面点 **Edit Points…**，逐轮填入：每轮 hammer 固定 plate:1，三只表的 Point ID 与 Direction 按 1-2-3、4-5-6……填满 5 轮。

![Measure 界面的 Edit Points 入口](/images/impact-sequence-defined/fig7-edit-points.png)

*（图源：Siemens Simcenter Testing Knowledge Base）*

![Edit Points 窗口：逐轮填入锤与各加速度计的测点和方向，自定义序列就在这里写](/images/impact-sequence-defined/fig8-edit-points-window.png)

*（图源：Siemens Simcenter Testing Knowledge Base）*

4. **照表翻场**：此后每敲完一轮，按递增按钮，软件按表推进到下一组测点——不再 +1，而是你排的下一场戏。

![按递增按钮后，测点按自定义序列整组推进](/images/impact-sequence-defined/fig9-increment-button.png)

*（图源：Siemens Simcenter Testing Knowledge Base）*

## 四、numpy 对账：覆盖与工时

```python
import numpy as np

# 15 测点、3 只加速度计、5 轮：默认 +1 递增 vs 自定义整组步进
pts = np.arange(1, 16)
ch = np.array([1, 2, 3])                      # 第 1 轮三只表的位置

default = [ch + i for i in range(5)]          # 默认：每轮每通道 +1
custom  = [ch + 3 * i for i in range(5)]      # 自定义：整组步进 3

for name, runs in [("默认+1", default), ("自定义", custom)]:
    cov = np.unique(np.concatenate(runs))
    dup = sum(map(len, runs)) - len(cov)      # 重复测量次数
    print(f"{name}: 覆盖 {len(cov)}/15 点 | 重复 {dup} 次 | "
          f"缺测 {np.setdiff1d(pts, cov)}")

# 工时：搬表 3 min/轮、每击 0.5 min、手改标签多花 1 min/击（每轮 5 击）
base = 5 * (3 + 3 * 0.5)                      # 搬家 + 敲击的公共时间
print("总敲击数 =", 5 * 5, "| 一键流转 ≈", base + 25 * 0.5,
      "min | 逐击手改 ≈", base + 25 * 1.5, "min")
```

实测输出（numpy 2.4.6）：

```text
默认+1: 覆盖 7/15 点 | 重复 8 次 | 缺测 [ 8  9 10 11 12 13 14 15]
自定义: 覆盖 15/15 点 | 重复 0 次 | 缺测 []
总敲击数 = 25 | 一键流转 ≈ 35.0 min | 逐击手改 ≈ 60.0 min
```

同一块板、同样的 25 锤：默认 +1 有 8 轮白敲、8 个点没测；自定义序列全点覆盖、零重复，工时账上还省下逐击改标签的 25 分钟。分镜表的价值就是把这两笔账在开机前算清，而不是数据回来对不上几何时才发现。

## 五、工程检查单

1. **布点图先于序列表**：先定几何与分组搬运方案，再把它翻译成 Edit Points 的逐轮表；表要满足 $N_{run} \times N_{ch} \ge N_{point}$ 且重复为零。
2. **参考点先做驱动点查勘**：固定敲击点避开关心模态的节点，否则整列 FRF 集体失踪，序列表无法补救。
3. **Direction 逐轮填**：三向表换贴点时方向随位置变，只改 Point 不改 Direction 是串数据的常见源头。
4. **默认 +1 不是敌人**：单表、测点编号连续顺推的小试验，默认递增仍然最快；布点一跳跃再上自定义序列。
5. **多锤照同一张表办**：两把锤各占一个输入通道，Edit Points 里每轮各指定固定点，覆盖条件按输入通道相应扩账。

## 一句话记住

敲击序列就是锤击试验的分镜表：默认 +1 只会顺号翻页，布点一跳跃就丢点；用 User Defined Impact Sequence 把"哪轮、哪个锤、哪些表"开机前排死，轮数乘通道数盖满测点再开工。
