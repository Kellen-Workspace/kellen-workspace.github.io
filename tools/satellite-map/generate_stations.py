"""扫描 in_situ_sites/ 下所有 .txt 文件，生成 stations_data.js."""
import os
import json

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SITES_DIR = os.path.join(SCRIPT_DIR, 'in_situ_sites')
OUTPUT = os.path.join(SCRIPT_DIR, 'stations_data.js')

stations = []

for fname in sorted(os.listdir(SITES_DIR)):
    if not fname.endswith('.txt'):
        continue
    fpath = os.path.join(SITES_DIR, fname)
    # 去掉 .txt，再去掉 _enriched 后缀作为前缀
    prefix = fname.replace('.txt', '').replace('_enriched', '')

    with open(fpath, 'r', encoding='utf-8') as f:
        lines = f.read().strip().split('\n')
        if len(lines) < 2:
            continue

        for line in lines[1:]:
            cols = line.split(',')
            if len(cols) < 6:
                continue

            lat = float(cols[1])
            lng = float(cols[2])
            stations.append({
                'name': prefix + '_' + cols[0].strip(),
                'lat': lat,
                'lng': lng,
                'croptype': cols[3].strip(),
                'timeseries': cols[4].strip(),
                'depth': cols[5].strip(),
            })

js_content = '// 自动生成，请勿手动编辑\n// 运行 python generate_stations.py 更新此文件\nwindow.__STATIONS__ = '
js_content += json.dumps(stations, ensure_ascii=False, indent=2)
js_content += ';\n'

with open(OUTPUT, 'w', encoding='utf-8') as f:
    f.write(js_content)

print(f'已生成 {OUTPUT}，共 {len(stations)} 个站点')
