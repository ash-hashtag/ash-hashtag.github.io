---
title: Lupyd
publishDate: 2024-03-10 00:00:00
priority: 1
img: /assets/work/lupyd.webp
img_alt: Lupyd, a privacy-focused collaboration platform
description: |
  Privacy-focused collaboration platform with end-to-end encryption, where the server relays and stores data it cannot read.
tags:
  - Privacy
  - End-to-end encryption
  - Collaboration
  - Dev
  - Backend
url: https://www.lupyd.com
---

A privacy-focused collaboration platform with end-to-end encryption.
Teams and communities talk, share and work together, and the content is
encrypted on their devices before it leaves them, so the server routes
and stores ciphertext it cannot read.

The backend is written in Rust; the web and desktop clients use React
and Tauri. Group state is protected with MLS, and clients reach the
server over WebSockets or WebTransport, with WebRTC for direct
peer-to-peer paths.

```
  +-------------+   WebSocket /    +-----------------+
  | web (React) |<- WebTransport ->|                 |
  +-------------+                  |  Rust backend   |
                                   |                 |
  +-------------+                  |  sees metadata  |
  |   desktop   |<---------------->|  it needs, not  |
  |   (Tauri)   |                  |  what you said  |
  +------+------+                  +-----------------+
         |
         |  WebRTC, peer to peer
         v
  +-------------+
  | other peer  |
  +-------------+
```

<p class="caption">Figure 1: Lupyd at a glance (illustrative)</p>
