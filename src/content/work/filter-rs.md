---
title: Filter
publishDate: 2024-01-15 00:00:00
priority: 6
img: /assets/work/filter.webp
img_alt: Real-time log processing interface
description: |
  Real-time interactive log processing TUI built with Rust for efficient filtering and analysis.
githubUrl: https://github.com/ash-hashtag/filter-rs
tags:
  - Rust
  - TUI
  - Dev
---

A real-time interactive terminal UI for processing logs: filter and
analyse a stream as it arrives. It is written in Rust for high
throughput and a small footprint.

```
  +-----------+      +----------+      +------------------------+
  | log       |----->|  filter  |----->| > level=error  _       |
  | stream    |      |          |      | 12:04:01 error  db ... |
  +-----------+      +----------+      | 12:04:09 error  io ... |
                                       +------------------------+
```

<p class="caption">Figure 1: Stream in, matching lines out, live</p>
