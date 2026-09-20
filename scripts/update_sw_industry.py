"""Build the static Shenwan Level 3 dashboard dataset.

The script intentionally runs outside the browser: data vendors generally do not
allow cross-origin requests from GitHub Pages. Output is a small, auditable JSON
file that the public dashboard can read without an API key or backend.
"""
from __future__ import annotations

import argparse
import json
import math
import re
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date, datetime, timedelta
from pathlib import Path

import akshare as ak
import pandas as pd

from industry_calculation_method import calculate_metric

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "invest" / "industries" / "data" / "sw-industry.json"
CACHE = ROOT / ".cache" / "sw-industry"


def report_periods(count: int = 8) -> list[str]:
    today = date.today()
    year, month = today.year, today.month
    completed = []
    # A report period becomes eligible after its normal disclosure window.
    for offset in range(20):
        y = year - offset // 4
        q = 4 - offset % 4
        end_month = q * 3
        end_day = 31 if end_month in (3, 12) else 30
        period_end = date(y, end_month, end_day)
        lag = 120 if q == 4 else 60
        if period_end + timedelta(days=lag) <= today:
            completed.append(period_end.strftime("%Y%m%d"))
        if len(completed) == count:
            break
    return completed


def label_for(period: str) -> str:
    year, month = period[:4], period[4:6]
    return {"03": f"{year}年一季报", "06": f"{year}年中报", "09": f"{year}年三季报", "12": f"{year}年年报"}[month]


def finite(value):
    try:
        number = float(value)
        return number if math.isfinite(number) else None
    except (TypeError, ValueError):
        return None


def mean(values):
    clean = [finite(value) for value in values]
    clean = [value for value in clean if value is not None]
    return round(sum(clean) / len(clean), 2) if clean else None


def cache_frame(name: str, loader, refresh: bool) -> pd.DataFrame:
    CACHE.mkdir(parents=True, exist_ok=True)
    path = CACHE / f"{name}.pkl"
    if path.exists() and not refresh:
        return pd.read_pickle(path)
    frame = loader()
    frame.to_pickle(path)
    return frame


def retry(loader, attempts=3):
    error = None
    for attempt in range(attempts):
        try:
            return loader()
        except Exception as exc:  # Public sources occasionally time out.
            error = exc
            time.sleep(1.5 * (attempt + 1))
    raise error


def load_industries(refresh: bool):
    info = cache_frame("industry_info", ak.sw_index_third_info, refresh)
    rows = info.to_dict("records")

    def one(row):
        code = str(row["行业代码"])
        plain = code.split(".")[0]
        frame = cache_frame(f"official_components_{plain}", lambda: retry(lambda: ak.index_component_sw(symbol=plain)), refresh)
        return code, frame

    constituents = {}
    with ThreadPoolExecutor(max_workers=8) as pool:
        jobs = {pool.submit(one, row): row for row in rows}
        for index, job in enumerate(as_completed(jobs), 1):
            row = jobs[job]
            try:
                code, frame = job.result()
                constituents[code] = frame
            except Exception as exc:
                print(f"warning: constituents failed for {row['行业代码']}: {exc}")
            if index % 25 == 0:
                print(f"constituents {index}/{len(rows)}")
    return rows, constituents


def stock_code_column(frame):
    return next(column for column in frame.columns if "股票代码" in str(column) or "证券代码" in str(column))


def build_stock_map(rows, constituents):
    mapping = {}
    for row in rows:
        code = str(row["行业代码"])
        frame = constituents.get(code)
        if frame is None or frame.empty:
            continue
        code_column = stock_code_column(frame)
        for raw in frame[code_column].dropna():
            stock = re.sub(r"\D", "", str(raw))[:6]
            if len(stock) == 6:
                mapping[stock] = code
    return mapping


def load_financials(period, refresh):
    frame = cache_frame(f"financials_{period}", lambda: retry(lambda: ak.stock_yjbb_em(date=period)), refresh)
    frame["股票代码"] = frame["股票代码"].astype(str).str.extract(r"(\d{6})", expand=False)
    if "最新公告日期" in frame:
        frame = frame.sort_values("最新公告日期")
    return frame.drop_duplicates("股票代码", keep="last")


def load_index_history(code, refresh):
    plain = code.split(".")[0]
    # The provider's monthly series currently stops early for some Level 3
    # indices; the daily series is used so recent quarter-end returns stay valid.
    return cache_frame(f"prices_daily_{plain}", lambda: retry(lambda: ak.index_hist_sw(symbol=plain, period="day")), refresh)


