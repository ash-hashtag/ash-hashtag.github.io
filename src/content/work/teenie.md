---
title: Teenie
publishDate: 2026-09-17 00:00:00
priority: 6
img: /assets/work/teenie.webp
img_alt: Teenie, a research model that infers hidden rules
description: |
  A research model that reads 999 examples of a hidden rule on 32-bit integers and answers a new question in one pass, with frozen weights. Failures published too.
url: https://teenie.lupyd.com
githubUrl: https://github.com/ash-hashtag/teenie
status: Ongoing research, every run published at teenie.lupyd.com
stats:
  - value: 939K
    label: parameters, the same at every width up to 32 bits
  - value: 77%
    label: on an unseen 32-bit conditional (lookup 1.1%)
  - value: 99.9%
    label: of confident answers right on the sealed set
  - value: "999"
    label: examples per question, weights frozen
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
  ⋮                                      c ????????  → refine 8 rounds
```

<p class="caption">Figure 1: An 8-bit episode, shortened. The model sees examples and a question, never the rule</p>

## How it answers

<figure>
  <img class="dark-only" src="/assets/work/teenie/architecture-dark.webp" alt="Teenie's bit-token architecture: an example encoder, eight answer-bit tokens, bit layers, memory and readout, repeated for eight rounds" loading="lazy" width="1400" height="780" />
  <img class="light-only" src="/assets/work/teenie/architecture.webp" alt="" loading="lazy" width="1400" height="780" />
  <figcaption>Figure 2: The bit-token model, from <a href="https://teenie.lupyd.com/model/">teenie.lupyd.com/model</a></figcaption>
</figure>

1. **Read the examples once.** Each example's bits go through a small
   bilinear encoder and become one fixed vector, with no reading order.
2. **Hold a guess.** The answer starts undecided, split into one token
   per answer bit, each knowing which bit it is.
3. **Look and correct.** Every round the bit tokens attend to each other,
   so carries can move between positions, then read the examples, then
   pass through a gated layer that can multiply signals. Eight rounds,
   the same weights each time.
4. **Answer honestly.** Confidence is the certainty of the least certain
   bit, so the model can say when it doesn't know.

The current model has 939,001 parameters and the same weights answer
any width up to 32 bits: every layer sees bits relative to their own
position, so nothing depends on the number size.

## Results, next to a fair baseline

Every score is reported beside **lookup**: the best of five methods that
understand nothing (copy the closest example's answer, or match
neighbouring bits across examples), chosen per relation after the fact.
A score only counts where it clearly beats lookup.

| Relation, 32 bits | Teenie | Lookup |
| --- | --- | --- |
| Sealed set: 24 everyday functions, never used for a decision | **37.8%** | 21.4% |
| `a>b ? a−b : a+b`, conditionals never trained | **77.0%** | 1.1% |
| `rotl(a, b&7)`, rotations never trained | **25.2%** | 0.5% |
| 2-operation expressions with a held-out pair | **31.7%** | 19.6% |
| `a*b+b`, a product then one more step | 0% | 0% |

When it is sure, it is almost always right: 99.9% of confident answers on
the sealed set at 32 bits were correct, even where its overall score is
low.

## What failed, and why that's published

The model computes `a*b` on its own, but a product followed by one more
step stays near zero at 32 bits. Trained on just four such relations it
solves them almost perfectly, so the failure is in recognising which
rule the examples come from when there are many candidates, not in the
arithmetic.

Getting here took more than twenty recorded experiments, and the dead
ends are kept: recurrent models on floating-point values, a
conjugate-gradient fitter that turned out to do all the work untrained,
step-by-step supervision that held the model back, and a "program
inference" design that could represent the answers but would not train.
Each one, with its numbers and the command to reproduce it, is on
[teenie.lupyd.com](https://teenie.lupyd.com).

## Built to be checked

- **Fresh problems every step**: episodes are generated, never repeated,
  and held-out relations are excluded by behaviour, so rewrites of them
  are caught too.
- **Adaptive sampling** spends training on the relations it still gets
  wrong.
- **A sealed test set** of 24 functions written separately and evaluated
  once, so the model can't be tuned to it.
- PyTorch with bf16 training on a single RTX 3050, managed with uv,
  strict mypy typing and pytest. The results site is Astro, generated
  from the experiment files.
