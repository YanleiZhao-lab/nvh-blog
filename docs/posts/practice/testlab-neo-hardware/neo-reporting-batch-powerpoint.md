---
title: "结果算完了，报告为什么还要手工贴图？——Testlab Neo Reporting 与批量报告"
author: "@NVH_Z"
---

# 结果算完了，报告为什么还要手工贴图？——Testlab Neo Reporting 与批量报告

> 数据算完了，最耗时的环节常常不是计算，而是出报告：240 张图一张张贴到深夜，而它们的版式其实只有一种。本文围绕 Testlab Neo 的报告体系，把自动化出报告拆开讲：Print 工具栏三个下拉框、带 Logo 的打印格式、Report 多页编组、批量报告的排序与分组，以及 Process Designer 流程末端的 PowerPoint 自动打印。

::: tip 30 秒速览
- **一句话**：两百多张格式一样的曲线，为什么还要一张张手工贴？
- **类比**：像证件照冲印——底片（数据）已拍好，冲印机（报告流程）按同一套模板连着出片，不必每张回暗房手工放。
- **关键数字**：240 条曲线手工贴约 6 小时，批量报告 22 分钟出全套——差 16 倍；每页并 8 条而非 4 条，页数从 60 压到 30。
- **结论**：版式做成一次性模板，数据靠排序与分组规则自动落页；换批数据只换数据，不动模板。
:::

## 一、为什么"贴图"是测试流程里最亏的一环

一个试验部门都熟悉的场景：耐久路面试验的数据处理完，8 个工况、5 个测点、3 个方向、2 个阶次切片，一共 240 条曲线块。分析流程其实早就自动化了——读入时历、切段、算谱、提阶次一条链跑完，晚饭前结果全部就绪，工程师还来得及下楼吃口饭。真正吞掉整晚的是接下来那道工序：把 240 条曲线逐张导出成图片、粘进 PowerPoint、拖到版心对齐、改图注、核对贴上去的到底是不是这一条曲线——工况编号差一位、方向选错、阶次张冠李戴，贴的时候都不会有任何报错，只有评审时才被人眼抓出来。按每条 90 秒的熟练速度（导出、插入、对齐、标注各约二十来秒），6 个小时就这样贴没了；第二天一早评审会前发现某个工况数据要重算，整套再贴一遍。而同一间办公室里，隔壁组用批量报告的同事六点半就交了报告下班了——同样的数据、同样的页数，差别只在工具。

这笔账的结构性事实是：**240 张图的版式只有一种**——标题栏、Logo、图幅、图注、配色，第 1 张和第 240 张长得一样，变的只是背后的数据块。把同一套动作人肉重复 240 次，机械、易错（贴错版本、贴漏工况、图注与数据对不上），而且每逢数据更新就要整套重来；评审会上最尴尬的一幕，往往就是有人在第 147 页发现那条曲线贴的是上一版数据。

自动化要解决的正是这个拆分：**版式做一次，数据自动落位**。人只负责两件事——把版式调到满意（做成可复用的模板）、把分组规则写清楚（哪些曲线落在同一页），剩下的落位、翻页、标注填充全部交给软件。这件事照相行业早就想明白了：底片冲印从来不是一张张手工放大的，而是冲印机按同一套模板连着出片——第二节会把这条类比对齐到报告系统。在那之前，先把机制的角色拆干净。这个公式回答的问题是：一页报告，到底由哪些东西拼出来的：

$$\text{Report} = F_{\text{format}}\big(D_{\text{query}};\ G_{\text{group}}\big)$$

报告等于打印格式 $F$（版式模板）作用在一批待报数据 $D$ 上，$G$ 是分组规则——决定哪些数据块落在同一页。后面三套机制（Print 工具栏、批量报告、流程末端自动打印）都是这行式子的不同入口：有的从显示区取 $D$，有的从数据列表取 $D$，有的让 $D$ 变成随流程自动更新的"查询"（Query），但三个角色永远不变。

## 二、证件照冲印：版式是冲印机，数据是底片

把报告系统想成一台**证件照冲印店**。客人带来的底片（数据块）各不相同——这张是 2 阶切片、那张是雨流矩阵——但冲印机（打印格式）只有一套：纸面尺寸、姓名字号、红底蓝底，早就调好了。换一批客人，机器一个螺丝都不用动。

冲印店的第二样东西是**排片单**（排序与分组）：240 卷底片按什么顺序冲、几张拼一张相纸，写在单子上——"按工况排序、每个测点 4 张拼一页"。改排片单不用拆机器，改分组规则不用改模板。本文后面讲的 Batch Reporting，核心就是这张排片单怎么写。

