---
title: Noon
publishDate: 2024-04-05 00:00:00
priority: 3
img: /assets/work/noon.webp
img_alt: Anonymous cryptographic forms
description: |
  Cryptographic anonymous form suite ensuring complete privacy and anonymity for form submissions.
tags:
  - Cryptography
  - Privacy
  - Dev
githubUrl: https://github.com/lupyd/noon
videoUrl: https://youtu.be/Nu-4eB7hwqw
---

A cryptographic anonymous form suite. Respondents can submit to a form
while their identity stays protected, and the people collecting the
responses still get data they can act on.

<div class="video-embed">
  <iframe
    src="https://www.youtube-nocookie.com/embed/Nu-4eB7hwqw"
    title="Introducing Noon - Truly Anonymous Forms"
    loading="lazy"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    referrerpolicy="strict-origin-when-cross-origin"
    allowfullscreen></iframe>
</div>

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

<p class="caption">Figure 1: Eligibility and identity are kept apart (illustrative)</p>
