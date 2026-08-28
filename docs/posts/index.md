# 博客文章

这里是 NVH 工程研究博客，文章涵盖研究笔记、工程案例和测试方法。

## 理论基础

- [希尔伯特变换与包络分析：轴承故障诊断核心](./theory/hilbert-envelope.html) — 轴承冲击藏在结构共振里，直接 FFT 看不到故障频率：带通锁载波、希尔伯特 90 度相移造解析信号取模得包络，包络谱 200 Hz 一击即中；外圈 BPFO 无边带、内圈带转频边带、滚动体带保持架边带的判读表，冲激量与峭度做趋势管理

- [互功率谱与互相关：两个信号的因果关系](./theory/cross-spectrum.html) — 双通道分析的地基：互相关在时域量相似性、互谱在频域存幅值与相位，一对傅里叶变换；互谱高不等于因果强（输出共振也会抬高互谱），判因果靠相干；-9.5 dB 信噪比下互相关峰仍锁定 4.88 ms 传播延迟、共振前后互谱相位从 -8 度翻到 -170 度的 numpy 复现

- [相干函数：测量质量的照妖镜](./theory/coherence-function.html) — γ²=|Sxy|²/(Sxx·Syy) 逐频率审计 FRF 可信度：常相干/重相干/偏相干/虚拟相干四种各管什么，低相干五大嫌疑人按频率排查，200 Hz 共振峰相干 0.997 而漏测振源频段塌到 0.03 的 numpy 复现

- [A计权：为什么 40 方等响曲线成了标准](./theory/a-weighting.html) — 40 方等响曲线的工程化身：1 kHz 零点、低频重罚、1 k~6 kHz 微放；总值在能量域合成，低频源掉 20 dB 而啸叫反涨 1 dB，dBA 对低频偏乐观，低频问题须配 Linear/C 计权交叉判读

- [倍频程：人耳的频率分辨与计权](./theory/octaves-hearing.html) — 频率轴从物理等间距换成听觉等间距：带宽逐带翻倍、白噪声每带涨 3 dB；滤波法倍频程不是 FFT 分组求和，A 计权 1 kHz 零点低频重罚，dBA 对低频源偏乐观

- [声压、声功率、声强：三个量到底什么区别](./theory/pressure-power-intensity.html) — 暖房类比讲透三个量：声压是某点的温度、声功率是暖气瓦数、声强是有方向的热流；Lw 恒 103 dB 而声压每倍距掉 6 dB，验收条款必须写清是哪个量的 dB

- [声学量Q：体积加速度的物理意义](./theory/acoustic-quantity-q.html) — 声学系统的"力"：面积×加速度的面积分，高频相位相消要求细分区；Q-source 互易法靠 P/F≡A/Q（均为 1/m²）把 12 次敲击合成 1 次测量，标定单决定通道设置

- [量化与量程：ADC 位数如何决定动态范围](./theory/gain-range-quantization.html) — bin size = 量程/2^位数，信号占量程比例决定可用台阶数，增益在 ADC 前把信号顶到满量程，电平指示条与自动量程的设置判据

- [dB 与对数刻度：为什么声学量都用分贝](./theory/decibel-basics.html) — 分贝不是单位而是对数比值，功率类 10 lg 与幅值类 20 lg 的区别、参考值、能量叠加与 A 计权

- [谱与自功率谱的区别](./theory/spectrum-vs-autopower.html) — 只差一个复共轭乘法：Spectrum 保相位、Autopower 消相位，多帧平均时一个幅值衰减一个稳定收敛，ODS 等既要相位又要平均的场合用相位参考谱

- [混叠：采样定理的工程代价与抗混叠滤波器](./theory/aliasing.html) — 高于带宽的频率镜像折叠成假低频，Span 只有 80% 带宽，带宽按关心频率的 1.25 倍设置

