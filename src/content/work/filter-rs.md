---
title: Filter
publishDate: 2024-11-22 00:00:00
priority: 7
img: /assets/work/filter.webp
img_alt: Real-time log processing interface
description: |
  A terminal UI that wraps any long-running command and filters its output live, with regex, while it keeps running. Written in Rust with ratatui.
githubUrl: https://github.com/ash-hashtag/filter-rs
status: Open source (MIT), installable with cargo
stats:
  - value: Any command
    label: wrapped, not piped
  - value: Live
    label: filtering while it runs
  - value: Regex
    label: pattern matching
  - value: Bounded
    label: paged ring buffer
tags:
  - Rust
  - TUI
  - CLI
  - Dev
---

Long-running dev commands are loud. `flutter run`, `adb logcat` and
`docker logs -f` print thousands of lines a minute, and the one line you
care about scrolls past before you can read it. Piping into `grep` means
choosing the pattern up front and restarting the command to change it.

Filter flips that around. You put it in front of the command, and it
keeps the whole stream while showing only what matches. Change the
pattern as often as you like; the command keeps running.

```bash
cargo install filter-rs

filter flutter run
filter docker logs -f api
filter python app.py
```

<div class="shots">
  <img src="/assets/work/filter-rs/1.webp" alt="Filter wrapping a command, showing its full output" loading="lazy" width="1280" height="720" />
  <img src="/assets/work/filter-rs/2.webp" alt="Filter narrowing adb logcat output to lines matching a search" loading="lazy" width="1280" height="720" />
</div>

## How it works

- **It owns the process.** Filter spawns the command itself, with one
  thread each reading stdout and stderr and one writing to its stdin,
  so it captures everything from the first line and exits with it.
- **A paged ring buffer.** Output is stored in fixed-size pages (32
  pages of 64 KB by default, or set a cap like `--max-buffer-size 1GB`).
  When the buffer is full the oldest page is dropped, so memory stays
  bounded however long the command runs.
- **Filter versus search.** A filter hides every line that doesn't
  match; a search keeps everything visible and jumps between matches.
  Both take plain text or a regex, and both apply to the whole buffer,
  so changing the pattern rewrites the view instantly.
- **Parallel matching.** Finding every match fans out across the buffer
  pages with Rayon, so re-filtering a full buffer stays interactive.
- **Keyboard-driven**: `j` and `k` to move, `space` for the menu,
  `Ctrl+q` to quit, and autoscroll and line numbers toggled from the
  status bar.

<figure>
  <img src="/assets/work/filter-rs/3.webp" alt="Pattern matching with highlighted results in Filter" loading="lazy" width="1280" height="720" />
  <figcaption>Figure 1: Pattern matching with highlights</figcaption>
</figure>

The TUI is built with [ratatui](https://ratatui.rs), and Filter can log
its own diagnostics to a file set by `FILTER_LOG_FILE`, so debugging it
never pollutes the screen it draws.