def quarter_return(frame, period):
    if frame is None or frame.empty:
        return None
    end = pd.Timestamp(datetime.strptime(period, "%Y%m%d").date())
    start = end - pd.DateOffset(months=3)
    data = frame.copy()
    data["日期"] = pd.to_datetime(data["日期"], errors="coerce")
    data["收盘"] = pd.to_numeric(data["收盘"], errors="coerce")
    if data["日期"].max() < start:
        return None
    before_start = data[data["日期"] <= start].dropna(subset=["收盘"])
    before_end = data[data["日期"] <= end].dropna(subset=["收盘"])
    if before_start.empty or before_end.empty:
        return None
    first, last = float(before_start.iloc[-1]["收盘"]), float(before_end.iloc[-1]["收盘"])
    return round((last / first - 1) * 100, 2) if first else None


def build(args):
    periods = args.periods or report_periods(args.history)
    print(f"periods: {', '.join(periods)}")
    rows, constituents = load_industries(args.refresh)
    stock_map = build_stock_map(rows, constituents)
    print(f"mapped stocks: {len(stock_map)} across {len(rows)} industries")

    price_history = {}
    with ThreadPoolExecutor(max_workers=10) as pool:
        jobs = {pool.submit(load_index_history, str(row["行业代码"]), args.refresh): str(row["行业代码"]) for row in rows}
        for index, job in enumerate(as_completed(jobs), 1):
            code = jobs[job]
            try:
                price_history[code] = job.result()
            except Exception as exc:
                print(f"warning: price history failed for {code}: {exc}")
            if index % 25 == 0:
                print(f"prices {index}/{len(rows)}")

    result_periods = []
    for period in periods:
        print(f"financials {period}")
        financials = load_financials(period, args.refresh)
        financials["industry_code"] = financials["股票代码"].map(stock_map)
        financials = financials.dropna(subset=["industry_code"])
        industries = []
        for row in rows:
            code = str(row["行业代码"])
            group = financials[financials["industry_code"] == code]
            profit = pd.to_numeric(group["净利润-同比增长"], errors="coerce")
            revenue = pd.to_numeric(group["营业总收入-同比增长"], errors="coerce")
            profit_result = calculate_metric(group, "净利润-净利润", "净利润-同比增长", "net_profit")
            revenue_result = calculate_metric(group, "营业总收入-营业总收入", "营业总收入-同比增长", "revenue")
            abnormal_records = profit_result.abnormal_records + revenue_result.abnormal_records
            industries.append({
                "code": code,
                "name": str(row["行业名称"]),
                "nameZh": str(row["行业名称"]),
                "parent": str(row["上级行业"]),
                "netProfitYoY": profit_result.growth,
                "revenueYoY": revenue_result.growth,
                "priceReturn": quarter_return(price_history.get(code), period),
                "positiveNetProfit": profit_result.positive_companies,
                "netProfitObservations": profit_result.valid_observations,
                "positiveRevenue": revenue_result.positive_companies,
                "revenueObservations": revenue_result.valid_observations,
                "abnormalCompanies": len({item["code"] for item in abnormal_records}),
                "abnormalRecords": abnormal_records,
                "companies": int(group["股票代码"].nunique()),
            })
        industries.sort(key=lambda item: item["netProfitYoY"] if item["netProfitYoY"] is not None else -math.inf, reverse=True)
        result_periods.append({
            "id": period,
            "label": label_for(period),
            "summary": {
                "companies": int(financials["股票代码"].nunique()),
                "positiveNetProfit": sum(item["positiveNetProfit"] for item in industries),
                "abnormalRecords": sum(len(item["abnormalRecords"]) for item in industries),
            },
            "industries": industries,
        })

    payload = {
        "schemaVersion": 1,
        "generatedAt": datetime.now().astimezone().isoformat(timespec="seconds"),
        "classification": "Shenwan Level 3",
        "periods": result_periods,
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"wrote {OUTPUT} ({OUTPUT.stat().st_size / 1024:.1f} KiB)")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--history", type=int, default=8, help="number of completed reporting periods")
    parser.add_argument("--periods", nargs="*", help="explicit YYYYMMDD reporting periods, newest first")
    parser.add_argument("--refresh", action="store_true", help="ignore the local download cache")
    build(parser.parse_args())
