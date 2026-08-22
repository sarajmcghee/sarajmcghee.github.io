# My baseline scored 97.8%. I didn't believe it.

**Birdsong classification — an audit of my own result**
Personal project · Python, scikit-learn · [notebook](https://github.com/sarajmcghee/research-portfolio/blob/main/notebooks/pytorch_birdSongs.ipynb)

> A logistic regression scored 97.82% on 85-way bird species classification. This is what happened when I checked whether that number meant anything.

---

## Problem

I was building an audio baseline for a multimodal bird identification project. I took a public dataset of precomputed birdsong features, fit a logistic regression, and got **97.82%** on the held-out test set across 85 species.

That should have felt good. It didn't. Eighty-five classes is a hard problem, the model was a linear classifier on 169 hand-computed features, and there were only 1,760 training rows — about 21 examples per species. Results that good, from a setup that simple, on a problem that hard, are usually a bug or a leak.

There's an asymmetry worth naming here: a model that scores *badly* announces itself. A model that scores suspiciously *well* looks like success, and the only thing standing between it and production is whether somebody bothers to check. So I checked.

## The dataset

Kaggle's `fleanend/birds-songs-numeric-dataset`. Not raw audio — 169 precomputed features per row, chromagram bins and spectral centroids over time windows.

Two things about it were odd before I ran anything:

- **85 species, 66 genera**, with 20–40 training examples each.
- **The split is inverted.** 1,760 train rows against 16,626 test rows — the test set is 9.4× larger than the train set. Nobody splits data that way on purpose. It's the signature of a dataset assembled by segmenting source recordings, where the split happened somewhere other than at the point you'd want it to.

I also want to be precise about what this data is, because the original write-up wasn't: this is **tabular classification on precomputed acoustic features**. It is not audio deep learning, and calling it an "audio model" oversells it.

## Three checks

**1. Reproduce it.** First step was confirming the number wasn't a notebook artifact — stale variables, a scaler fit on the wrong split, evaluating on train by accident. Re-ran clean: `0.9781667`. Exact match. So it's real, and the problem is elsewhere.

**2. Compare against a nearest-neighbour baseline.**

```
1-NN on raw standardized features:   99.2%
Logistic regression:                 97.8%
```

This is the finding. **A 1-nearest-neighbour lookup beat the trained classifier.** When 1-NN wins on an 85-way problem, you are almost never measuring learned discrimination — you're measuring whether each test point has a near-twin sitting in the training set. The "model" is a lookup table with extra steps.

**3. Cross-validate on the training set alone.**

```
5-fold CV on train:   89.3%
Held-out test:        97.8%
```

Held-out accuracy should not *exceed* cross-validated accuracy. When it does, the test set is easier than a random fold of the training data — meaning test rows sit closer to training rows than training rows sit to each other. Measuring it directly confirms this: the median test→train nearest-neighbour distance is only about 1.9× the median intra-train nearest-neighbour distance, in 169-dimensional standardized space.

Three independent checks, one conclusion.

## What's actually going on

The dataset was almost certainly built by cutting each source recording into segments and distributing those segments across train and test. Segments from one recording share a bird, a microphone, a background, and a moment of weather. Chromagram features capture all of that.

So the model isn't learning "what does this species sound like." It's learning "which recording did this clip come from," and species happens to be recoverable from recording identity. The 97.82% is a real measurement of the wrong quantity.

**Two things I want to be clear about.** I didn't create this split — the dataset ships with `train.csv` and `test.csv` already separated. And the leakage isn't detectable by deduplication: I checked for exact duplicate feature vectors across the two files and there are **zero**. The rows aren't copies. They're neighbours. That's why this needed a distance argument rather than a hash check, and it's why a leak like this survives the review most people would actually perform.

## The number I'd report

**~89%**, the 5-fold cross-validated score — and even that is optimistic, because if segments from one recording appear across CV folds too, the folds have the same problem in milder form.

The dataset ships no recording IDs, so a clean split can't be recovered from it. The honest answer to "how well does this identify a species from a novel recording?" is **that this data can't tell you**, and I'd rather say that than publish 97.82%.

To do it properly: raw audio, recording-level identifiers, and `StratifiedGroupKFold` grouped on recording so no recording spans the split. Expect a large drop. The drop is the point — it's the first honest number.

## What I'd do differently

I'd run the 1-NN comparison *first*, before training anything. It costs about four lines, and it establishes the floor that any real model has to clear. If a nearest-neighbour lookup does the job, you don't have a modelling problem, you have a data problem, and you want to find that out on day one rather than after you've written up a result.

More generally, I'd treat a surprisingly good score the way I treat a surprisingly bad one: as something that needs explaining before it needs celebrating.

## Why this is on my portfolio

I could have put 97.82% on a card and moved on. Almost nobody would have checked.

But the failure mode I care about professionally is the one this represents — a system that returns a confident answer that happens to be measuring the wrong thing. That's the expensive failure in production, because it doesn't look like a failure. It looks like it's working.

Catching it in my own work, and publishing the correction rather than the flattering number, is the part of this project worth showing.

---

**Verified 2026-08-22.** All figures re-derived from `pytorch_birdSongs.ipynb` and the source CSVs: reproduced test accuracy 0.9782, train accuracy 1.0000, 5-fold CV 0.8926, 1-NN same-species rate 0.9917 over a 3,000-row test sample, median 1-NN distance 1.203 vs median intra-train 0.648, zero exact-duplicate feature vectors across the split.
