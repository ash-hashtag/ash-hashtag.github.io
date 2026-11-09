---
title: Light
publishDate: 2025-01-10 00:00:00
priority: 8
description: |
  Typed RPC and low-latency datagrams over WebRTC data channels, for peer-to-peer sync engines in browsers, Node.js and Bun.
githubUrl: https://github.com/lupyd/light
status: Open source (MIT)
stats:
  - value: 3 runtimes
    label: browsers · Node.js · Bun
  - value: Protobuf
    label: binary framing
  - value: 0 retransmits
    label: on the datagram channel
  - value: End-to-end
    label: inferred types
tags:
  - WebRTC
  - RPC
  - TypeScript
  - Sync Engines
  - Dev
---

Light is a small TypeScript library for apps whose peers talk directly
to each other: collaborative editors, multiplayer games and local-first
sync engines. It turns a WebRTC data channel into two things a sync
engine needs: **reliable, typed RPC** for operations that must arrive,
and **unreliable datagrams** for state that is stale the moment a newer
update exists.

```
     Peer A                                       Peer B
  +-----------+         RTCDataChannel         +-----------+
  |   sync    |------- call(id, method) ------>|  handler  |
  |  engine   |<------ result(id, value) ------|           |
  +-----------+                                +-----------+
        \                                            /
         \______ signaling, only to connect ________/
```

<p class="caption">Figure 1: Request and response over a data channel</p>

## Types on both ends

Each peer declares the methods it exposes as a plain TypeScript type.
Light infers every call's arguments and return type from it, so calling
a method the other side doesn't have, or passing the wrong argument, is
a compile error rather than a runtime surprise.

```ts
type PeerB = {
  greetUser: (name: string) => string;
};

const peer = new LightPeer<PeerA, PeerB>({ initiator: true, handlers });

const greeting = await peer.call('greetUser', 'Alice'); // string
await peer.call('greetUser', 123); // type error
```

## Two channels, two promises

| | RPC | Datagrams |
| --- | --- | --- |
| Delivery | Reliable and ordered | Best effort, `maxRetransmits: 0` |
| Shape | Request and typed response | Topic and payload |
| Use it for | Operations, document edits, commands | Cursors, presence, game state |

A cursor position that arrives late is worse than one that never
arrives, so datagrams are never retransmitted: the next update replaces
the lost one.

## Built for flaky networks

- **Calls queue while connecting.** Calls made before the channel opens,
  or during a reconnect, wait and go out once it is up.
- **Automatic reconnection** with a configurable retry budget (three by
  default), and events for every state change.
- **Bring your own signaling.** Light only needs a way to pass a few
  messages to set up the connection: a WebSocket, a broadcast channel,
  anything.
- **One code path everywhere.** It uses the browser's native WebRTC and
  falls back to `werift` in Node.js and Bun, so the same peer code runs
  in a tab, a server or a CLI.

Every message is framed with Protocol Buffers, and binary payloads go
through as raw `Uint8Array`s with no base64 detour.
