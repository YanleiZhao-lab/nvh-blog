# 博客文章

这里是 NVH 工程研究博客，文章涵盖研究笔记、工程案例和测试方法。

## 理论基础

- [量化与量程：ADC 位数如何决定动态范围](./theory/gain-range-quantization.html) — bin size = 量程/2^位数，信号占量程比例决定可用台阶数，增益在 ADC 前把信号顶到满量程，电平指示条与自动量程的设置判据

- [dB 与对数刻度：为什么声学量都用分贝](./theory/decibel-basics.html) — 分贝不是单位而是对数比值，功率类 10 lg 与幅值类 20 lg 的区别、参考值、能量叠加与 A 计权

- [谱与自功率谱的区别](./theory/spectrum-vs-autopower.html) — 只差一个复共轭乘法：Spectrum 保相位、Autopower 消相位，多帧平均时一个幅值衰减一个稳定收敛，ODS 等既要相位又要平均的场合用相位参考谱

- [混叠：采样定理的工程代价与抗混叠滤波器](./theory/aliasing.html) — 高于带宽的频率镜像折叠成假低频，Span 只有 80% 带宽，带宽按关心频率的 1.25 倍设置

## 操作实践

（测试软件操作、数据处理技巧，持续更新）

- [RPM 信号去毛刺：转速信号的清洗](./practice/rpm-spike-removal.html) — 偶发尖峰用 Time Data Editor 手动替换，每转规律毛刺用 TACHO 统计剔除函数，参数含义与选择依据

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
