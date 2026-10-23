import type { Metadata } from "next";
import { PageHero } from "@/components/site/PageHero";
import { Docs } from "@/components/sections/Docs";
import { Cta } from "@/components/site/Cta";

export const metadata: Metadata = {
  title: "Docs",
  description: "Deploy with the CLI, an SDK in Node, Python or Go, or the REST API. One call, live at 284 locations before it returns.",
  alternates: { canonical: "/docs" },
};

const QUICKSTART: [string, string, string][] = [
  ["Install", "npm i -g kestrel", "One binary. No daemon, no config file to write."],
  ["Log in", "kestrel login", "Opens a browser once and stores a token in your keychain."],
  ["Deploy", "npx kestrel deploy", "Bundles, uploads and replicates. Prints the URL when it is live."],
];

const API: [string, string, string][] = [
  ["POST", "/v1/deployments", "Create a deployment from a build or a Git ref."],
  ["GET", "/v1/deployments/:id", "Status, URL and the per-location rollout."],
  ["POST", "/v1/deployments/:id/rollback", "Point production back at a previous build."],
  ["GET", "/v1/projects/:id/metrics", "Requests, cache hits and p50/p99 at 250 ms resolution."],
  ["POST", "/v1/cache/purge", "Purge by path, tag or the whole project."],
];

export default function DocsPage() {
  return (
    <>
      <PageHero
        code="01"
        label="Docs"
        model="fanout"
        title={
          <>
            One call. <span className="text-muted">Every location.</span>
          </>
        }
        lead="The CLI, the SDKs and the REST API all do the same thing: upload a build and have it live at 284 locations before the command returns."
        stats={[
          ["deploy", "2.1 s"],
          ["sdks", "3"],
          ["api", "REST"],
        ]}
      />

      <section aria-labelledby="qs-h" className="relative border-t border-line px-[var(--gutter)] py-[12vh]">
        <p className="t-label flex items-center gap-3 text-muted">
          <span className="text-sky">02</span>
          <span className="h-px w-8 bg-line-strong" />
          <span>Quickstart</span>
        </p>
        <h2 id="qs-h" className="t-display mt-6 max-w-[14ch] text-[clamp(2.2rem,4.6vw,4.6rem)] text-ink">
          Three commands.
        </h2>
        <ol className="mt-12 grid grid-cols-1 md:grid-cols-3">
          {QUICKSTART.map(([name, cmd, text], i) => (
            <li key={name} className="border-t border-line py-8 md:border-l md:px-8 md:first:border-l-0 md:first:pl-0">
              <span className="t-mono text-[12px] text-sky">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="t-display mt-2 text-[clamp(1.6rem,2.6vw,2.4rem)] text-ink">{name}</h3>
              <code className="t-mono mt-4 block select-all border border-line bg-panel/60 px-3 py-2.5 text-[13px] text-lime">$ {cmd}</code>
              <p className="t-body mt-3 max-w-[34ch]">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <Docs />

      <section aria-labelledby="api-h" className="relative border-t border-line px-[var(--gutter)] py-[12vh]">
        <div className="grid grid-cols-1 gap-y-10 lg:grid-cols-12 lg:gap-x-10">
          <div className="lg:col-span-4">
            <p className="t-label flex items-center gap-3 text-muted">
              <span className="text-sky">04</span>
              <span className="h-px w-8 bg-line-strong" />
              <span>REST API</span>
            </p>
            <h2 id="api-h" className="t-display mt-6 text-[clamp(2.2rem,4.6vw,4.6rem)] text-ink">
              The endpoints you will actually use.
            </h2>
            <p className="t-body mt-5 max-w-[34ch]">Base URL api.kestrel.dev. Authenticate with a bearer token.</p>
          </div>
          <ul className="lg:col-span-7 lg:col-start-6">
            {API.map(([m, path, text]) => (
              <li key={path + m} className="border-t border-line py-4 last:border-b">
                <div className="t-mono flex flex-wrap items-baseline gap-x-4 text-[13px]">
                  <span className={m === "GET" ? "text-sky" : "text-lime"}>{m}</span>
                  <span className="text-ink">{path}</span>
                </div>
                <p className="t-body mt-1">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Cta title="Stuck on something? A person will answer." cta="Ask an engineer" />
    </>
  );
}