这个类比还有第三层：好冲印店都留**底片**。自动化报告输出的 PowerPoint 里的曲线不是"拍扁的截图"，而是可以做成活动图片（Active Picture）——双击还能缩放、读数、看背后的数据。底片（原始数据）永远在，相纸（报告页）随时可以按新模板重冲。后文每节都会回到这条主线：**模板定长相，分组定页数，底片永远留着**。

::: info 核心概念
**Print Format（打印格式）**：一份预先编辑好的 PowerPoint（或 Word）模板文件，规定了报告页的版式——Logo、标题字段、图幅大小、自动填充的标注属性（试验工程师、日期、频率分辨率等）；打印时数据按模板落位。

**Report（报告）**：Testlab 显示区里若干张图片（picture）的编组，一个 Report 打印成多页文档，一页一张图。

**Batch Reporting（批量报告）**：Testlab 传统界面的附加工作表（Add-in），把一批数据按"排序+分组"规则批量套用打印格式，一次生成多页报告。

**Query（查询）**：以"条件"而非"具体文件"形式定义的数据引用，换一批数据后查询自动指向新结果，是流程末端自动打印的基础。
:::

## 三、单图打印：Print 工具栏上的三个下拉框

先从最简单的动作说起。Testlab Neo 的 Print 工具栏分三组：**Report**（左侧红色区，新建/打开报告编组）、**Printing**（中间绿色区，管"打印什么、用什么格式、打到哪"）、**Print Options**（右侧蓝色区，管输出格式 Word 还是 PowerPoint、图片是活动图片还是静态图、设置取自显示还是模板）。

打印一张图（比如一张彩色图谱加阶次切片），只需要三个下拉框各选一项：

- **Print the** 选 *Picture*：打印当前显示区选中的那张图；
- **With** 选 *Automatic*：用默认格式；
- **To** 选 *file*：输出到文件，点 Print 后软件询问文件名与目录。

![Print 工具栏分 Report、Printing、Print Options 三组（图源：网络 侵删）](/images/neo-reporting-batch-powerpoint/nr-print-ribbon.png)

*图 1 Print 工具栏：左侧 Report 组、中间 Printing 组、右侧 Print Options 组（图源：网络 侵删）*

按 Print、存盘，一页 PowerPoint 就生成了——显示区里的彩色图谱与阶次切片原样落在页面上。这是"单张底片进、单张相片出"的最短路径，适合临时存证。

但 Automatic 格式不可控：页面上没 Logo、坐标轴字号偏小、没有项目信息。要控制长相，就得先做模板——选中这张图，点 Printing 组的 **New Print Format**，PowerPoint 会自动打开并生成一份与当前图配套的格式模板：在这里加公司 Logo、改图幅、放自动标注字段（在 PowerPoint 的 Add-ins 页签里点 New Field，可以把"试验工程师""日期""频率分辨率"这类属性位摆到页面上，打印时自动填充）。保存模板后，把 With 从 Automatic 换成 *Select a Print Format…*，选中刚存的模板再打印，出来的页面就带 Logo 与自动标注了。

![New Print Format 生成可编辑的 PowerPoint 格式模板（图源：网络 侵删）](/images/neo-reporting-batch-powerpoint/nr-new-print-format.png)

*图 2 选中图片后点 New Print Format，自动打开配套的 PowerPoint 模板供编辑（图源：网络 侵删）*

![套用自定义模板后：Logo、自动标注、更清晰的坐标轴（图源：网络 侵删）](/images/neo-reporting-batch-powerpoint/nr-logo-annotation.png)

*图 3 同一张图套用自定义打印格式后：公司 Logo、自动标注、坐标轴可读性都由模板控制（图源：网络 侵删）*

单图打印的关键认知是：**模板一旦存好就是资产**。下一个项目、另一种试验，只要图的类型相同，同一份格式文件直接复用——这正是第一节那个拆分（版式与数据分开）的最小实现。

## 四、多页报告：Report 编组与"一图一页"

单图打印一次只出一张。要出多页，先把显示区里的若干张图片编成一个 **Report**：在显示区新建多张图（每张图将来就是一页），点 Report 页签的下拉箭头，把它们归入同一个 Report。比如雨流矩阵、损伤值、自功率谱三张图编成"Report 1"。

打印时把 **Print the** 从 Picture 换成 *Report*，With 选模板、To 选 file，按 Print——三张图自动变成三页 PowerPoint，一页一图，每页都套同一个模板。页数随图片数自动增长，模板不用改。

