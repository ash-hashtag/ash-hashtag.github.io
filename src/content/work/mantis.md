---
title: Mantis
publishDate: 2024-02-29 00:00:00
img: /assets/work/mantis.webp
img_alt: Programming language compiler interface
description: |
  A memory-safe compiled language inspired by Rust, with its own Cranelift-based compiler, borrow checker, macros and language server.
githubUrl: https://github.com/ash-hashtag/mantis
status: Work in progress; borrow checking, macros and async work today
stats:
  - value: Cranelift
    label: native code and JIT
  - value: No lifetimes
    label: borrows inferred, even across calls
  - value: "65"
    label: error codes, each with --explain
  - value: LSP
    label: plus a Tree-sitter grammar
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
real compiler that produces native binaries, a borrow checker that needs
no lifetime annotations, macros written in Mantis itself, async
functions, and the tooling to edit it comfortably. Every snippet on this
page compiles with it.

```mantis
use std;

type Shape = enum {
    Circle(i64),
    Square(i64),
}

impl Shape {
    fn area(self &Shape) i64 {
        match self {
            Shape.Circle(r) : { return 3 * r * r; },
            Shape.Square(s) : { return s * s; }
        }
    }
}

fn largest(shapes &Vec[Shape]) Option[i64] {
    mut best Option[i64] = Option.None;
    mut i = 0;
    loop {
        if i == shapes.len() {
            break;
        }
        let a = shapes.get(i).area();
        if best.is_none() || a > best.unwrap() {
            best = Option.Some(a);
        }
        i = i + 1;
    }
    return best;
}

fn main() i32 {
    mut shapes = Vec.new[Shape]();
    shapes.push(Shape.Circle(2));
    shapes.push(Shape.Square(4));
    print_int(largest(&shapes).unwrap_or(0)); // 16
    return 0;
}
```

No `:` before types, no `->` before the return type, one `loop` instead
of `while` and `for`, and `elif` instead of `else if`. `Option` and
`Vec` are plain Mantis in the standard library.

## Borrowing without lifetimes

A place has either any number of shared borrows or one mutable borrow,
and a borrow lives until its last use, as in Rust. The difference is
that Mantis has no lifetime syntax at all. The compiler reads each
function's body and works out which parameters its result can borrow
from, so a call only ties up what it really uses:

```mantis
fn pick(a &i64, b &i64) &i64 {
    return a;
}

fn main() i32 {
    mut x = 1;
    mut y = 2;
    let r = pick(&x, &y);
    y = 5; // fine: the result never borrows from `b`
    x = 3; // error: `r` still points at `x`
    return @r as i32;
}
```

```mantisc
error[E0303]: cannot assign to `x` because it is borrowed by `r`
  --> pick.ms:10:5
   |
10 |     x = 3; // error: `r` still points at `x`
   |     ^
   |
   = note: the borrow is used later, so the value must not change underneath it
   = explain: run `mantisc --explain E0303`
```

Every error has a stable code, and `mantisc --explain` prints the rule
behind it, an example that triggers it and the fix. Checked references
(`&T`, `&mut T`, read with `@r`) are kept apart from raw pointers
(`@T`), and raw pointers are only allowed in packages that opt in from
their `mantis.toml`, the way the standard library does to implement
`Vec` and `String`.

Values are dropped exactly once, by their last owner, even when they
were moved on only some paths:

```mantis
use std;

type Conn = struct { id i64 }

impl Drop for Conn {
    fn drop(self &mut Conn) {
        print_str("closed ");
        print_int(self.id);
    }
}

fn keep(c Conn) Conn {
    return c;
}

fn main() i32 {
    let a = Conn { id: 1 };
    let kept = keep(Conn { id: 2 });
    return 0; // closed 2, closed 1
}
```

## Macros are just Mantis

A macro is an ordinary function whose name starts with `#`. It runs
while compiling, and whatever it returns replaces the call: a value,
statements, or whole declarations built with `#quote`.

