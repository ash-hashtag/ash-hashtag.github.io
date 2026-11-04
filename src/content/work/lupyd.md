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
videoUrl: https://youtu.be/UaEMoxkTf-k
status: In production on macOS, Windows, Linux and Android; iOS in internal testing
stats:
  - value: Signal + MLS
    label: 1-on-1 and group encryption
  - value: 4 platforms
    label: macOS · Windows · Linux · Android
  - value: On-device
    label: full-text search index
  - value: Zero
    label: ads, trackers or telemetry
---

Lupyd is a workspace where nothing leaks. Teams organise conversations
into channels, message each other in real time, share files and call,
and every message is encrypted on the sender's device before it leaves
it. The server routes and stores ciphertext it cannot read.

I founded Lupyd and lead its engineering, from the Rust backend and the
encryption layer to the transports and the clients.

<div class="video-embed">
  <iframe
    src="https://www.youtube-nocookie.com/embed/UaEMoxkTf-k"
    title="Introducing Lupyd - Your Private Workspace"
    loading="lazy"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    referrerpolicy="strict-origin-when-cross-origin"
    allowfullscreen></iframe>
</div>

## Encryption is the architecture

Encryption isn't a feature bolted onto Lupyd; every other part is shaped
around it.

| What | Protected with |
| --- | --- |
| Direct messages | **Signal Protocol**, keys held only by the two people talking |
| Group chats and channels | **MLS** (RFC 9420), via [Firefly](/work/firefly/) |
| Files, attachments and backups | **AES**, encrypted on the client before upload |
| Voice and video | Encrypted, peer to peer, with screen sharing |

Because the server only ever sees ciphertext, features that usually run
server-side have to move to the device. Search is the clearest example:
every client keeps its own **inverted index in SQLite**, so a query over
months of history returns in milliseconds and the search terms never
leave the machine.

<div class="shots">
  <img src="/assets/work/lupyd/desktop/group-channel-dark.webp" alt="A Lupyd group channel on desktop" loading="lazy" width="1100" height="688" />
  <img src="/assets/work/lupyd/desktop/search-dark.webp" alt="Local full-text search across channels" loading="lazy" width="1100" height="688" />
  <img src="/assets/work/lupyd/desktop/roles-dark.webp" alt="Defining custom roles and permissions" loading="lazy" width="1100" height="688" />
  <img src="/assets/work/lupyd/desktop/media-dark.webp" alt="Encrypted media shared in a workspace" loading="lazy" width="1100" height="688" />
</div>

## A workspace you shape

- **Channels**: public or private, text, voice or announcement, with
  their own topics and member access.
- **Roles with no fixed hierarchy**: there is no built-in admin or
  moderator. A role is any name plus any combination of permission
  flags, and anything can be assigned to anyone.
- **Multi-device**: one account across desktop and phone. Each device
  holds its own keys and joins the encrypted groups as a member.
- **No ads, trackers or algorithmic feeds**: conversations are
  chronological, and there is no telemetry to opt out of.

## How it fits together

The backend is Rust. Clients reach it over WebSockets or WebTransport
(HTTP/3 over QUIC), and calls go peer to peer over WebRTC. The desktop
apps use React and Tauri. Group messaging is built on Firefly, the MLS
client suite I open-sourced from Lupyd, and anonymous surveys come from
[Noon](/work/noon/).

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

## Try it

Download the apps from [lupyd.com](https://www.lupyd.com), or open the
browser version at [app.lupyd.com](https://app.lupyd.com).
