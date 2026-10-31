---
title: Light
publishDate: 2025-01-10 00:00:00
priority: 6
description: |
  Lightweight WebRTC-based RPC library for building peer-to-peer sync engines.
githubUrl: https://github.com/lupyd/light
tags:
  - WebRTC
  - RPC
  - Sync Engines
  - Dev
---

Light is a lightweight RPC layer built on WebRTC, for sync engines that
need direct, real-time communication between peers rather than a round
trip through a server.

```
     Peer A                                       Peer B
  +-----------+         RTCDataChannel         +-----------+
  |   sync    |------- call(id, method) ------>|  handler  |
  |  engine   |<------ result(id, value) ------|           |
  +-----------+                                +-----------+
        \                                            /
         \______ signaling, only to connect ________/
```

<p class="caption">Figure 1: Request and response over a data channel (illustrative)</p>
