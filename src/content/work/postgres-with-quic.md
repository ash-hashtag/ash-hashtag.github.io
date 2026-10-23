---
title: Postgres with QUIC
publishDate: 2024-07-15 00:00:00
priority: 4
img: /assets/work/postgres-with-quic.webp
img_alt: Database performance visualization
description: |
  Project demonstrating the benefits of using PostgreSQL over QUIC protocol.
tags:
  - PostgreSQL
  - QUIC
  - Performance
  - Dev
githubUrl: https://github.com/ash-hashtag/postgres-with-quic
---

A project that shows the performance and reliability benefits of
running the PostgreSQL protocol over QUIC instead of TCP.

QUIC folds the transport and TLS 1.3 handshakes into one round trip,
multiplexes independent streams without head-of-line blocking, and lets
a connection survive a change of network address.

```lanes
  TCP + TLS 1.3                      QUIC
  client          server             client          server
    |---- SYN ------->|                |-- Initial ----->|
    |<--- SYN/ACK ----|                |<- Handshake ----|  1 RTT
    |---- ClientHello>|                |-- query ------->|
    |<--- ServerHello-|  2 RTT
    |---- query ----->|
```

<p class="caption">Figure 1: Round trips before the first query</p>

<aside class="note" style="--tilt:-3deg">drag the delay up and watch QUIC pull ahead</aside>
