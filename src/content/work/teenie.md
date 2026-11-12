---
title: Teenie
publishDate: 2026-09-17 00:00:00
priority: 6
img: /assets/work/teenie.webp
img_alt: Teenie, a research model that infers hidden rules
description: |
  A research model that reads 999 examples of a hidden rule on 32-bit integers and answers a new question in one pass, with frozen weights. Runs in the browser; failures published too.
url: https://teenie.lupyd.com
githubUrl: https://github.com/ash-hashtag/teenie
status: Ongoing research, every run published at teenie.lupyd.com; the next model, Mega, is planned
stats:
  - value: 1.15M
    label: parameters, the same at every width up to 32 bits
  - value: 93.6%
    label: on an unseen 32-bit conditional (lookup recovers 4.5 of 32 bits)
  - value: 84.8%
    label: on 32-bit (a*b)+a, never trained
  - value: 100%
    label: of fully sure answers right, in 9 of 10 test groups
tags:
  - Machine learning
  - PyTorch
  - Research
  - Python
  - Dev
---

Can a small model work out a rule it has never seen, just from examples?
Each Teenie episode is **999 examples `(a, b, c)` of a hidden relation**
on 16- or 32-bit integers (a random expression, a conditional, a loop)
plus one new `(a, b)`. The model is never told the relation, and its
weights never change while it answers. In a single forward pass it has
to infer the rule and produce every bit of `c`.

At 32 bits a lucky guess is one in four billion, and the 999 examples
cover a vanishing fraction of all inputs, so every right answer has to
come from reasoning over the examples rather than looking one up.

```
  examples (999, rule hidden)          question
  a 10001111  b 00011110  c 11000010
  a 11110001  b 00100001  c 00010001     a 10100101
  a 11110011  b 11111110  c 00011010     b 00100010
  ⋮                                      c ????????  → refine 12 rounds
```

<p class="caption">Figure 1: An 8-bit episode, shortened. The model sees examples and a question, never the rule</p>

## How it answers

<figure>
  <img class="dark-only" src="/assets/work/teenie/architecture-dark.webp" alt="Teenie's bit-token architecture: an example encoder, one token per answer bit, two bit layers, memory and a readout that writes the guess and scratch registers, repeated for twelve rounds" loading="lazy" width="1400" height="752" />
  <img class="light-only" src="/assets/work/teenie/architecture.webp" alt="" loading="lazy" width="1400" height="752" />
  <figcaption>Figure 2: The bit-token model, from <a href="https://teenie.lupyd.com/model/">teenie.lupyd.com/model</a></figcaption>
</figure>

1. **Read the examples once.** Every bit of every example becomes a
   token that sees the numbers relative to its own position, 31 bits
   either side, so the same weights read 8, 16 or 32 bits.
2. **Hold a guess.** The answer starts undecided, one token per answer
   bit, next to two scratch registers the model can write intermediate
   values into.
3. **Look and correct.** Each round runs two bit layers: the answer bits
   attend to each other, so carries and partial products can move
   between positions, read the same bit of all 999 examples, then pass
   through a gated layer that can multiply. After each layer they also
   read 64 worked examples next to their true answers. A memory cell per
   bit carries state on, and the readout writes a new guess and new
   register bits. Twelve rounds, the same weights each time.
4. **Answer honestly.** Confidence is the certainty of the least certain
   bit, and an answer only counts as sure when every bit is at 0.99 or
   above, so the model can say when it doesn't know.

The scratch registers were the change that first let it compute through
a product instead of matching examples. The model has 1,145,339
parameters at width 128, and one set of weights answers every width up
to 32 bits.

## Results, next to a fair baseline

Every score sits beside **lookup**: the best of five methods that
understand nothing (copy the closest example's answer, or match
neighbouring bits across examples), chosen per relation after the fact.
Scores are exact answers, plus how many of the 32 bits come out right
on average, so partial progress shows too.

| Relation, 32 bits | Exact | Bits of 32 | Lookup bits |
| --- | --- | --- | --- |
| `a>b ? a−b : a+b`, conditionals never trained | **93.6%** | 31.4 | 4.5 |
| Held-out single operations | **100.0%** | 32.0 | 21.8 |
| A product, then one more step | **68.9%** | 30.0 | 2.2 |
| Operation types never trained | **73.1%** | 27.2 | 12.0 |
| Hidden compositions | **62.0%** | 27.2 | 4.8 |
| Two operations | **24.6%** | 14.5 | 1.5 |
| Unseen multi-step, the target | 7.1% | 13.6 | 3.7 |

Chains of additions, bitwise operations and shifts hold up at full
width: 98.3% exact for one step and 94.8% for two at 32 bits. When it is
fully sure, it is right: every sure answer was correct in nine of the
ten test groups, and 98.9% in the tenth.

## What failed, and why that's published

A product followed by one more step used to be the wall: `a*b+b` scored
0% at 32 bits. Scratch registers, longer training and twelve rounds
instead of eight took `a*b` to 89.5% exact at 32 bits and the never
trained `(a*b)+a` to 84.8%.

Multiplying values it has computed itself is still open. `(a+b)*a` and
`a*a − b*b` only get their lowest six bits right, chains through a
product drop to 10.6% at 32 bits, and training on such products didn't
help; at 30% of the mix it wore down `a*b`. So the fix has to come from
the model's structure, not more data. Rotations and real bit mixing
stay near chance, and on rotations fitted trees beat it.

Getting here took twenty-eight recorded experiments, and the dead ends
are kept: recurrent models on floating-point values, a 61-parameter
curve fitter that scored the same untrained, step-by-step supervision
that held the model back, a "program inference" design that could
represent the answers but would not train, and a composition grid the
model memorised instead of composing. Each one, with its numbers, is on
[teenie.lupyd.com](https://teenie.lupyd.com).

Next is **Mega**, aimed at computed products, rotations and bit mixing,
longer chains, more inputs, noisy examples and a fair comparison with
TabPFN.

## Built to be checked

- **Fresh problems every step**: episodes are generated, never repeated,
  and held-out relations are excluded by behaviour, so rewrites of them
  are caught too.
- **Adaptive sampling** spends training on the relations it still gets
  wrong.
- **A sealed test set** of 24 functions written separately and evaluated
  once, so the model can't be tuned to it.
- **Open weights**: the release model is on
  [Hugging Face](https://huggingface.co/TheLupyd/teenie), and it
  [runs in the browser](https://teenie.lupyd.com/try/), reading 999
  examples and answering 16 questions on your device.
- PyTorch with bf16 training on a single RTX 3050, managed with uv,
  strict mypy typing and pytest. Every result is one training seed. The
  results site is Astro, generated from the experiment files.