- [功率谱密度 PSD：随机信号为什么必须用它](./theory/psd-explained.html) — Autopower 幅值随分辨率变化，除以 Δf 后随机数据可跨分辨率对比；正弦信号正好相反，谐波幅值判读用 Autopower

- [窗函数修正系数：幅值校正 vs 能量校正](./theory/window-correction-factors.html) — 汉宁窗把谱峰压低一半，幅值系数 2.00 与能量系数 1.633 只能二选一：读谱峰用幅值校正、算 RMS 用能量校正，Testlab 的 RMS 计算永远在后台用能量校正值

- [RMS 与总级：从时域到频域的能量守恒](./theory/rms-overall-level.html) — 谱的 RMS 就是总级：谱线平方和开根号，Parseval 定理保证时域频域对得上；手动复算须核对线性单位、RMS 格式、能量校正三件事，Peak 格式硬算偏大 3 dB
- [吉布斯现象：为什么陡峭滤波器会振铃](./theory/gibbs-phenomenon.html) — 时域突变需要无限带宽，实测必然截断，边沿就留下约 9% 的振铃过冲：截断量决定振铃时长、滤波器陡度决定振铃幅度，压振铃要靠缓滚降 Bessel 而不是加带宽

- [隔声量测量：传声损失TL的实验室方法](./theory/sound-transmission-loss.html) — TL = 10 lg(Wi/Wt) 且强依赖频率；3% 裸露或 1% 开孔就能把 30 dB 材料打到 20 dB 以下，"第一个洞最贵"；阻抗管两负载法测消声器管路、双室声强法测前壁板顺带拿泄漏云图、双混响室声压法测建筑规范件
- [声吸收：吸声系数与混响室法](./theory/sound-absorption.html) — α 逐频率才有意义：多孔材料高频好用、低频受限于λ/4 法则（63 Hz 需 1.36 m 厚）；四分之一波长处质点速度最大、摩擦吸声最强，空腔等效加厚；阻抗管垂直入射 vs 混响室随机入射两套数据不能互换，Sabine 式 A = 0.16V/T 两步相减得样品吸声量
- [自由场与扩散场：近场远场的工程划分](./theory/sound-fields.html) — 声场类型决定数据怎么解读：近场/远场以 2 倍波长为界，63 Hz 要离源 10.9 m 才进远场，低频布点 0.5 m 处测的是环流污染数据；自由场零反射、每倍距离降 6 dB 可外推，扩散场各处声级一致但净声强为零——声强法在强混响环境失灵是物理不是仪器问题

- [噪声认证标准怎么选：从指令到测法的决策链](./theory/noise-certification-standards.html) — 指令定类别、C 类标准定工况、基础标准定测法三层决策链：声压法要特定声学环境但认证主流，声强法任意声场可测但频带受限；K1/K2 是限值内的补救而非透支，背景级差 15 dB 修正量仅 0.14 dB 这条判据的物理依据

- [扭转振动：旋转机械的隐藏自由度](./theory/torsional-vibration.html) — 角速度围绕稳态转速的交变波动：1 PPR 测不到它，PPR 至少取最高关心阶次 2 倍（欠采样折叠出假阶次而非消失）；点火阶次主导、低转速扭振更大，扭振阶次与 DRE 噪声阶次叠图对峰即可锁定曲轴共振
- [动平衡：静平衡、耦合平衡与动平衡](./theory/balancing-static-dynamic.html) — 质量轴与旋转轴的三种错位关系定校正平面数：平行错开是静不平衡单面可解，相交是耦合不平衡必须双面，既不平行又不相交是最常见的动不平衡；离心力 F=U·w² 转速翻倍力翻四倍，12000 rpm 下 10 gm·cm 偏置的离心力达自重 1600 倍，平衡机两面配重"不同相不反相"是静+耦合分量矢量叠加的正常数据

- [阶次：转频与振动频率的桥梁](./theory/whats-an-order.html) — 每转事件数相对参考轴之比：皮带速比 3 即 3 阶、86 齿啮合即 86 阶、六缸四冲程燃烧恒为 3 阶（缸数/2，与转速无关）；频率=阶次×rpm/60，colormap 上斜线是阶次、竖线是共振，交点即问题转速