![Report 1 编组包含雨流矩阵、损伤、自功率谱三张图（图源：网络 侵删）](/images/neo-reporting-batch-powerpoint/nr-report-group3.png)

*图 4 一个 Report 编组：雨流矩阵、损伤、自功率谱三张图将打印成三页（图源：网络 侵删）*

![Print the 切到 Report 即出多页（图源：网络 侵删）](/images/neo-reporting-batch-powerpoint/nr-print-the-report.png)

*图 5 Print the 从 Picture 切到 Report，三张图打印为三页（图源：网络 侵删）*

这条路适合"图片数量不多、内容由人挑"的中等规模报告。但注意它的页数上限是**显示区里手动摆好的图片数**——240 条曲线要 240 张图，显然不能走这条路。这就轮到批量报告出场了。

## 五、批量报告：排序定顺序，分组定页面

Batch Reporting 是传统 Testlab 界面（Advanced Desktop 附带，无需额外许可）里的一个附加工作表，专门解决"几百条曲线一次成册"。它的入口在 Tools 到 Add-ins，勾选 Batch Reporting 后，屏幕底部多出一个同名工作表。

![Tools 到 Add-ins 勾选 Batch Reporting（图源：网络 侵删）](/images/neo-reporting-batch-powerpoint/fig-addins.png)

*图 6 Batch Reporting 在 Add-ins 列表中勾选启用，附带于 Advanced Desktop、无需额外许可（图源：网络 侵删）*

操作骨架五步：把待打印数据加入 Input Basket；在 Batch Reporting 工作表左上"…"里把数据源设为 Input Basket，点 **Add to List** 把数据列成清单；点 **Load a Format** 套用打印格式（没有模板就先用 Navigator 的 Make Printformat 做一份）；把左下的 Reporting 从 *Current Group* 切到 **All**（这一步决定 Print 时出多页而不是单页）；最后 Print，软件逐组出页、自动生成多页文档。退出前用 **Save Template** 把整套设置存下来，下次同结构数据直接复用。

![Batch Reporting 工作表全貌（图源：网络 侵删）](/images/neo-reporting-batch-powerpoint/fig-batch-worksheet.png)

*图 7 Batch Reporting 工作表：左侧数据清单、中部格式与分组区（图源：网络 侵删）*

![Reporting 切到 All 才会出多页（图源：网络 侵删）](/images/neo-reporting-batch-powerpoint/fig-reporting-all.png)

*图 8 Reporting 从 Current Group 切到 All，Print 时生成多页报告（图源：网络 侵删）*

真正的灵魂在**分组（Grouping）与排序（Sorting）**两个概念上：

- **分组**：一个组 = 报告里的一页。同组的数据画在同一页上，组与组之间换页；
- **排序**：决定数据在清单里排队的先后，也就是组怎么形成的次序依据。

排片单靠元数据列来写：右键清单列头调出 Select Columns，把 Run 名、测点号（Point Id）、方向（Absolute direction，X/Y/Z 不带正负号）、Section 值（阶次号、频带）、函数类别（Autopower/Spectrum/Time）这些列加进来；然后**双击列头排序**——A、B、C 标出第一、第二、第三排序键。

![Select Columns 加入 Run 名、测点、方向等元数据列（图源：网络 侵删）](/images/neo-reporting-batch-powerpoint/fig-select-columns.png)

*图 9 Select Columns 对话框：把 Available 列移到 Selected，数据清单才有排序依据（图源：网络 侵删）*

![A、B、C 标出三级排序键（图源：网络 侵删）](/images/neo-reporting-batch-powerpoint/fig-sort-abc.png)

*图 10 双击列头排序，A/B/C 依次为第一、二、三排序键（图源：网络 侵删）*

分组在清单上表现为深浅相间的色带——相邻同色的一组数据将落在同一页。组开多大，完全由"哪几列参与分组"决定：组大小 4 可以是"同一工况、同一测点的 X/Y 两方向与 2 阶叠一页"；组大小 6 可以是"同一点、不同工况、不同阶次"；组大小 8 可以是"全部 2 阶、不同工况、全部方向"。把数据从清单里**同组内**拖到右侧格式预览的对应图位上，Print 时软件按组循环、同样的位置逐组填充，一套版式复制到每一页。

![组大小 4：同工况同测点 X/Y 两方向 2 阶一页（图源：网络 侵删）](/images/neo-reporting-batch-powerpoint/fig-group4.png)

*图 11 组大小 4：Body 与 Engine 两测点的 X/Y 两方向与 2 阶，同工况一页（图源：网络 侵删）*

