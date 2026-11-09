---
title: Shine
publishDate: 2026-04-25 00:00:00
priority: 5
img: /assets/work/shine.webp
img_alt: Shine, a photonic circuit simulator
description: |
  A photonic circuit simulator: design optics and the electronics around them, then solve the light exactly. Runs in the browser, on desktop and for AI assistants.
url: https://shine.lupyd.com
githubUrl: https://github.com/ash-hashtag/shine
status: Version 0.1.0 released; sweeps and real units next
stats:
  - value: Exact
    label: interference and resonance, one linear solve
  - value: 4 platforms
    label: browser · Linux · Windows · macOS
  - value: SIMD + LU
    label: circuits compiled per wavelength
  - value: MCP
    label: AI assistants build and simulate
tags:
  - Photonics
  - Simulation
  - Rust
  - WebAssembly
  - Dev
---

Photonic chips already move data between servers in data centres, and
they are starting to do linear algebra for machine learning. Designing
for them usually means expensive device-level tools or a notebook full
of matrices. Shine sits in between: a visual editor where you lay out
lasers, splitters, rings and detectors, wire the electronics that drive
them, and see exactly where the light goes.

It runs in the browser at
[shine.lupyd.com/app](https://shine.lupyd.com/app), as a desktop app on
Linux, Windows and macOS, as a Rust library, and as an MCP server that
lets AI assistants design circuits.

<figure>
  <img src="/assets/work/shine/wdm-link.webp" alt="A 4-channel wavelength-multiplexed optical link in the Shine editor" loading="lazy" width="1400" height="900" />
  <figcaption>Figure 1: Four lasers at 1530–1560 nm share one waveguide through tuned rings, and are split apart again at the receiver</figcaption>
</figure>

## Light, solved exactly

Every optical part is a **scattering matrix** that maps the complex field
on its inputs to its outputs. Shine connects them into one circuit and
solves the steady state as a single linear system, once per wavelength.

- **Interference is right** because fields add, not powers.
- **Loops and resonances** (rings, cavities, a Fabry–Pérot) are solved
  directly, not by bouncing light a fixed number of times.
- **Coherence is explicit.** Lasers on the same shared source interfere;
  independent lasers and different wavelengths add their powers, like
  real separate lasers.

<figure class="diagram">
  <svg viewBox="0 -24 600 270" role="img" aria-label="A Mach–Zehnder interferometer: a laser feeds a splitter, two arms meet again at a combiner, and a phase shift on one arm decides how the light divides between two detectors">
    <rect class="sh-part" x="16" y="166" width="64" height="30" rx="6" />
    <text class="sh-label" x="48" y="185" text-anchor="middle">laser</text>
    <polyline class="sh-beam" style="--p:1" points="80,181 160,181" />
    <polyline class="sh-beam" style="--p:0.5" points="160,181 160,70 440,70" />
    <polyline class="sh-beam" style="--p:0.5" points="160,181 440,181 440,70" />
    <polyline class="sh-beam" style="--p:0.75" points="440,70 528,70" />
    <polyline class="sh-beam" style="--p:0.25" points="440,70 440,24" />
    <line class="sh-split" x1="144" y1="197" x2="176" y2="165" />
    <line class="sh-mirror" x1="144" y1="86" x2="176" y2="54" />
    <line class="sh-mirror" x1="424" y1="197" x2="456" y2="165" />
    <line class="sh-split" x1="424" y1="86" x2="456" y2="54" />
    <rect class="sh-part" x="282" y="54" width="36" height="32" rx="6" />
    <text class="sh-phi" x="300" y="76" text-anchor="middle">φ</text>
    <text class="sh-label" x="160" y="224" text-anchor="middle">splitter</text>
    <text class="sh-label" x="160" y="38" text-anchor="middle">mirror</text>
    <text class="sh-label" x="300" y="38" text-anchor="middle">phase shift</text>
    <text class="sh-label" x="230" y="62" text-anchor="middle">arm 1</text>
    <text class="sh-label" x="300" y="173" text-anchor="middle">arm 2</text>
    <text class="sh-label" x="440" y="224" text-anchor="middle">mirror</text>
    <text class="sh-label" x="430" y="106" text-anchor="end">combiner</text>
    <circle class="sh-det" style="--p:0.75" cx="544" cy="70" r="14" />
    <text class="sh-label" x="544" y="106" text-anchor="middle">det A</text>
    <text class="sh-read" x="544" y="124" text-anchor="middle">cos²(φ/2)</text>
    <circle class="sh-det" style="--p:0.25" cx="440" cy="8" r="14" />
    <text class="sh-label" x="464" y="4">det B</text>
    <text class="sh-read" x="464" y="20">sin²(φ/2)</text>
  </svg>
  <figcaption>Figure 2: A Mach–Zehnder interferometer, the basic switch of photonic chips</figcaption>
</figure>

For speed, each circuit compiles per wavelength into a flat program:
parts on straight paths become **SIMD multiply-adds** over batches of
inputs, and each feedback loop gets an **LU factorisation** computed
once. All independent sources at one wavelength are solved together in a
single vectorised pass, and wavelength sweeps run in parallel on
desktop.

## Optics and electronics in one loop

Lasers, phase shifters and attenuators can be driven by signals, and
detectors feed signals back. Shine evaluates the electronics from the
detector readings, re-solves the light with the new drive values, and
repeats until nothing changes. Registers only change on a clock tick, so
feedback through a register is well defined, and a loop that keeps
flipping is reported as an error rather than guessed.

That is enough to build an 8-bit photonic adder whose sum bits come from
interference, or an accumulator that adds on every clock tick.

<div class="shots">
  <img src="/assets/work/shine/full-adder.webp" alt="A full adder built from interferometers and threshold detectors" loading="lazy" width="1400" height="900" />
  <img src="/assets/work/shine/sweep.webp" alt="A wavelength sweep plotting a ring filter's transmission" loading="lazy" width="1400" height="900" />
  <img src="/assets/work/shine/free-space.webp" alt="A free-space Mach–Zehnder interferometer" loading="lazy" width="1400" height="900" />
  <img src="/assets/work/shine/chips.webp" alt="The examples browser with an optical Fourier transform" loading="lazy" width="1400" height="900" />
</div>

## An editor built for circuits

- **One grid** for free-space parts, component boxes, waveguides and
  signal wires, with Blender-style controls: G to grab, R to rotate,
  Shift+D to duplicate, Shift+A to add.
- **Reusable components.** Any layout becomes a box with light ports and
  signal pins, nested as deep as you like. Edits update every use, and a
  component's pins can be clicked to try it on its own.
- **Sweeps.** Plot every output over a range of wavelengths or one
  parameter, in power or dB, and export the data as CSV.
- **Examples that teach**: a WDM link, Mach–Zehnder and Michelson
  interferometers, a Fabry–Pérot cavity, a coherent XOR gate, and an
  optical Fourier transform on a triangular MZI mesh.

## For AI assistants

`shine-mcp` is a Model Context Protocol server. An assistant can list
the building blocks, simulate a circuit described as JSON, sweep a
filter's spectrum, find the MZI phase settings for a matrix, and save
the result as a `.shine` project a person can open and edit. The whole
documentation is also served as plain text for language models.

## Honest about its limits

Parts are ideal, the simulation is steady-state, and free-space beams
are rays on a grid with no diffraction or polarisation. So Shine is
right about interference, routing, resonance and wavelength behaviour,
which makes it a good place to learn and prototype, but it is not a
replacement for a device-level solver when designing a chip for
fabrication. The roadmap closes that gap in order: real units in mW and
dB, waveguide dispersion and loss, then foundry models.