## 操作实践

（测试软件操作、数据处理技巧，持续更新）

- [彩色图谱判读：colormap 的正确打开方式](./practice/interpreting-colormaps.html) — 五种线型五种病：斜线是阶次、水平线是共振、边带暴露调幅、竖条带是冲击、不穿零曲线族是 PWM 开关频率；交点即问题转速
- [RPM 信号去毛刺：转速信号的清洗](./practice/rpm-spike-removal.html) — 偶发尖峰用 Time Data Editor 手动替换，每转规律毛刺用 TACHO 统计剔除函数，参数含义与选择依据
- [逐循环平均：发动机工况数据处理](./practice/cycle-cycle-averaging.html) — 先到角域再谈统计：Free Run (angle) 切 720° 循环、Map Statistics AD 算平均包络、Cyl Offset 多缸对齐、Frame Statistics 门区抓每循环峰值
- [三向加速度计通道设置技巧](./practice/triaxial-channel-tricks.html) — 三招官方技巧防飞点：Auto Fill 拖拽批量填 PointId/Direction、V-24 单线三向头结构上杜绝接错线、MultiChannel 设 Triax-RH 强制右手系；附评论区隐藏大坑——Direction 只是标签不翻极性，标 -X 必须同时给灵敏度取负，RMS 查不出而方向投影一测就露馅的 numpy 复现
- [Time Signal Calculator：时域公式处理实用技巧](./practice/time-signal-calculator-tips.html) — 公式表串起数据后天补救：滤波函数 Sample Frequency 只管预览、积分前先高通防漂、8 Hz 方波造虚拟转速通道喂给 HARMONIC_FILTER 扣定频谐波族，MAD 统计剔毛刺的 numpy 复现

- [谐波去除：从信号中剥离已知干扰](./practice/harmonic-removal.html) — 不滤波而是先估计再减：角域循环平均只留同步成分、非同步成分被平均掉，四步算法剥掉 zebra 盘偏心假 1 阶、多旋转部件阶次归属、8 Hz 电力谐波定频污染；六参数表与相位差 360 度乘阶次小数部分的 numpy 复现
- [矢量合成：把三向振动变成一个可读数](./practice/vector-sum.html) — 逐谱线对 XYZ 三向做平方和开根号得到与方向无关的总量级：5/7/12 g 合成 14.76 g 且被大分量锁死；顺序坑的 numpy 实证——先 FFT 再合成谱线干净，时域取模后 FFT 造出 3.38 g 直流和 60/160 Hz 假线而总 RMS 分毫不差；Signature Derived 标签 VECTOR_SUM 与 Neo Block Calculate vectorsum 两条设置路径

## 研究笔记

- [NVH 指标体系与工程解释](./research/nvh-metrics.html) — 响度、尖锐度、粗糙度等指标的完整工程解释
- [模态试验与 CAE 对标怎样组织验证记录](./research/cae-validation.html) — CAE 模型验证流程、MAC 相关性分析与报告结构
- [论文复现实验记录模板](./research/paper-template.html) — 结构化的论文复现笔记模板，含参数清单与偏差分析
- [专业 NVH Skill 与 MCP 服务的边界规划](./research/mcp-boundary.html) — 通用 AI 与专业 NVH 工具的职责划分
- [站群建设记录：从内容前台到工程社区](./research/site-roadmap.html) — 站群架构演进、部署方式与服务边界

## 测试方法

- [FFT 窗函数选择](./testing/fft-window-functions.html) — 从频谱泄漏出发对比四种常用窗函数
- [FFT 基础流程：从采样率到谱线解释](./testing/fft-flow.html) — 采样率、抗混叠、加窗、平均与谱线判读
- [传感器与采样配置检查](./testing/sensor-checklist.html) — 加速度计、麦克风、采样率配置检查清单
