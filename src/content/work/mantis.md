---
title: Mantis
publishDate: 2024-06-01 00:00:00
img: /assets/work/mantis.webp
img_alt: Programming language compiler interface
description: |
  Rust-based memory-safe statically compiled programming language.
githubUrl: https://github.com/ash-hashtag/mantis
tags:
  - Rust
  - Compiler
  - Dev
  - Programming Language
---

A memory-safe, statically compiled programming language written in
Rust. The aim is strong safety guarantees without giving up the
performance of ahead-of-time compilation.

```
  source -> lexer -> parser -> checks -> codegen -> binary
                                 |
                       unsafe programs stop here
```

<p class="caption">Figure 1: Compiler pipeline</p>