![组大小 6：同测点、不同工况、不同阶次（图源：网络 侵删）](/images/neo-reporting-batch-powerpoint/fig-group6.png)

*图 12 组大小 6：同一点上叠不同工况、不同阶次（图源：网络 侵删）*

![组大小 8：全部 2 阶、不同工况、全方向（图源：网络 侵删）](/images/neo-reporting-batch-powerpoint/fig-group8.png)

*图 13 组大小 8：所有 2 阶曲线按工况与方向铺满一页（图源：网络 侵删）*

## 六、页数与工时的账：分组规则值多少时间

分组规则不是排版趣味题，它直接决定报告的物理页数与审阅体验。一页塞几条曲线（组大小 $g$）与总数据块数 $N$ 一起，按最简单的向上取整关系决定页数——这个公式回答的问题是：**N 条曲线、每页 g 条，报告到底多少页**：

$$N_{\text{pages}} = \left\lceil \frac{N}{g} \right\rceil$$

对第一节的耐久矩阵（8 工况、5 测点、3 方向、2 阶共 240 条曲线），组大小从 4 改到 8，页数从 60 页压到 30 页——纸面减半，而每页信息密度是否可读，取决于曲线本身的疏密，这要在模板的图幅设计阶段权衡（图幅大、每页曲线少，读得清但页数多；反之亦然）。

工时的账更直观。手工路径每条曲线按熟练操作 90 秒（导出、插入、对齐、标注）计；批量路径是 20 分钟一次性建设（模板 + 清单 + 排序分组）加约 2 分钟自动出报告。下面的演示把两本账一次算清。

<details>
<summary>数值实验：240 条曲线的页数账与工时账（14 行）</summary>

```python
import numpy as np
import math

runs, points, dirs, orders = 8, 5, 3, 2      # 工况 × 测点 × 方向 × 阶次
N = runs * points * dirs * orders            # 待报告曲线块总数
print("曲线块总数 N =", N)
for g in (4, 6, 8):                          # 三种组大小 = 三种"每页几条"的排版
    print(f"  组大小 g={g}: {math.ceil(N/g)} 页")

t_manual = N * 90 / 60                       # 手工：每条曲线 90 s
t_batch  = 20 + 2                            # 批量：20 min 搭建 + 2 min 自动出册
print(f"手工 {t_manual:.0f} 分钟 = {t_manual/60:.1f} 小时；"
      f"批量 {t_batch} 分钟 -> {t_manual/t_batch:.0f} 倍")
print(f"1% 贴错率在 {N} 条曲线上的期望 = {0.01*N:.1f} 条")
```

</details>

运行结果：240 条曲线，组大小 4/6/8 分别对应 60/40/30 页；手工 360 分钟（6.0 小时）对批量 22 分钟，**16 倍差距**；即便只有 1% 的手工贴错率，240 条里的期望也有 2.4 条——每 100 页平均 1 页带着贴错的曲线版本，而这在评审会上几乎必然被发现。注意这笔账的前提是"版式统一"：如果 240 张图要 240 种版式，任何自动化都无能为力——报告自动化的边界，就是版式标准化的边界。

## 七、流程末端自动打印：跑完流程即出报告

前面的路径都以“人点 Print”收尾。最后一级自动化把 Print 这一步也省掉：在 Testlab Neo Process Designer 里，把 PowerPoint 打印格式**耦合（Couple）**到处理流程上，流程跑完、报告自动生成。这个功能需要 Testlab Neo 2606 及以上版本。

路线上有七个步骤，可归成三段：

**第一段：备料（处理数据 + 建 Report）。** 在 Process Designer 的 Process 页签里搭好处理流程（谱分析、阶次提取等，按需加载相应 Add-in），跑通后从 Active Analysis 取结果。然后在显示区建一个 Testlab Report——多张图、每张将来一页。图可以先在 Preview 显示里调好，点 Preview 页签的下拉箭头选 **Add Picture to new Report** 直接转正；也可以点绿色加号逐张新建（FrontBack、Waterfall 等类型任选）。

**第二段：让数据“可查询”（Queryable）。** 这是流程末端打印与手工打印的本质区别：图里的数据不是某条具体曲线，而是一条**查询**。在 Display 页签把取数模式从 Regular Data 切到 **Data as Queries**，再把数据从 Active Analysis 拖进图里——图例上曲线名旁出现一个小小的“Q”，就说明这条曲线是“按条件定义”的：下次流程处理新数据时，Q 自动指向新结果，图和报告随之更新。从既有 run 里取的图也可以用 Edit Queries 把数据源改指到 Active Analysis（注意此工作流暂不支持 Run 属性，需把 Run 与 Section 属性从查询里去掉）。

