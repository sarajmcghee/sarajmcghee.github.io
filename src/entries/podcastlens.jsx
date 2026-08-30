import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import CaseStudyLayout from "../components/CaseStudyLayout.jsx";
import "../styles.css";

function Page() {
  return (
    <CaseStudyLayout
      eyebrow="Case study · personal project"
      title="The bill is a failure mode"
      standfirst="A serverless podcast transcription and search pipeline on AWS, designed around the one line item that can quietly cost you $1,728."
      meta={[
        { term: "Stack", value: "AWS Lambda · Transcribe · Comprehend · DynamoDB · CloudFormation" },
        { term: "Runs at", value: "$0/month inside the free tier" },
        { term: "Role", value: "Everything — infrastructure, pipeline, front end" },
      ]}
      repo="https://github.com/sarajmcghee/podcastlens"
    >
      <h2>Problem</h2>
      <p>
        I wanted a searchable archive of the podcasts I listen to: subscribe to a feed, and when a
        new episode appears, transcribe it, pull out the topics and named entities, and make the
        whole thing searchable with a weekly digest by email.
      </p>
      <p>
        I also wanted to learn AWS properly rather than by flashcard, so I set a second constraint:
        it had to touch most of the services the Solutions Architect exam actually asks about, and
        it had to cost nothing to run.
      </p>
      <p>
        Those two constraints turned out to be the same constraint. Building something that costs
        nothing on a metered platform is not a budgeting exercise — it&rsquo;s a design one.
      </p>

      <h2>The expensive failure</h2>
      <p>
        Amazon Transcribe costs <strong>$0.024 per audio-minute</strong> after a free tier of 60
        minutes a month. That sounds harmless until you write down what the system could do to
        itself:
      </p>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Scenario</th>
              <th>Audio minutes</th>
              <th>Cost</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Six 10-minute clips — the default</td>
              <td className="num">60</td>
              <td className="num">$0.00</td>
            </tr>
            <tr>
              <td>One full four-hour episode</td>
              <td className="num">240</td>
              <td className="num">$5.76</td>
            </tr>
            <tr>
              <td>A 400-episode back catalogue at 3h each</td>
              <td className="num">72,000</td>
              <td className="num">$1,728</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>
        That last row is the whole design problem. Subscribing to one podcast with a long back
        catalogue is a completely ordinary thing for a user to do, and the naive version of this
        system responds by spending seventeen hundred dollars without asking anyone.
      </p>
      <blockquote>
        <p>
          A runaway bill is a failure that doesn&rsquo;t look like one while it&rsquo;s happening.
          Nothing crashes, no alarm fires, every job succeeds — and that is exactly the shape of
          failure I care most about catching.
        </p>
      </blockquote>

      <h2>Four guardrails, at different layers</h2>
      <p>
        One check would have been a single point of failure, so the budget is defended at four
        independent levels — configuration, data, application, and account:
      </p>
      <ul>
        <li>
          <strong>Clip length.</strong> Only the first 10 minutes of each episode is transcribed,
          fetched with an HTTP <code>Range</code> request. An MP3 is a flat sequence of independent
          frames, so a prefix of the file is still perfectly playable audio that simply stops early
          — no decoding, no re-encoding, and only a few megabytes leave S3.
        </li>
        <li>
          <strong>An atomic monthly counter</strong> in DynamoDB that refuses work once the
          month&rsquo;s budget is spent.
        </li>
        <li>
          <strong>A cap on episodes per poll</strong>, defaulting to one, so a back catalogue can
          never flood the queue in a single pass.
        </li>
        <li>
          <strong>An AWS Budget</strong> that emails at 50% of $5 and on any forecast overrun —
          the backstop for the case where my own logic is the thing that&rsquo;s wrong.
        </li>
      </ul>

      <h3>Reserve before spending, not after</h3>
      <p>
        The counter is the part worth reading closely, because the obvious implementation is subtly
        broken. Reading the current usage, deciding there&rsquo;s room, and then starting the job
        leaves a window: two Lambdas draining the same SQS queue can both read 2,900 seconds, both
        conclude they have room, and together sail past the cap.
      </p>
      <p>
        So the budget is claimed <em>before</em> the job starts, as a conditional atomic update —
        DynamoDB&rsquo;s <code>ADD</code> with a condition on the resulting value. The reservation
        either succeeds or it doesn&rsquo;t, and a failed condition means the work never begins:
      </p>
      <pre>
        <code>{`UpdateExpression="ADD usedSeconds :s SET #t = :type",
ConditionExpression="attribute_not_exists(usedSeconds)
                     OR usedSeconds <= :cap",`}</code>
      </pre>
      <p>
        It&rsquo;s the same instinct as testing the rejection path before the happy path: decide
        what the system must refuse, and make refusal the thing that&rsquo;s hard to get wrong.
      </p>

      <h2>Architecture</h2>
      <pre>
        <code>{`EventBridge ──6h──▶ Poller λ ──▶ SQS ──▶ DLQ
                                 │
                                 ▼
                          Processor λ ──▶ clip to S3 ──▶ Transcribe
                                                             │
                        DynamoDB ◀── Completer λ ◀───────────┘
                        (1 table)        │
                                         ▼
                                    Comprehend

Browser ─▶ CloudFront (OAC) ─▶ private S3
   └─ Cognito JWT ─▶ API Gateway ─▶ API λ ─▶ DynamoDB`}</code>
      </pre>

      <h3>Decisions worth defending</h3>
      <ul>
        <li>
          <strong>A queue between polling and processing.</strong> Transcription is slow and
          failure-prone; discovery is neither. SQS decouples them and gives failed episodes a
          dead-letter queue instead of a silent disappearance.
        </li>
        <li>
          <strong>Event-driven completion, not polling.</strong> The Completer runs off Transcribe&rsquo;s
          job-state-change event rather than asking repeatedly whether the job is done. No idle
          billing, and no timeout to tune.
        </li>
        <li>
          <strong>One DynamoDB table.</strong> Feeds, episodes and the budget counter share a table
          with a composite key. A relational schema would have been more familiar to me and worse
          here — the access patterns are all key lookups.
        </li>
        <li>
          <strong>Private S3 behind CloudFront with Origin Access Control</strong>, so the bucket is
          never public. This is the pattern the exam asks about and also simply the correct one.
        </li>
        <li>
          <strong>No build step anywhere.</strong> Every Lambda uses only the standard library plus
          the <code>boto3</code> already in the runtime, and the front end is vanilla JS. Nothing
          to compile means nothing to break between me and a deploy.
        </li>
      </ul>

      <h2>How I tested it</h2>
      <p>
        Ten tests, and they cover exactly one thing: the clip-sizing and byte-limiting logic that
        decides how much audio — and therefore how much money — each episode costs. They stub out
        boto3 entirely, so they run offline with no credentials and no charges.
      </p>
      <p>
        That&rsquo;s a deliberate choice about where test effort earns its keep. I didn&rsquo;t
        write tests for the RSS parser, because a parsing bug shows up immediately and costs
        nothing. I wrote them for the arithmetic that stands between a user and a four-figure bill,
        because that bug would be silent and expensive, and by the time it surfaces the money is
        already gone.
      </p>

      <h2>Results</h2>
      <ul>
        <li>
          Runs at <strong>$0.00/month</strong> as configured — with the line-by-line free-tier
          accounting written down in <code>docs/COSTS.md</code>, including which allowances are
          &ldquo;always free&rdquo; and which quietly expire twelve months after you opened the
          account.
        </li>
        <li>
          Three CloudFormation stacks, deployable with one script and removable with another. The
          teardown script matters: a study project you can&rsquo;t fully delete is a study project
          that keeps billing you.
        </li>
        <li>
          The templates are written to be read. Every resource carries a comment explaining not
          just what it is but why it&rsquo;s shaped that way.
        </li>
      </ul>

      <h2>What I&rsquo;d do differently</h2>
      <ul>
        <li>
          <strong>Chunk long episodes rather than truncating them.</strong> The 10-minute clip is a
          cost guardrail wearing a product decision&rsquo;s clothing. The honest version transcribes
          the whole episode in segments with a per-user budget.
        </li>
        <li>
          <strong>Evaluate the search, not just ship it.</strong> Comprehend&rsquo;s topics and
          entities are taken on trust here. I have no measure of whether the terms it extracts are
          the terms someone would actually search for — which, given the rest of my work, is the
          gap I&rsquo;d close first.
        </li>
        <li>
          <strong>Load-test the poller against a large back catalogue</strong> rather than reasoning
          about it. The guardrails are correct as far as I can tell by reading them, and reading is
          not the same as knowing.
        </li>
      </ul>
    </CaseStudyLayout>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Page />
  </StrictMode>
);
