import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import CaseStudyLayout from "../components/CaseStudyLayout.jsx";
import "../styles.css";

function Page() {
  return (
    <CaseStudyLayout
      eyebrow="Case study · company hackathon winner, 2025"
      title="Onboarding is a retrieval problem"
      standfirst="A knowledge assistant for new billing specialists, built on Azure AI Foundry over a corpus that started life as Word documents and Excel workbooks."
      meta={[
        { term: "Stack", value: "Azure AI Foundry · Blob Storage · AI Search · Power Platform" },
        { term: "My part", value: "Ingestion pipeline, indexing, retrieval and generation" },
        { term: "Outcome", value: "Won the hackathon; not staffed beyond it" },
      ]}
      repo={null}
    >
      <h2>Why there&rsquo;s no code on this page</h2>
      <p>
        I built this at work, for my employer&rsquo;s hackathon. The code is theirs, not mine, so
        this page is a description rather than a repository — the problem, the decisions, and what
        I&rsquo;d change.
      </p>
      <p>
        I&rsquo;d rather say that plainly than gesture at something impressive and vague. My other
        two case studies are mine end to end, with code you can read. This one is the work
        I&rsquo;m proudest of that I can&rsquo;t hand you.
      </p>

      <h2>Problem</h2>
      <p>
        New billing specialists don&rsquo;t struggle with the work. They struggle with{" "}
        <strong>where the knowledge lives.</strong> Procedures, policy documents, and a great deal
        of undocumented practice sit in different places, and none of it is indexed by the question
        a new person actually asks. So the ramp cost is two things at once: the new hire is slow,
        and the experienced person beside them is being interrupted to answer the question they
        answered last month.
      </p>
      <blockquote>
        <p>
          That&rsquo;s a retrieval problem wearing a training problem&rsquo;s clothes. It
          doesn&rsquo;t need a better handbook. It needs a way to ask a question in your own words
          and get an answer with the source attached.
        </p>
      </blockquote>

      <h2>Constraints</h2>
      <ul>
        <li>
          <strong>Nothing leaves the tenant.</strong> Insurance, so this isn&rsquo;t negotiable, and
          it rules out most of the obvious hosted options.
        </li>
        <li>
          <strong>No fine-tuning budget and no time for one.</strong> Hackathon timebox.
        </li>
        <li>
          <strong>Every answer cites a source, or it&rsquo;s worthless.</strong> An unsourced answer
          about billing policy is worse than no answer — a new specialist can&rsquo;t distinguish a
          correct answer from a confident one, which makes them exactly the population you least
          want guessing.
        </li>
        <li>
          <strong>Someone else was building the interface in parallel</strong>, so the retrieval
          side had to expose something stable early rather than at the end.
        </li>
      </ul>

      <h2>The corpus didn&rsquo;t start as a corpus</h2>
      <p>
        This is the part most retrieval projects skip, because most retrieval projects start from
        data that arrived tidy. Mine didn&rsquo;t.
      </p>
      <p>
        The source knowledge existed as <strong>Word documents and Excel workbooks</strong> — which
        is how enterprise knowledge actually exists, rather than how tutorials assume it does. I
        built a <strong>Power Platform workflow</strong> to transform them into structured JSON, and
        that normalized output is what landed in Blob Storage and got indexed.
      </p>
      <h3>Word and Excel fail differently</h3>
      <p>
        A Word procedure document has an implicit hierarchy — headings, steps, sequence — that
        survives extraction reasonably well. A spreadsheet doesn&rsquo;t. A row means nothing
        without its header, and a cell means nothing without its row. Flatten a worksheet naively
        and you get text that is locally grammatical and globally meaningless, which is the worst
        possible input to an embedding model, because it produces confident nonsense rather than
        obvious garbage.
      </p>
      <h3>Normalizing first made everything downstream simpler</h3>
      <p>
        Converting to JSON once, up front, meant the indexer saw one shape instead of two — and it
        meant the transformation was inspectable. I could look at what a document had become before
        asking a model to reason over it. Retrieval quality problems usually turn out to be
        ingestion problems, and you can only see that if the intermediate form is something you can
        read.
      </p>

      <h2>Architecture</h2>
      <pre>
        <code>{`Word + Excel source documents
     ↓  Power Platform workflow — transform to structured JSON
Azure Blob Storage    — normalized corpus, inside the tenant
     ↓  indexer + chunking
Azure AI Search       — hybrid index: vector + keyword
     ↓  retrieve top-k
Azure AI Foundry      — generation, grounded, citations required
     ↓
chat agent embedded in the workflow site onboarders already used`}</code>
      </pre>

      <h3>Blob plus AI Search rather than a standalone vector database</h3>
      <p>
        The corpus had to live inside the tenant, and AI Search indexes Blob directly. An external
        vector store would have meant a second copy of the data in a second trust boundary — a real
        compliance cost paid for a marginal retrieval gain.
      </p>

      <h3>Hybrid retrieval rather than pure vector</h3>
      <p>
        Policy and procedure content is dense with exact tokens: codes, form identifiers, section
        numbers. Embeddings are bad at precisely those. Someone asking about a specific form wants
        keyword matching; someone asking &ldquo;what do I do when a payment posts twice&rdquo; wants
        semantic. Hybrid gets both, and each one&rsquo;s failure mode is covered by the other.
      </p>

      <h3>Default chunking, under a timebox — and the right call anyway</h3>
      <p>
        Tuning chunk size without a question set to measure against can&rsquo;t distinguish an
        improvement from a coincidence. Defaults first, measurement before tuning. It&rsquo;s still
        the first thing I&rsquo;d revisit with more time, and the section below says how.
      </p>

      <h3>Put it where the work already happens</h3>
      <p>
        The assistant was embedded as a chat agent in the workflow site onboarders were already in,
        rather than living as a separate tool. A knowledge system someone has to remember to go to
        is a knowledge system nobody uses at the moment they&rsquo;re stuck — and being stuck is the
        entire use case.
      </p>

      <h2>My part</h2>
      <p>
        I built the ingestion pipeline, the storage and indexing layer, and the retrieval and
        generation flow — the whole path from raw Word and Excel through to a grounded, cited
        answer. Another software engineer on the team built the front end.
      </p>
      <p>
        That&rsquo;s the same division as my 2024 hackathon win, where I built the backend: the
        vector index, the embedding pipeline, and the model tuning. Twice now I&rsquo;ve been the
        retrieval and data person on a winning team, which isn&rsquo;t an accident — it&rsquo;s the
        part I want.
      </p>

      <h2>How I evaluated it</h2>
      <p>
        I didn&rsquo;t. It was judged by demo, and I&rsquo;d rather say that than dress it up.
      </p>
      <p>
        That&rsquo;s the honest ceiling on this project. A hackathon demo answers &ldquo;does this
        work when I drive it,&rdquo; which is a different and much easier question than &ldquo;is
        this right when someone else does.&rdquo; I know that gap matters — my other two case
        studies exist largely because of it — and this is where I&rsquo;d have closed it first with
        more time.
      </p>
      <p>What I&rsquo;d measure now:</p>
      <ul>
        <li>
          <strong>Retrieval hit@5</strong> against a hand-labelled question set, built before
          touching anything else.
        </li>
        <li>
          <strong>Citation correctness, scored separately from answer correctness.</strong> This is
          where the interesting failures hide. A right answer with a wrong citation means the model
          knew it from pretraining rather than from the corpus — and that system fails silently the
          day the corpus becomes the only source of truth.
        </li>
        <li>
          <strong>Refusal rate on questions the corpus can&rsquo;t answer</strong>, reported
          alongside the false-refusal rate, since refusing everything scores a perfect 100%.
        </li>
        <li>
          <strong>A chunk-size ablation</strong>, meaningful only once the question set exists —
          which is why defaults were the right call at the time and the wrong thing to leave in
          place.
        </li>
      </ul>
      <p>
        There&rsquo;s a version of this page that implies more rigor than there was. It would read
        better, and it would fall apart in the first technical interview that asked one follow-up
        question.
      </p>

      <h2>Results</h2>
      <p>It won.</p>
      <p>
        Then it stopped — not because anything was wrong with it, but because there was no one to
        staff it. There were meetings about next steps, and the meetings were genuine, and nothing
        came of them.
      </p>
      <p>
        That&rsquo;s worth writing down rather than eliding, because it&rsquo;s the normal fate of
        internal demos and the reason is usually this one. A hackathon build is judged on whether it
        works. Getting adopted is a different bar: someone has to own it, the corpus has to stay
        current, and somebody has to answer for a wrong answer at two in the morning. I built the
        thing that wins the hackathon. I hadn&rsquo;t built the thing an organization can pick up —
        no eval harness to prove it was safe to trust, no ingestion job that keeps running, no
        owner.
      </p>
      <p>
        That&rsquo;s the most useful thing I took from it, and it&rsquo;s why the evaluation section
        above is written the way it is.
      </p>

      <h2>What I&rsquo;d do differently</h2>
      <ul>
        <li>
          <strong>Build the question set before the system.</strong> Fifty questions with known
          answers, written first, turn every later decision — chunk size, hybrid weighting, top-k —
          from an argument into a measurement. Everything else here depends on it.
        </li>
        <li>
          <strong>Chunk the spreadsheets by meaning, not by size.</strong> Once there&rsquo;s
          something to measure against, the tabular content is where I&rsquo;d expect the biggest
          gain, because that&rsquo;s where naive chunking does the most damage.
        </li>
        <li>
          <strong>Add a reranker.</strong> Cheap, and the highest-leverage improvement available on
          a corpus of short, similar documents.
        </li>
        <li>
          <strong>Log the thumbs-down.</strong> Every rejected answer is a question that belongs in
          the eval set. Without that loop, quality freezes on the day I stopped working on it.
        </li>
        <li>
          <strong>Design for the handoff from day one.</strong> The gap between &ldquo;wins the
          hackathon&rdquo; and &ldquo;an organization can adopt this&rdquo; is an ownership story,
          not a technical one, and it&rsquo;s cheaper to build for at the start than to retrofit
          once the enthusiasm has moved on.
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
