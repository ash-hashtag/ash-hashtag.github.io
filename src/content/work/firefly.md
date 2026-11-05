---
title: Firefly
publishDate: 2024-02-20 00:00:00
priority: 2
img: /assets/work/firefly.webp
img_alt: Secure encrypted messaging interface
description: |
  Open-source Rust MLS (RFC 9420) client for end-to-end encrypted messaging, with SQLite storage, WebTransport and Node.js bindings. Powers Lupyd.
githubUrl: https://github.com/lupyd/firefly
status: Open source (MIT), running in production inside Lupyd
stats:
  - value: 5×
    label: lower p99 latency on WebTransport at 1% loss
  - value: 1,500
    label: endpoints in the load benchmark
  - value: RFC 9420
    label: Messaging Layer Security
  - value: 3 targets
    label: Rust · Node.js · web
tags:
  - Encryption
  - MLS
  - WebTransport
  - Rust
  - Dev
---

Firefly is the encrypted messaging engine underneath Lupyd, released as
open source. It implements **Messaging Layer Security** (MLS, RFC 9420),
the IETF standard for end-to-end encrypted groups, and wraps it in a
client that handles everything an app needs around the cryptography:
connecting, persisting state, syncing devices and recovering from bad
networks.

<aside class="note" style="--tilt:-3deg">the middle column up there is all the server ever gets</aside>

## Why MLS

Pairwise protocols encrypt each message once per recipient, so a group
of a thousand devices costs a thousand encryptions per message. MLS
arranges the group's keys in a ratchet tree, so adding, removing or
rotating a member costs a logarithmic number of operations. It also
gives forward secrecy and post-compromise security: a leaked key stops
being useful once the group moves on.

In Firefly every device is a member of the group in its own right, so a
conversation follows a person across their phone and laptop without the
server ever holding a readable message.

```
   Alice/phone    Alice/laptop          Bob/phone    Bob/desktop
       |               |                    |             |
       +-------+-------+---- MLS group -----+------+------+
               |                                   |
               v      ciphertext only              v
       +---------------------------------------------------+
       |    delivery service: stores and forwards blobs    |
       +---------------------------------------------------+
```

<p class="caption">Figure 1: Every device is a member; the server is not</p>

## What's in the box

| Crate | Job |
| --- | --- |
| `firefly-core` | MLS rules, custom proposals, the identity provider and group extensions |
| `firefly-protos` | Protocol Buffers for wire messages, groups and payloads |
| `firefly-client` | Async client: transport, SQLite storage for messages, group state and keys, address rotation |
| `firefly-client-node` | Native N-API bindings for Node.js and TypeScript |
| `firefly-client-js` | Bindings for the web |

The unit tests cover the cryptographic rules, the SQLite stores and key
storage, and run entirely in memory. The integration suite runs against
a real server and PostgreSQL, and skips itself when no server is
configured so offline CI stays fast.

## WebSocket to WebTransport, without breaking anyone

Firefly started on WebSockets. I added **WebTransport** (HTTP/3 over
QUIC) beside it with the same API: the client picks the transport from
the URL, so existing apps switch by changing one string.

Under the hood the two work differently. On a WebSocket every request
shares one TCP stream, so one lost packet stalls everything behind it.
On WebTransport each request gets its own bidirectional QUIC stream, and
server pushes arrive on a separate unidirectional one, so a loss only
delays the stream it hit. QUIC also survives a switch from Wi-Fi to
cellular without a new handshake.

To check it was worth it, I benchmarked both on **500 members with 3
devices each (1,500 live endpoints)** for five minutes each, with
deterministic traffic and a client network shaped by `tc netem` to 30 ms
latency, ±5 ms jitter and 1% packet loss, like a phone on a busy cell.

| Metric | WebSocket | WebTransport |
| --- | --- | --- |
| Median RPC latency | 33.2 ms | 33.5 ms |
| p99 RPC latency | 258.7 ms | **51.2 ms** |
| Worst RPC latency | 536.0 ms | **227.1 ms** |
| Latency std dev | 24.4 ms | **10.1 ms** |
| Peak server CPU | 17.0% | **14.4%** |
| Peak client memory | **209 MB** | 282 MB |
| Bandwidth | **98.6 KB/s** | 145.9 KB/s |

The medians are identical because both sit on the network floor. The
tail is where TCP's head-of-line blocking shows: WebSocket's p99 is five
times worse. QUIC pays for that with about a third more client memory
and half again the bandwidth, a trade worth making for a chat app.