![Display 页签切到 Data as Queries（图源：网络 侵删）](/images/neo-reporting-batch-powerpoint/fig-data-as-queries.png)

*图 14 Display 页签把取数模式切换为 Data as Queries，之后放入显示的数据都以查询形式定义（图源：网络 侵删）*

![从 Active Analysis 拖数据进显示（图源：网络 侵删）](/images/neo-reporting-batch-powerpoint/fig-drag-active-analysis.png)

*图 15 把 Active Analysis 的处理结果拖放进显示区（图源：网络 侵删）*

![图例中的 Q 标记曲线为查询数据（图源：网络 侵删）](/images/neo-reporting-batch-powerpoint/fig-legend-q.png)

*图 16 曲线名旁的小“Q”表示这条曲线按查询定义，流程跑新数据后自动更新（图源：网络 侵删）*

**第三段：耦合格式并自动打印。** 点 Report 区 PowerPoint 图标的下拉菜单，先 **New Print Format** 做一份流程报告模板（与第三节同法：编辑母版、加 Logo、摆标注字段），然后在同一菜单勾选 **Assign to Process** 与 **Auto Print after Processing**——PowerPoint 图标出现在报告页签旁，格式已与流程绑定。选一批新数据，点 Run；跑完后点状态栏的 **Accept**，PowerPoint 自动生成并打开，Q 查询的数据按模板落进每页图里。

![Assign to Process 与 Auto Print after Processing（图源：网络 侵删）](/images/neo-reporting-batch-powerpoint/fig-assign-to-process.png)

*图 17 勾选 Assign to Process 与 Auto Print after Processing，打印格式与流程绑定（图源：网络 侵删）*

![跑完流程点 Accept 自动生成 PowerPoint（图源：网络 侵删）](/images/neo-reporting-batch-powerpoint/fig-accept.png)

*图 18 流程运行结束后点 Accept，报告在新的 PowerPoint 实例中自动生成（图源：网络 侵删）*

![自动填充数据的最终 PowerPoint 报告（图源：网络 侵删）](/images/neo-reporting-batch-powerpoint/fig-final-ppt.png)

*图 19 生成的 PowerPoint：每页图的数据都来自 Q 查询，随每次流程运行自动填充（图源：网络 侵删）*

要改格式时注意：格式一旦耦合，图不能直接编辑——先在同一菜单 **Decouple Print Format** 解绑，改完图后以新名字再存一份格式，再 Couple Print Format 重新绑定。解绑、改名重存、再绑，是模板迭代的固定节奏。
## 八、避开四个坑

::: warning 现场易踩的四个坑
- **Reporting 忘切 All**：Batch Reporting 左下停在 Current Group 时，Print 只出当前组一页——240 条曲线打出 1 页，先查这个开关；
- **拖图跨组**：往格式预览里拖数据必须**同组内**拖放；跨组拖放会让“逐组复制版式”的对应关系错乱，出来的页面数据张冠李戴；
- **耦合后直接改图**：格式耦合期间图不可编辑，改模板前先 Decouple，改完以新名重存再 Couple——直接在耦合状态改图会静默失效；
- **Preview 图忘了换 Q 数据**：Preview 转 Report 的图里是具体数据不是查询，不替换成 Data as Queries 的数据，下次跑流程报告不更新。
:::

## 九、一套递进的报告自动化路线

把三套机制放回一条线上看，它们是同一个思想（版式与数据分离）的三级放大：Print 工具栏单图与 Report 多页打印解决“十张以内、人挑内容”；Batch Reporting 解决“几百条曲线、按元数据规则成册”——排序定顺序、分组定页面，一份 Save Template 反复用；流程末端自动打印解决“流程本身可重复”的场景——数据变成 Q 查询，跑完流程即出报告，报告从“交付物”变成流程的“副产物”。往前看，Q 查询依赖的元数据（Run 名、测点、方向、阶次）质量决定了它能自动化到什么程度——这正是采集端命名规范与数据检索话题的入口。

## 一句话记住

版式做成模板、数据靠排序分组自动落页——240 条曲线 22 分钟成册；流程末端的 Q 查询让报告随每次运行自动更新，贴图这件事，本就不该由人来做。

---

*来源：网络公开资料，经整理与复核；图片版权归原作者所有，侵删。*

*作者：@NVH_Z · [NVH Test](https://www.nvhtest.cn/blog/)*
