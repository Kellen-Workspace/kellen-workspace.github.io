"""申万三级行业统计口径——唯一配置与计算逻辑文件。

以后若要核对数据或改变统计方式，优先只修改本文件。

当前口径（不进行异常值过滤）
================================
1. 公司层面的同比和具体金额来自 A 股定期报告，报告期采用累计口径：
   一季报、半年报、三季报、年报。
2. 不根据同比大小、基期大小或离群程度剔除任何公司。
3. 行业同比不是公司同比的算术平均。对所有具有有效当期金额和同比的公司：
       上年同期金额 = 当期金额 / (1 + 同比 / 100)
       行业同比 = (公司当期金额合计 / 公司上年同期金额合计 - 1) * 100
4. 同比恰好为 -100% 时，仅凭四舍五入后的当期金额无法反推上年同期金额；
   该条记录只作为“无法计算”处理，不属于异常过滤。
5. “正增长公司”是本报告期披露同比大于 0 的公司。点击网页中的数量可查看
   公司名单，以及当前报告期、前一期、前两期的同比和具体金额。
6. 营业收入与净利润分别计算、分别展示公司名单。
"""
from __future__ import annotations

from dataclasses import dataclass
import math

import pandas as pd


@dataclass
class MetricResult:
    growth: float | None
    valid_observations: int
    positive_companies: int


def finite(value):
    """将源数据安全转为有限浮点数；无效值返回 None。"""
    try:
        number = float(value)
        return number if math.isfinite(number) else None
    except (TypeError, ValueError):
        return None


def calculate_metric(group: pd.DataFrame, current_column: str, yoy_column: str) -> MetricResult:
    """不做异常过滤，按全部可反推基期的有效公司计算行业同比。"""
    current = pd.to_numeric(group[current_column], errors="coerce")
    yoy = pd.to_numeric(group[yoy_column], errors="coerce")
    denominator = 1 + yoy / 100
    included = current.notna() & yoy.notna() & (denominator.abs() > 1e-9)
    baseline = current[included] / denominator[included]
    prior_total = baseline.sum()
    current_total = current[included].sum()
    growth = None if not included.any() or abs(prior_total) < 1e-9 else round((current_total / prior_total - 1) * 100, 2)
    return MetricResult(
        growth=growth,
        valid_observations=int(included.sum()),
        positive_companies=int((yoy[included] > 0).sum()),
    )


def company_snapshot(row: pd.Series | None, amount_column: str, yoy_column: str) -> dict:
    """整理网页公司明细所需的一期金额与同比。"""
    if row is None:
        return {"amount": None, "yoy": None}
    return {"amount": finite(row.get(amount_column)), "yoy": finite(row.get(yoy_column))}
