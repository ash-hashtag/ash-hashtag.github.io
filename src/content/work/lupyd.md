---
title: Lupyd
publishDate: 2024-03-10 00:00:00
priority: 1
img: /assets/work/lupyd.webp
img_alt: Privacy-focused social media platform
description: |
  Privacy-focused social media platform prioritizing user data protection and control.
tags:
  - Privacy
  - Social Media
  - Dev
  - Backend
url: https://www.lupyd.com
---

A privacy-focused social media platform built with user data protection
and control at its core. It is designed to give users full ownership of
their data while keeping them socially connected.

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
