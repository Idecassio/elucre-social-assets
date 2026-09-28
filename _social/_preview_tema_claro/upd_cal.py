# -*- coding: utf-8 -*-
import json, io, sys
p = r"C:\Users\Idecasio\Desktop\eLucre_Posts\_social\calendario_2026-09.json"
data = json.load(io.open(p, encoding="utf-8-sig"))
claro = {15,16,17,23,24,25}   # linhas 2 e 4 da grade 3-em-3
for item in data:
    dia = int(item["data"].split("-")[2])
    item["tema_visual"] = "claro" if dia in claro else "dark"
json.dump(data, io.open(p, "w", encoding="utf-8-sig"), ensure_ascii=False, indent=2)
print("OK — tema_visual gravado:")
for item in data:
    print("  ", item["data"], "->", item["tema_visual"], "|", item["tema"])
