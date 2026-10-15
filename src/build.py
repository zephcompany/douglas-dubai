#!/usr/bin/env python3
"""Assembles the static pages: src/pages/*.html + partials -> ./*.html

Each page starts with a small front-matter block:
---
title: ...
description: ...
nav: mercados        (which nav item is current)
loader: short        (optional: shorter preloader)
preload: assets/x    (optional: image to preload)
---
"""
import pathlib, re, html

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
HEAD = (SRC / "partials" / "head.html").read_text(encoding="utf-8")
FOOT = (SRC / "partials" / "foot.html").read_text(encoding="utf-8")
NAV_KEYS = ["mercados", "trade", "ganhe", "institucional", "mais"]
PRELOADER = """  <!-- ============ PRELOADER ============ -->
  <div class="preloader" id="preloader" aria-hidden="true">
    <div class="preloader__logo">
      <span class="preloader__ring"></span>
      <img class="preloader__symbol" src="assets/kryptobit-symbol.png" alt="" width="326" height="342" />
      <span class="preloader__word"><img src="assets/kryptobit-wordmark.png" alt="" width="1003" height="279" /></span>
    </div>
    <div class="preloader__line"><span></span></div>
  </div>

"""

def build(page: pathlib.Path):
    raw = page.read_text(encoding="utf-8")
    m = re.match(r"^---\n(.*?)\n---\n(.*)$", raw, re.S)
    meta, body = {}, raw
    if m:
        for line in m.group(1).splitlines():
            k, _, v = line.partition(":")
            meta[k.strip()] = v.strip()
        body = m.group(2)
    head = HEAD
    head = head.replace("{{title}}", html.escape(meta.get("title", "Kryptobit")))
    head = head.replace("{{description}}", html.escape(meta.get("description", "")))
    pre = meta.get("preload")
    head = head.replace("{{preload}}", f'<link rel="preload" as="image" href="{pre}" type="image/webp" />' if pre else "")
    head = head.replace("{{bodyattrs}}", ' data-loader="short"' if meta.get("loader") == "short" else "")
    head = head.replace("{{preloader}}", "" if meta.get("loader") == "none" else PRELOADER)
    for k in NAV_KEYS:
        head = head.replace("{{cur:%s}}" % k, ' aria-current="page"' if meta.get("nav") == k else "")
    out = ROOT / page.name
    out.write_text(head + body + FOOT, encoding="utf-8")
    print("built", out.name)

if __name__ == "__main__":
    for p in sorted((SRC / "pages").glob("*.html")):
        build(p)
