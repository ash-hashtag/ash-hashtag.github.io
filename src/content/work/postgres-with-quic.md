---
title: Postgres with QUIC
publishDate: 2025-08-06 00:00:00
priority: 5
img: /assets/work/postgres-with-quic.webp
img_alt: Database performance visualization
description: |
  The PostgreSQL wire protocol over QUIC: a modified pgcat pooler that carries every client as its own QUIC stream over a handful of connections.
tags:
  - PostgreSQL
  - QUIC
  - Rust
  - Performance
  - Dev
githubUrl: https://github.com/ash-hashtag/postgres-with-quic
status: Research prototype, with a working pgcat fork
stats:
  - value: 10× fewer
    label: connections (50 QUIC vs 500 TCP)
  - value: ~2×
    label: queries processed in the same run
  - value: ~5× less
    label: memory at peak load
  - value: "0"
    label: changes to Postgres itself
---

The PostgreSQL protocol runs one query at a time per connection. That is
why pools and poolers exist: to run a hundred queries in parallel you
need a hundred connections, and once the pool is full every new request
waits.

The waiting is the expensive part. If a client is 100 ms from the pooler
and the pooler is 1 ms from the database, each pooled connection spends
almost all of its time idle, holding a slot until the round trip ends.
Push to a thousand TCP connections and you start hitting "too many open
files" before the database is even busy.

## The idea

Don't change Postgres; change what carries it. I modified the
[pgcat](https://github.com/ash-hashtag/pgcat) pooler to accept **QUIC**,
where one connection carries many independent streams. Each client
query session becomes a stream, so fifty connections can do the work of
five hundred, and a slow stream never stalls its neighbours.

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

## The result

The benchmark ran **500 TCP connections against 50 QUIC connections with
40 streams each**, using the settings in the repo's `.env.tcp` and
`.env.quic`.

<figure>
  <img src="/assets/work/postgres-with-quic/metrics.webp" alt="Charts comparing TCP and QUIC: active queries, failed queries, queries processed, average query time, CPU and memory" loading="lazy" width="1200" height="1200" />
  <figcaption>Figure 2: QUIC in blue, TCP in orange</figcaption>
</figure>

- **Queries pile up on TCP.** Its backlog of active queries climbs to
  about 40,000 while QUIC's stays near zero.
- **Latency stays flat on QUIC.** TCP's average query time rises
  steadily to around 9.5 seconds as the backlog grows.
- **About twice the work.** QUIC processed close to 10,000 queries while
  TCP plateaued under 5,000.
- **A fraction of the memory.** TCP peaked near 480 MB against roughly
  90 MB for QUIC.
- **More CPU on QUIC**, which is expected: it was doing twice the work,
  in user space.

## What actually wins

Most of the gain is multiplexing, not QUIC itself. HTTP/2-style streams
over TCP would remove much of the same waiting. QUIC earns its place
with two properties that suit a pooler:

- **No head-of-line blocking.** On TCP a lost packet freezes every
  stream on the connection; on QUIC it only delays the stream it hit.
- **0-RTT resumption.** A pool closes and reopens connections all the
  time, and QUIC can resume one without a fresh handshake.

The cleanest fix would be a multiplexed Postgres protocol, but how
Postgres manages connections is tied deep into its architecture. A
pooler that speaks QUIC on one side and plain Postgres on the other is
the version that can ship today.
