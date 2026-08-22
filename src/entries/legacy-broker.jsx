import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import CaseStudyLayout from "../components/CaseStudyLayout.jsx";
import "../styles.css";

function Page() {
  return (
    <CaseStudyLayout
      eyebrow="Case study · personal project"
      title="Teaching an LLM to operate software that predates it"
      standfirst="An agent that drives a legacy ASP.NET WebForms application through Edge's IE mode, grounded in DOM state rather than screenshots, with every action verified before the next one is allowed."
      meta={[
        { term: "Stack", value: "C# · .NET 8 · Selenium · Edge IE mode" },
        { term: "Status", value: "Deterministic layer working; orchestrator in progress" },
        { term: "Role", value: "Everything, including the target application" },
      ]}
      repo={null}
    >
      <h2>Problem</h2>
      <p>
        A large amount of business-critical software still runs on ASP.NET WebForms behind
        Internet Explorer mode. It's the software that never got rewritten because rewriting it
        is expensive and it still works. It has no API. It has no test suite. Its interface is a
        sequence of full-page postbacks with server-rendered validation, and the only supported
        way to interact with it is a human clicking through it.
      </p>
      <p>
        That is exactly the software an LLM agent should be able to operate, and exactly the
        software that current agent designs handle worst. Screenshot-driven computer-use agents
        are the popular answer, and on a WebForms app they're the wrong one: they misread a
        disabled control as enabled, they can't tell a postback from a repaint, and when they're
        wrong they're confidently wrong. In an insurance or benefits context, a confidently wrong
        action isn't a bad demo — it's a bad record in a system of record.
      </p>
      <p>I wanted to find out what the reliable version looks like.</p>

      <h2>Constraints</h2>
      <p>I set these before writing any code, because they're what makes the problem interesting.</p>
      <ul>
        <li>
          <strong>No API, no database access, no source changes to the target.</strong> The UI is
          the only surface. If it can't be done through the DOM, it can't be done.
        </li>
        <li>
          <strong>Every action must be verifiable.</strong> The agent may not proceed on the
          assumption that a click worked. It has to observe that it worked.
        </li>
        <li>
          <strong>The failure path matters more than the happy path.</strong> Anything can walk a
          form when every field is valid. The real question is what happens when the app rejects
          input.
        </li>
        <li>
          <strong>IE mode is the actual target</strong>, not a stand-in — Edge IE mode via{" "}
          <code>IEDriverServer</code>, Windows-only, genuinely awkward, and the thing real legacy
          apps require.
        </li>
        <li>
          <strong>Determinism first, LLM second.</strong> No model in the loop until the
          primitives underneath it are proven.
        </li>
      </ul>

      <h2>The target</h2>
      <p>
        Automating a real employer's application to write about it publicly isn't an option, so I
        built the target too. <code>meridian_plan_builder.html</code> is a 451-line group-benefits
        plan builder for the fictional <strong>Meridian Assurance Group</strong>. It reproduces
        the genre rather than a toy version of it: <code>IE=EmulateIE7</code>, a hidden{" "}
        <code>__CURRENTSTEP</code> field, a multi-step wizard, server-style validation summaries,
        and simulated postback latency behind a blocking overlay.
      </p>
      <p>
        Building the target myself turned out to be a design advantage, not just a legal one. I
        control its failure modes, so I can make it misbehave deliberately and check that the
        broker notices.
      </p>

      <h2>Architecture</h2>
      <p>Four layers, each only allowed to depend on the one below it.</p>
      <pre>
        <code>{`Orchestrator      ← chooses the next action   (roadmap)
     │
DomStateExtractor ← what is true on the page now
     │
BrokerActions     ← one deterministic action, then report back
     │
DriverFactory     ← Edge IE mode, or Chrome for development`}</code>
      </pre>

      <h3>DOM state, not pixels</h3>
      <p>
        <code>DomStateExtractor</code> is where the project makes its bet. One JavaScript
        round-trip returns structured state for every <code>input</code>, <code>select</code>,{" "}
        <code>textarea</code> and <code>button</code> on the page — id, name, tag, type, value,
        selected option text, visibility, enabled, checked — plus the current wizard step and the
        current validation summary text. Visibility resolves through the containing{" "}
        <code>.stepPanel</code>, so controls on inactive steps report as hidden rather than as
        present-but-invisible.
      </p>
      <blockquote>
        <p>
          A screenshot tells you a control looks greyed out. The DOM tells you{" "}
          <code>enabled: false</code>. One of those is an inference and one is a fact, and the
          difference is the entire reliability story.
        </p>
      </blockquote>

      <h3>The postback problem</h3>
      <p>This is the detail I'd want to be asked about.</p>
      <p>
        Detecting that a WebForms postback completed is harder than it looks. The obvious approach
        — click, then wait for the loading overlay to disappear — has a race: the overlay is shown
        synchronously and hidden on a timer, so if you check before it appears, you read
        pre-postback state and believe the action succeeded.
      </p>
      <p>
        So <code>ClickAndWaitForPostback</code> waits for the overlay to <em>appear</em>, then
        waits for it to <em>disappear</em>. And the case where it never appears isn't an error to
        swallow — it's information. It means client-side validation blocked the postback. The
        method returns that as a boolean, which turns a race condition into a usable signal:{" "}
        <em>the app refused, and here's the proof.</em>
      </p>

      <h2>What I built</h2>
      <p>
        The current milestone is <code>PlanBuilderScenario</code>, a hardcoded, deterministic walk
        through the full wizard. Its job is not to be impressive. Its job is to prove that DOM
        extraction, actions, and verification are sufficient to drive the app <em>on their own</em>
        , before any model is allowed to choose anything.
      </p>
      <p>
        It opens by submitting Step 1 <strong>empty</strong>, and asserts that the app blocks
        navigation and shows a validation summary. The negative path is tested before the positive
        one. If the broker can't reliably detect rejection, it has no business detecting success —
        a checker that only ever returns "fine" is worse than no checker, because it launders
        failure into confidence.
      </p>
      <p>
        Every step is wrapped in a <code>DoStep</code> call that records to an{" "}
        <code>AuditLog</code>, serialized to JSON at the end of the run. For any agent that touches
        a system of record, the trace isn't a nice-to-have; it's the artifact that makes the run
        reviewable afterward.
      </p>

      <h2>How I evaluated it</h2>
      <p>
        The scenario is the evaluation. Each step asserts an expected post-state and throws if the
        DOM disagrees, so a run is a pass/fail over the whole sequence rather than a script that
        completes and hopes. Deliberate misbehaviour in the mock — a control that stays disabled, a
        validation summary that doesn't clear — surfaces as a thrown exception naming the step, not
        as a silent wrong answer.
      </p>
      <p>
        <strong>Honest status:</strong> this is a single scenario against a single target. It is
        not a benchmark and I'm not going to present it as one. What it establishes is that the
        primitives hold up. What it doesn't establish is generality across real-world WebForms
        apps, which vary enormously.
      </p>

      <h2>Results</h2>
      <ul>
        <li>
          End-to-end deterministic run through a multi-step IE-mode wizard, including the rejection
          path, with a JSON audit trail.
        </li>
        <li>
          DOM-state grounding works: enabled/disabled, visibility, validation text and wizard step
          are all readable as facts rather than inferred from pixels.
        </li>
        <li>
          The postback-detection method doubles as validation detection, which removed a whole
          class of timing bug rather than papering over it.
        </li>
      </ul>

      <h2>Roadmap — not built yet</h2>
      <p>Stated as roadmap because it is roadmap. Nothing below is implemented.</p>
      <ol>
        <li>
          <strong>The Orchestrator.</strong> Replace the hardcoded scenario with an LLM that
          receives the DOM snapshot and a goal and returns one action at a time. The deterministic
          layer stays exactly as it is and becomes the guardrail — the model proposes, the broker
          verifies, and a proposed action that doesn't produce the expected state change is
          rejected rather than retried blindly.
        </li>
        <li>
          <strong>Unattended execution.</strong> Running as a Windows service, with no interactive
          desktop, is the real deployment target and brings its own constraints around session
          isolation and driver lifetime.
        </li>
        <li>
          <strong>An actual eval set.</strong> Multiple mock targets with seeded failure modes — a
          control that never enables, a postback that silently no-ops, a validation summary that
          lies — scored on task completion <em>and</em> on correct refusal. Refusal is the metric
          that matters: an agent that stops when the page isn't what it expected is worth more than
          one that finishes 5% more often.
        </li>
      </ol>

      <h2>What I'd do differently</h2>
      <p>
        Starting with the Chrome development path was pragmatic but it deferred the hardest part.
        IE mode has its own behaviours around focus, zoom and session state, and every day spent on
        Chrome is a day those stay undiscovered.
      </p>
      <p>
        I'd also design the audit log as the primary output from the beginning rather than as an
        addition. For agentic work the trace <em>is</em> the product — it's what makes a run
        reviewable, and it's what an eval harness reads.
      </p>
    </CaseStudyLayout>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Page />
  </StrictMode>
);
