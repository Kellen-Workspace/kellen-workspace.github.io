"""申万三级行业统计口径——唯一配置与计算逻辑文件。

以后若发现异常数据、想调整剔除规则或改变行业增速算法，优先只修改本文件。
数据下载、网页生成等流程位于 update_sw_industry.py，不应在那里重复定义口径。

当前口径
========
1. 公司层面的同比值来自 A 股定期报告，报告期为累计口径（Q1、H1、Q3、FY）。
2. 行业同比不是公司同比的算术平均。先用公司当期值和同比值反推上年同期值：
       上年同期值 = 当期值 / (1 + 同比 / 100)
   再计算：
       行业同比 = (纳入公司当期合计 / 纳入公司上年同期合计 - 1) * 100
3. 公司基期过小会把同比放大到没有行业解释意义。满足下列任一条件的“公司×指标”
   被标为异常记录，并从该指标的行业合计中剔除：
   - 同比绝对值超过硬阈值；
   - 基期绝对值很小，同时同比超过中等阈值；
   - 在同行业内通过 MAD 稳健离群检验，且偏离幅度也超过中等阈值；
   - 同比约等于 -100%，导致仅凭四舍五入后的当期值无法可靠反推基期。
4. 缺失值不算“异常”，单独体现在有效样本分母中。
5. 营业收入和净利润分别判断异常；同一家公司可能产生两条异常记录，但行业表中的
   “异常公司”按股票代码去重计数。

阈值均集中在 RULES，可直接修改。金额单位沿用源数据的人民币元。
"""
from __future__ import annotations

from dataclasses import dataclass
import math

import pandas as pd


RULES = {
    "revenue": {
        "label": "营业收入",
        "hard_yoy_limit": 500.0,       # 营收同比绝对值超过 500% 直接判异常
        "moderate_yoy_limit": 100.0,   # 配合小基期/MAD 使用的最低偏离幅度
        "absolute_baseline_floor": 1_000_000.0,
        "relative_baseline_ratio": 0.01,
        "mad_multiplier": 8.0,
        "minimum_mad_sample": 6,
    },
    "net_profit": {
        "label": "净利润",
        "hard_yoy_limit": 3000.0,      # 利润波动更大，硬阈值相应放宽
        "moderate_yoy_limit": 500.0,
        "absolute_baseline_floor": 100_000.0,
        "relative_baseline_ratio": 0.01,
        "mad_multiplier": 8.0,
        "minimum_mad_sample": 6,
    },
}


@dataclass
class MetricResult:
    growth: float | None
    valid_observations: int
    positive_companies: int
    abnormal_records: list[dict]


def _finite(value):
    try:
        number = float(value)
        return number if math.isfinite(number) else None
    except (TypeError, ValueError):
        return None


def calculate_metric(group: pd.DataFrame, current_column: str, yoy_column: str, metric: str) -> MetricResult:
    """识别异常公司并计算一个行业的单项财务同比。"""
    rule = RULES[metric]
    current = pd.to_numeric(group[current_column], errors="coerce")
    yoy = pd.to_numeric(group[yoy_column], errors="coerce")
    available = current.notna() & yoy.notna()

    denominator = 1 + yoy / 100
    reversible = available & (denominator.abs() > 1e-9)
    baseline = pd.Series(float("nan"), index=group.index)
    baseline.loc[reversible] = current.loc[reversible] / denominator.loc[reversible]

    abnormal_reason = pd.Series("", index=group.index, dtype="object")
    abnormal_reason.loc[available & ~reversible] = "同比接近-100%，无法可靠反推基期"
    abnormal_reason.loc[reversible & (yoy.abs() > rule["hard_yoy_limit"])] = "同比超过硬阈值"

    baseline_scale = baseline[reversible].abs().median()
    if pd.isna(baseline_scale):
        baseline_scale = 0.0
    small_floor = max(rule["absolute_baseline_floor"], baseline_scale * rule["relative_baseline_ratio"])
    tiny_base = reversible & (baseline.abs() < small_floor) & (yoy.abs() > rule["moderate_yoy_limit"])
    abnormal_reason.loc[(abnormal_reason == "") & tiny_base] = "基期过小导致同比失真"

    sample = yoy[reversible]
    if len(sample) >= rule["minimum_mad_sample"]:
        median = sample.median()
        mad = (sample - median).abs().median()
        if pd.notna(mad) and mad > 0:
            robust_outlier = reversible & ((yoy - median).abs() > rule["mad_multiplier"] * mad) & ((yoy - median).abs() > rule["moderate_yoy_limit"])
            abnormal_reason.loc[(abnormal_reason == "") & robust_outlier] = "同行业MAD稳健离群"

    abnormal = abnormal_reason != ""
    included = reversible & ~abnormal
    prior_total = baseline[included].sum()
    current_total = current[included].sum()
    growth = None if not included.any() or abs(prior_total) < 1e-9 else round((current_total / prior_total - 1) * 100, 2)

    records = []
    for idx in group.index[abnormal]:
        records.append({
            "code": str(group.at[idx, "股票代码"]),
            "name": str(group.at[idx, "股票简称"]),
            "metric": rule["label"],
            "yoy": _finite(yoy.at[idx]),
            "current": _finite(current.at[idx]),
            "baseline": _finite(baseline.at[idx]),
            "reason": str(abnormal_reason.at[idx]),
        })

    return MetricResult(
        growth=growth,
        valid_observations=int(included.sum()),
        positive_companies=int((yoy[included] > 0).sum()),
        abnormal_records=records,
    )
