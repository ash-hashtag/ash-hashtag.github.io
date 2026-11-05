---
title: Mantis
publishDate: 2024-02-29 00:00:00
img: /assets/work/mantis.webp
img_alt: Programming language compiler interface
description: |
  A memory-safe compiled language inspired by Rust, with its own Cranelift-based compiler, standard library and language server.
githubUrl: https://github.com/ash-hashtag/mantis
status: Work in progress; the borrow checker is being built
stats:
  - value: Cranelift
    label: native code and JIT
  - value: 5 crates
    label: lexer to language server
  - value: LSP
    label: plus a Tree-sitter grammar
  - value: libc FFI
    label: call C directly
tags:
  - Rust
  - Compiler
  - Programming Language
  - Dev
---

Mantis is my attempt at the language I want to write: Rust's safety
without making every program pay the full cost of proving it. The plan
is borrow checking by default, with an escape hatch the compiler can
take for you: it decides per variable whether a value should be owned,
reference-counted or garbage-collected, and lifetimes are more implicit
than in Rust.

It's an ambitious goal and it's far from done. What exists today is a
real compiler that produces native binaries, a standard library written
in Mantis, and the tooling to edit it comfortably.

```ms
type MyEnum = enum {
  None,
  MyStruct(MyStruct),
}

fn main() {
  let my_enum = MyEnum.MyStruct(String.fromStr("Hello World"));

  if MyEnum.MyStruct(ms) = my_enum {
    println(ms.as_str());
  }
}
```

## The compiler

The pipeline is split into crates, so each stage can be tested and
reused on its own:

| Crate | Job |
| --- | --- |
| `syntax` and `parser` | Tokens, the AST, and the in-progress borrow checker |
| `codegen` | Name resolution, scopes, type registries and lowering to Cranelift IR |
| `cli` | The `mantis` command: compile to an object file, or run straight away |
| `lsp` | A language server, so editors understand Mantis code |

Code generation goes through [Cranelift](https://cranelift.dev), the
backend behind Wasmtime. The same IR becomes an object file to link
into a native binary, or is JIT-compiled and run straight away.

```
  source -> lexer -> parser -> checks -> codegen -> binary
                                 |
                       unsafe programs stop here
```

<p class="caption">Figure 1: Compiler pipeline</p>

## The language so far

- **Structs, enums and generics**, with `impl` blocks and pattern
  matching: `Option[T]` and `Result` in the standard library are written
  in Mantis itself.
- **Pointers and lambdas**, with a test suite of small programs covering
  control flow, generics, nested structs and pointers.
- **C interop.** Functions marked `extern` bind straight to libc. One
  example is an HTTP file server built on raw `socket`, `bind`, `listen`
  and `accept` calls.
- **A multithreaded async runtime**, written in Mantis, that spawns
  tasks across worker threads and blocks until they finish.
- **A standard library** covering strings, vectors, files, I/O,
  environment access and TOML parsing.

## Tooling

A language nobody can edit doesn't get used, even by its author. Mantis
ships a Tree-sitter grammar with highlight, indent and text-object
queries, and a one-command script that builds the grammar, validates
every query against real code and installs both it and the language
server into the Helix editor.
