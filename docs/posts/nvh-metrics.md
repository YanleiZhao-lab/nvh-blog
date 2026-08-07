---
title: "NVH指标体系与工程解释"
---

# NVH指标体系与工程解释

> NVH（Noise、Vibration、Harshness）是汽车、机械、消费电子等领域衡量产品声振品质的核心工程体系。本文整理常用 NVH 指标的定义、计算方法和工程含义，供日常分析参考。

## 一、客观指标 vs 主观指标

NVH 评价分为两大类：

| 类别 | 指标示例 | 特点 |
| --- | --- | --- |
| **客观指标** | 声压级 SPL、阶次、频谱 | 可仪器测量，数值可复现 |
| **心理声学指标** | 响度、尖锐度、粗糙度 | 基于人耳感知模型，半客观 |
| **主观评价** | 烦扰度、偏好评分 | jury test，统计学分析 |

::: tip 工程建议
单一指标无法完整描述 NVH 问题。建议以客观指标定位问题频率/来源，以心理声学指标评估感知严重度，以主观评价验证最终效果。
:::

## 二、声学基础指标

### 2.1 声压级（SPL）

声压级是最基础的声学量，单位为分贝（dB）：

```python
import numpy as np

# 计算声压级
def calc_spl(rms_pressure, ref_pressure=20e-6):
    """计算声压级 SPL (dB)
    rms_pressure: 声压有效值 (Pa)
    ref_pressure: 参考声压 20 μPa (空气中)
    """
    spl = 20 * np.log10(rms_pressure / ref_pressure)
    return spl

# 示例：1 Pa 的声压对应 94 dB
p_rms = 1.0
print(f"SPL = {calc_spl(p_rms):.1f} dB")
# 输出: SPL = 94.0 dB
```

### 2.2 倍频程分析

将宽带噪声按倍频程或 1/3 倍频程划分，是噪声标准限值最常用的表达方式：

| 倍频程中心频率 (Hz) | 范围 | 典型关注场景 |
| --- | --- | --- |
| 31.5 | 22–44 | 低频轰鸣 |
| 125 | 89–141 | 发动机怠速 |
| 500 | 354–707 | 路面噪声主能量 |
| 2000 | 1414–2828 | 高频啸叫 |

## 三、心理声学指标

### 3.1 响度（Loudness, sone）

响度考虑了人耳对不同频率的非线性灵敏度（等响曲线），单位为 **sone**。1 sone = 40 phon 的响度感知。

::: info 算法标准
响度计算通常遵循 **ISO 532-1**（Zwicker 方法）或 **ISO 532-2**（Moore-Glasberg 方法）。工程中以 Zwicker 方法最常用。
:::

### 3.2 尖锐度（Sharpness, acum）

尖锐度描述高频成分在频谱中的突出程度，单位为 **acum**。1 acum 对应中心频率 1 kHz、带宽 160 Hz、声压级 60 dB 的噪声信号的尖锐度。

```python
# 尖锐度的简化示意（实际需按 Zwicker 特定响度积分）
def sharpness_simplified(specific_loudness, center_freqs):
    """尖锐度简化计算
    N': 特定响度 (sone/Bark)
    z:  临界频带率
    """
    z = center_freqs  # 简化为 Bark 坐标
    total_loudness = np.trapz(specific_loudness, z)
    weighted = np.trapz(specific_loudness * z * 0.11 * np.exp(z), z)
    return weighted / total_loudness
```

### 3.3 粗糙度（Roughness, asper）

粗糙度反映幅值调制（AM）带来的感知，单位为 **asper**。调幅频率在 20–300 Hz 范围时人耳对粗糙度最敏感。

::: warning 注意
粗糙度的计算尚未有 ISO 统一标准，不同软件（HEAD acoustics、Siemens）算法有差异，跨工具数值不可直接对比。
:::

## 四、振动指标

### 4.1 振动总量级（Overall Vibration Level）

```text
振动速度均方根:
    v_rms = sqrt( (1/T) * ∫ v²(t) dt )

振动级 (dB):
    Lv = 20 * log10( v_rms / v_ref ),  v_ref = 10⁻⁹ m/s
```

### 4.2 阶次分析

对于旋转机械，阶次分析是 NVH 排查的核心工具：

| 阶次 | 典型来源 | 工程含义 |
| --- | --- | --- |
| 1× | 不平衡、偏心 | 基频同步振动 |
| 2× | 不对中、联轴器 | 2 倍频 |
| 齿数× | 齿轮啮合 | 高频啮合冲击 |
| 叶片数× | 风扇/泵 | 流体脉动 |

::: danger 常见错误
阶次分析必须基于准确的转速信号（tacho / 编码器）。若用估计转速（free-run），阶次会"涂抹"，导致误判来源。
:::

## 五、指标关联性速查

::: tip 经验对照（供初步判断）
- 响度增加 10 sone，主观感知约"响一倍"
- 纯音尖锐度突出时，即使声压级不高也容易引起烦扰
- 粗糙度 > 0.75 asper 时，通常能感知到"刺耳/颤动"
:::

## 六、参考标准

- **ISO 532-1/2** — 响度计算方法
- **ISO 1996** — 环境噪声描述与测量
- **GB/T 18697** — 声学 汽车车内噪声测量方法
- **DIN 45681** — 尖锐度计算

---

> 本文为研究笔记，指标阈值和经验值仅供参考，具体项目需结合测试规范和目标值分析。
