---
title: Firefly
publishDate: 2024-02-20 00:00:00
priority: 2
img: /assets/work/firefly.webp
img_alt: Secure encrypted messaging interface
description: |
  End-to-end encrypted chat suite using libsignal and Message-Layer-Security with multi-device support.
githubUrl: https://github.com/lupyd/firefly
tags:
  - Security
  - Encryption
  - Dev
  - Backend
---

An end-to-end encrypted chat suite implementing libsignal and
Message Layer Security (MLS). It supports multiple devices per user, so
a conversation follows its participants across platforms without the
server ever holding readable messages.

<aside class="note" style="--tilt:-3deg">this noise is all the server ever gets to see</aside>

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