```mantis
use std;

// `#fib(20)` becomes the literal 6765
fn #fib(n i64) i64 {
    mut a = 0;
    mut b = 1;
    mut i = 0;
    loop {
        if i == n {
            break;
        }
        let next = a + b;
        a = b;
        b = next;
        i = i + 1;
    }
    return a;
}

// one getter per field, for any struct
fn #getters(s $Struct) $Tokens {
    mut out = #quote {};
    mut i = 0;
    loop {
        if i == s.fields.len() {
            break;
        }
        let f = s.fields.get(i);
        let getter = #ident("get_" + f.name);
        let field = f.name;
        let ty = f.ty;
        out = out + #quote {
            fn $getter(self &$s) $ty {
                return self.$field;
            }
        };
        i = i + 1;
    }
    return #quote { impl $s { $out } };
}

type Point = struct { x i64, y i64 }

#getters(Point);
#derive(Point, Debug);

fn main() i32 {
    let p = Point { x: 3, y: #fib(20) };
    p.debug(); // Point { x: 3, y: 6765 }
    return (p.get_y() - 6765) as i32;
}
```

## Async without a runtime in the compiler

`async fn` compiles to a future, and `.await` inside one suspends the
function until the value is ready. Anything with a `poll` method can be
awaited, so timers and I/O readiness are ordinary types, and the
multithreaded scheduler is written in Mantis.

```mantis
type Sleep = struct { ticks i32, value i32 }

impl Sleep {
    fn poll(self &mut Sleep) Poll[i32] {
        if self.ticks > 0 {
            self.ticks = self.ticks - 1;
            return Poll.Pending;
        }
        return Poll.Ready(self.value);
    }
}

async fn fetch(id i32) i32 {
    return Sleep { ticks: id, value: id * 10 }.await;
}

async fn total(n i32) i32 {
    mut sum = 0;
    mut i = 1;
    loop {
        if i > n {
            break;
        }
        sum = sum + fetch(i).await; // suspends here until ready
        i = i + 1;
    }
    return sum;
}
```

## Talking to C

Functions marked `extern` bind straight to libc. One example is an HTTP
file server built on raw `socket`, `bind`, `listen` and `accept` calls.

```mantis
use std;

fn getpid() i32 extern;
fn write(fd i64, data i64, count i64) i64 extern;

fn main() i32 {
    let msg = "hello from mantis\n";
    write(1, msg.pointer, msg.len);
    print_int(getpid() as i64);
    return 0;
}
```

## The compiler

The pipeline is split into crates, so each stage can be tested and
reused on its own:

| Crate | Job |
| --- | --- |
| `parser` | Tokens, the AST, configuration and the borrow checker |
| `macros` | An interpreter that runs `#` functions at compile time |
| `codegen` | Name resolution, generics, drops, async frames and lowering to Cranelift IR |
| `cli` | `mantisc`: build an object file, a binary or a library, or run straight away |
| `lsp` and `syntax` | A language server and highlighting, so editors understand Mantis |

Code generation goes through [Cranelift](https://cranelift.dev), the
backend behind Wasmtime. The same IR becomes an object file to link
into a native binary, or is JIT-compiled and run straight away.

```
  source -> lexer -> parser -> macros -> borrow check -> codegen -> binary
                                              |
                                    unsafe programs stop here
```

<p class="caption">Figure 1: Compiler pipeline</p>

A standard library written in Mantis covers strings, vectors, boxes,
files, I/O, environment access, formatting and TOML parsing, and a test
suite of small programs checks the language, the borrow checker and the
macros against their expected output.

## Tooling

A language nobody can edit doesn't get used, even by its author. Mantis
ships a Tree-sitter grammar with highlight, indent and text-object
queries, and a one-command script that builds the grammar, validates
every query against real code and installs both it and the language
server into the Helix editor.
