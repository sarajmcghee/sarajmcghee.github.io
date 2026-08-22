import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import CaseStudyLayout from "../components/CaseStudyLayout.jsx";
import "../styles.css";

function Page() {
  return (
    <CaseStudyLayout
      eyebrow="Case study · personal project"
      title="My baseline scored 97.8%. I didn't believe it."
      standfirst="A logistic regression scored 97.82% on 85-way bird species classification. This is what happened when I checked whether that number meant anything."
      meta={[
        { term: "Stack", value: "Python · scikit-learn · NumPy" },
        { term: "Dataset", value: "Kaggle birds-songs-numeric — 85 species, 169 features" },
        { term: "Verified", value: "August 2026, re-run from the notebook" },
      ]}
      repo="https://github.com/sarajmcghee/research-portfolio"
    >
      <h2>Problem</h2>
      <p>
        I was building an audio baseline for a multimodal bird identification project. I took a
        public dataset of precomputed birdsong features, fit a logistic regression, and got{" "}
        <strong>97.82%</strong> on the held-out test set across 85 species.
      </p>
      <p>
        That should have felt good. It didn't. Eighty-five classes is a hard problem, the model was
        a linear classifier on 169 hand-computed features, and there were only 1,760 training rows
        — about 21 examples per species. Results that good, from a setup that simple, on a problem
        that hard, are usually a bug or a leak.
      </p>
      <blockquote>
        <p>
          A model that scores badly announces itself. A model that scores suspiciously well looks
          like success, and the only thing standing between it and production is whether somebody
          bothers to check.
        </p>
      </blockquote>
      <p>So I checked.</p>

      <h2>The dataset</h2>
      <p>
        Kaggle's <code>fleanend/birds-songs-numeric-dataset</code>. Not raw audio — 169 precomputed
        features per row, chromagram bins and spectral centroids over time windows.
      </p>
      <p>Two things about it were odd before I ran anything.</p>
      <ul>
        <li>
          <strong>85 species, 66 genera</strong>, with 20–40 training examples each.
        </li>
        <li>
          <strong>The split is inverted.</strong> 1,760 train rows against 16,626 test rows — the
          test set is 9.4× larger than the train set. Nobody splits data that way on purpose. It's
          the signature of a dataset assembled by segmenting source recordings, where the split
          happened somewhere other than at the point you'd want it to.
        </li>
      </ul>
      <p>
        I also want to be precise about what this data is, because my original write-up wasn't:
        this is <strong>tabular classification on precomputed acoustic features</strong>. It is not
        audio deep learning, and calling it an "audio model" oversells it.
      </p>

      <h2>Three checks</h2>

      <h3>1. Reproduce it</h3>
      <p>
        First step was confirming the number wasn't a notebook artifact — stale variables, a scaler
        fit on the wrong split, evaluating on train by accident. Re-ran clean:{" "}
        <code>0.9781667</code>. Exact match. So it's real, and the problem is elsewhere.
      </p>

      <h3>2. Compare against a nearest-neighbour baseline</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Method</th>
              <th>Test accuracy</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1-NN on raw standardized features</td>
              <td className="num">99.2%</td>
            </tr>
            <tr>
              <td>Logistic regression</td>
              <td className="num">97.8%</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        This is the finding. <strong>A 1-nearest-neighbour lookup beat the trained classifier.</strong>{" "}
        When 1-NN wins on an 85-way problem, you are almost never measuring learned discrimination
        — you're measuring whether each test point has a near-twin sitting in the training set. The
        "model" is a lookup table with extra steps.
      </p>

      <h3>3. Cross-validate on the training set alone</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Evaluation</th>
              <th>Accuracy</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>5-fold CV on train</td>
              <td className="num">89.3%</td>
            </tr>
            <tr>
              <td>Held-out test</td>
              <td className="num">97.8%</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Held-out accuracy should not <em>exceed</em> cross-validated accuracy. When it does, the
        test set is easier than a random fold of the training data — meaning test rows sit closer
        to training rows than training rows sit to each other. Measuring it directly confirms this:
        the median test→train nearest-neighbour distance is only about 1.9× the median intra-train
        nearest-neighbour distance, in 169-dimensional standardized space.
      </p>
      <p>Three independent checks, one conclusion.</p>

      <h2>What's actually going on</h2>
      <p>
        The dataset was almost certainly built by cutting each source recording into segments and
        distributing those segments across train and test. Segments from one recording share a
        bird, a microphone, a background, and a moment of weather. Chromagram features capture all
        of that.
      </p>
      <p>
        So the model isn't learning "what does this species sound like." It's learning "which
        recording did this clip come from," and species happens to be recoverable from recording
        identity. The 97.82% is a real measurement of the wrong quantity.
      </p>
      <p>
        <strong>Two things I want to be clear about.</strong> I didn't create this split — the
        dataset ships with <code>train.csv</code> and <code>test.csv</code> already separated. And
        the leakage isn't detectable by deduplication: I checked for exact duplicate feature vectors
        across the two files and there are <strong>zero</strong>. The rows aren't copies. They're
        neighbours. That's why this needed a distance argument rather than a hash check, and it's
        why a leak like this survives the review most people would actually perform.
      </p>

      <h2>The number I'd report</h2>
      <p>
        <strong>~89%</strong>, the 5-fold cross-validated score — and even that is optimistic,
        because if segments from one recording appear across CV folds too, the folds have the same
        problem in milder form.
      </p>
      <p>
        The dataset ships no recording IDs, so a clean split can't be recovered from it. The honest
        answer to "how well does this identify a species from a novel recording?" is{" "}
        <strong>that this data can't tell you</strong>, and I'd rather say that than publish 97.82%.
      </p>
      <p>
        To do it properly: raw audio, recording-level identifiers, and{" "}
        <code>StratifiedGroupKFold</code> grouped on recording so no recording spans the split.
        Expect a large drop. The drop is the point — it's the first honest number.
      </p>

      <h2>What I'd do differently</h2>
      <p>
        I'd run the 1-NN comparison <em>first</em>, before training anything. It costs about four
        lines, and it establishes the floor that any real model has to clear. If a
        nearest-neighbour lookup does the job, you don't have a modelling problem, you have a data
        problem, and you want to find that out on day one rather than after you've written up a
        result.
      </p>
      <p>
        More generally, I'd treat a surprisingly good score the way I treat a surprisingly bad one:
        as something that needs explaining before it needs celebrating.
      </p>

      <h2>Why this is on my portfolio</h2>
      <p>
        I could have put 97.82% on a card and moved on. Almost nobody would have checked.
      </p>
      <p>
        But the failure mode I care about professionally is the one this represents — a system that
        returns a confident answer that happens to be measuring the wrong thing. That's the
        expensive failure in production, because it doesn't look like a failure. It looks like it's
        working.
      </p>
      <p>
        Catching it in my own work, and publishing the correction rather than the flattering number,
        is the part of this project worth showing.
      </p>

      <h2>Figures</h2>
      <p className="text-[0.9rem] text-muted">
        All re-derived from the notebook and source CSVs: reproduced test accuracy 0.9782, train
        accuracy 1.0000, 5-fold CV 0.8926, 1-NN same-species rate 0.9917 over a 3,000-row test
        sample, median 1-NN distance 1.203 against median intra-train 0.648, zero exact-duplicate
        feature vectors across the split.
      </p>
    </CaseStudyLayout>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Page />
  </StrictMode>
);
