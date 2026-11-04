---
title: Noon
publishDate: 2024-04-05 00:00:00
priority: 3
img: /assets/work/noon.webp
img_alt: Anonymous cryptographic forms
description: |
  Anonymous forms and surveys built on RSA blind signatures: the server can check that every response came from an allowed person, and cannot tell which person sent which one.
tags:
  - Cryptography
  - Privacy
  - Rust
  - React
  - Dev
githubUrl: https://github.com/lupyd/noon
url: https://noon.lupyd.com
videoUrl: https://youtu.be/Nu-4eB7hwqw
status: Live at noon.lupyd.com, with free, pro and team plans
stats:
  - value: RSA
    label: blind signatures
  - value: "11"
    label: field types
  - value: 2 modes
    label: signed-in or anonymous
  - value: Rust + React
    label: server and client
---

Anonymous feedback usually means "trust us". The form promises not to
look, the database still has your email next to your answer, and
respondents hold back. Noon removes the trust: anonymity is enforced by
cryptography, not by policy.

The hard part is that anonymous can't mean open to anyone. A team survey
should accept one response per team member and nothing from outside.
Noon gives the form owner both guarantees at once: **every response is
from an eligible person, and no response can be traced to which one.**

<div class="video-embed">
  <iframe
    src="https://www.youtube-nocookie.com/embed/Nu-4eB7hwqw"
    title="Introducing Noon - Truly Anonymous Forms"
    loading="lazy"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    referrerpolicy="strict-origin-when-cross-origin"
    allowfullscreen></iframe>
</div>

## How blind signatures make it work

A blind signature lets the server sign something without seeing it,
like signing an envelope with carbon paper inside. Later, the signature
on the letter checks out, but the server can't match it to any envelope
it signed.

1. **Prove who you are.** The respondent verifies their email with a
   one-time code and gets a short-lived token.
2. **Blind.** The browser makes a secret message and blinds it with the
   form's RSA public key.
3. **Sign blind.** The server checks the token against the form's
   allowlist and signs the blinded message without seeing what it is.
4. **Unblind.** The browser removes the blinding and is left with a
   valid signature on the original message.
5. **Submit anonymously.** The answer and the signature go to the server
   in a separate request that carries no identity.
6. **Verify.** The server checks the signature with its public key. It
   knows the response is authorised, and has nothing that links it to
   step 1.

```
  respondent                form owner
      |                         |
      |  1. prove eligibility   |
      |------------------------>|
      |                         |
      |  2. submit response,    |
      |     unlinkable to (1)   |
      |------------------------>|
      |                         |
      |          3. read responses, without identities
```

<p class="caption">Figure 1: Eligibility and identity are kept apart</p>

## The product around the cryptography

- **Eleven field types**: text, long text, number, select, multi-select,
  radio, checkbox, date, time, email and URL.
- **Two submission modes** per form: signed in with email when the owner
  needs to know who answered, or anonymous with a blind signature when
  they shouldn't.
- **Access control**: owners restrict a form to an allowlist of
  participants.
- **Plans and billing**: free, pro and team tiers with their own form
  and participant limits, and subscriptions through Razorpay.

## Stack

The server is Rust on Hyper and Tokio, with PostgreSQL for storage and
Protocol Buffers on the wire. The blind-signature code lives in its own
`core` crate, separate from the HTTP server. The client is React 19 with
TypeScript and Vite, and the browser does all the blinding and
unblinding, so the secret message never leaves the respondent's device.

## Where anonymity still leaks

Cryptography can't hide what the network reveals. If the signing request
and the submission come from the same IP address a moment apart, a
server operator could correlate them. Noon's documentation says so
plainly and recommends sending the two steps over different network
paths, such as Tor, when the stakes are high. I wrote up the full threat
model in [Introducing Noon](https://blogs.lupyd.com/blog/introducing-noon-anonymous-form-submissions).
