# Teaching an LLM to operate software that predates it

**Legacy Automation Broker** — C# / .NET 8, Selenium, Edge IE mode
Personal project · in progress · [github.com/sarajmcghee/LegacyAutomation](https://github.com/sarajmcghee/LegacyAutomation)

> An agent that drives a legacy ASP.NET WebForms application through Edge's IE mode, grounded in DOM state rather than screenshots, with every action verified before the next one is allowed.

---

## Problem

A large amount of business-critical software still runs on ASP.NET WebForms behind Internet Explorer mode. It's the software that never got rewritten because rewriting it is expensive and it still works. It has no API. It has no test suite. Its interface is a sequence of full-page postbacks with server-rendered validation, and the only supported way to interact with it is a human clicking through it.

That is exactly the software an LLM agent should be able to operate, and exactly the software that current agent designs handle worst. Screenshot-driven computer-use agents are the popular answer, and on a WebForms app they're the wrong one: they misread a disabled control as enabled, they can't tell a postback from a repaint, and when they're wrong they're confidently wrong. In an insurance or benefits context, a confidently wrong action isn't a bad demo — it's a bad record in a system of record.

I wanted to find out what the reliable version looks like.

## Constraints

I set these before writing any code, because they're what makes the problem interesting:

- **No API, no database access, no source changes to the target.** The UI is the only surface. If it can't be done through the DOM, it can't be done.
- **Every action must be verifiable.** The agent may not proceed on the assumption that a click worked. It has to observe that it worked.
- **The failure path matters more than the happy path.** Anything can walk a form when every field is valid. The real question is what happens when the app rejects input.
- **IE mode is the actual target**, not a stand-in. Edge IE mode via `IEDriverServer` — Windows-only, genuinely awkward, and the thing real legacy apps require.
- **Determinism first, LLM second.** No model in the loop until the primitives underneath it are proven.

## The target

Automating a real employer's application to write about it publicly isn't an option, so I built the target too: `meridian_plan_builder.html`, a 451-line group-benefits plan builder for the fictional **Meridian Assurance Group**. It's a faithful reproduction of the genre rather than a toy — `IE=EmulateIE7`, a hidden `__CURRENTSTEP` field, a multi-step wizard, server-style validation summaries, and simulated postback latency behind a blocking overlay.

Building the target myself turned out to be a design advantage, not just a legal one. I control its failure modes, so I can make it misbehave deliberately and check that the broker notices.

## Architecture

Four layers, each one only allowed to depend on the one below it:

```
  Orchestrator     ← chooses the next action  (roadmap — see below)
       │
  DomStateExtractor ← what is true on the page right now
       │
  BrokerActions     ← one deterministic action, then report back
       │
  DriverFactory     ← Edge IE mode, or Chrome for development
```

**`DomStateExtractor`** is where the project makes its bet. One JavaScript round-trip returns structured state for every `input`, `select`, `textarea` and `button` on the page — id, name, tag, type, value, selected option text, visibility, enabled, checked — plus the current wizard step and the current validation summary text. Visibility resolves through the containing `.stepPanel`, so controls on inactive steps report as hidden rather than as present-but-invisible.

The bet: **ground the agent in DOM state, not screen coordinates.** A screenshot tells you a control looks greyed out. The DOM tells you `enabled: false`. One of those is an inference and one is a fact, and the difference is the entire reliability story.

**`BrokerActions`** holds the deterministic primitives — `SelectByValue`, `SetText`, `SetChecked`, `Click`, `ClickAndWaitForPostback`. No reasoning happens here. Each one does a single thing and reports what happened.

**`DriverFactory`** exposes two modes. `IeMode` is the real one: `InternetExplorerOptions` with `AttachToEdgeChrome = true` and an explicit `EdgeExecutablePath`, per Microsoft's documented approach for driving IE mode in Edge. `LocalChrome` is a development fallback so the extraction and action logic can be exercised on a Mac. The code says plainly that Chrome is not a substitute for verifying against real IE mode, because it isn't.

### The postback problem

This is the detail I'd want to be asked about.

Detecting that a WebForms postback completed is harder than it looks. The obvious approach — click, then wait for the loading overlay to disappear — has a race: the overlay is shown synchronously and hidden on a timer, so if you check before it appears, you read pre-postback state and believe the action succeeded.

So `ClickAndWaitForPostback` waits for the overlay to *appear*, then waits for it to *disappear*. And the case where it never appears isn't an error to swallow — it's information. It means client-side validation blocked the postback. The method returns that as a boolean, which turns a race condition into a usable signal: *the app refused, and here's the proof.*

## What I built

The current milestone is `PlanBuilderScenario` — a hardcoded, deterministic walk through the full wizard. Its job is not to be impressive. Its job is to prove that DOM extraction, actions, and verification are sufficient to drive the app *on their own*, before any model is allowed to choose anything.

It opens by submitting Step 1 **empty**, and asserts that the app blocks navigation and shows a validation summary. The negative path is tested before the positive one. If the broker can't reliably detect rejection, it has no business detecting success — a checker that only ever returns "fine" is worse than no checker, because it launders failure into confidence.

Every step is wrapped in a `DoStep` call that records to an `AuditLog`, serialized to JSON at the end of the run. For any agent that touches a system of record, the trace isn't a nice-to-have; it's the artifact that makes the run reviewable afterward.

## How I evaluated it

The scenario is the evaluation. Each step asserts an expected post-state and throws if the DOM disagrees, so a run is a pass/fail over the whole sequence rather than a script that completes and hopes. Deliberate misbehaviour in the mock — a control that stays disabled, a validation summary that doesn't clear — surfaces as a thrown exception naming the step, not as a silent wrong answer.

**Honest status:** this is a single scenario against a single target. It is not a benchmark, and I'm not going to present it as one. What it establishes is that the primitives hold up; what it doesn't establish is generality across real-world WebForms apps, which vary enormously.

## Results

- End-to-end deterministic run through a multi-step IE-mode wizard, including the rejection path, with a JSON audit trail.
- DOM-state grounding works: enabled/disabled, visibility, validation text and wizard step are all readable as facts rather than inferred from pixels.
- The postback-detection method doubles as validation detection, which removed a whole class of timing bug rather than papering over it.

## Roadmap — not built yet

Stated as roadmap because it is roadmap. Nothing below is implemented.

1. **The Orchestrator.** Replace the hardcoded scenario with an LLM that receives the DOM snapshot and a goal, and returns one action at a time. The deterministic layer stays exactly as it is and becomes the guardrail — the model proposes, the broker verifies, and a proposed action that doesn't produce the expected state change is rejected rather than retried blindly.
2. **Unattended execution.** Running as a Windows service, with no interactive desktop, is the real deployment target and brings its own constraints around session isolation and driver lifetime.
3. **An actual eval set.** Multiple mock targets with seeded failure modes — a control that never enables, a postback that silently no-ops, a validation summary that lies — scored on task completion *and* on correct refusal. Refusal is the metric that matters: an agent that stops when the page isn't what it expected is worth more than one that finishes 5% more often.

## What I'd do differently

Starting with `LocalChrome` as the development path was pragmatic but it deferred the hardest part. IE mode has its own behaviours around focus, zoom and session state, and every day spent on Chrome is a day those stay undiscovered.

I'd also design the audit log as the primary output from the beginning rather than as an addition. For agentic work the trace *is* the product — it's what makes a run reviewable, and it's what an eval harness reads.

---

> **Verify before publishing:** the plan draft described this as a "Session 0" orchestrator, but there's no Session 0 or Windows-service code in the repo as of 2026-08-22 — it's listed above as roadmap item 2. If you have that work elsewhere, it's worth promoting; if it's still an intention, leave it in the roadmap. Don't claim it in the summary line until it runs.
