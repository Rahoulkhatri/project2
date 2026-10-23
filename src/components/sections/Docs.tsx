import { codeToHtml, type ThemeRegistrationRaw } from "shiki";
import { DocsTabs, type DocTab } from "./DocsTabs";

/** Palette-matched theme: sky keywords, lime strings, orange numbers. No purple anywhere. */
const theme: ThemeRegistrationRaw = {
  name: "kestrel",
  type: "dark",
  colors: { "editor.background": "#0A0F18", "editor.foreground": "#E8EDF5" },
  settings: [],
  tokenColors: [
    { scope: ["comment", "punctuation.definition.comment"], settings: { foreground: "#7B8798", fontStyle: "italic" } },
    { scope: ["keyword", "storage", "keyword.control", "storage.type", "storage.modifier"], settings: { foreground: "#38BDF8" } },
    { scope: ["string", "string.quoted", "punctuation.definition.string"], settings: { foreground: "#A3E635" } },
    { scope: ["constant.numeric", "constant.language", "constant.character.escape"], settings: { foreground: "#FB923C" } },
    { scope: ["entity.name.function", "support.function", "meta.function-call"], settings: { foreground: "#E8EDF5", fontStyle: "bold" } },
    { scope: ["entity.name.type", "support.type", "support.class", "entity.name.class"], settings: { foreground: "#7DD3FC" } },
    { scope: ["variable.parameter", "variable.other.property", "meta.object-literal.key"], settings: { foreground: "#BFD4EA" } },
    { scope: ["punctuation", "meta.brace", "keyword.operator"], settings: { foreground: "#8A97AA" } },
  ],
};

const SNIPPETS = [
  {
    id: "node",
    label: "Node",
    lang: "javascript",
    code: `import { Kestrel } from "@kestrel/sdk";

const kestrel = new Kestrel({ token: process.env.KESTREL_TOKEN });

const deploy = await kestrel.deploy({
  project: "my-store",
  dir: "./dist",
  regions: "auto", // all 284 locations
});

console.log(deploy.url); // https://my-store.kestrel.app`,
  },
  {
    id: "python",
    label: "Python",
    lang: "python",
    code: `import os
from kestrel import Kestrel

kestrel = Kestrel(token=os.environ["KESTREL_TOKEN"])

deploy = kestrel.deploy(
    project="my-store",
    directory="./dist",
    regions="auto",  # all 284 locations
)

print(deploy.url)  # https://my-store.kestrel.app`,
  },
  {
    id: "go",
    label: "Go",
    lang: "go",
    code: `package main

import (
	"context"
	"fmt"
	"os"

	"github.com/kestrel-cloud/kestrel-go"
)

func main() {
	k := kestrel.New(os.Getenv("KESTREL_TOKEN"))
	d, err := k.Deploy(context.Background(), kestrel.DeployInput{
		Project: "my-store",
		Dir:     "./dist",
		Regions: "auto", // all 284 locations
	})
	if err != nil {
		panic(err)
	}
	fmt.Println(d.URL) // https://my-store.kestrel.app
}`,
  },
  {
    id: "curl",
    label: "cURL",
    lang: "bash",
    code: `curl -X POST https://api.kestrel.dev/v1/deployments \\
  -H "Authorization: Bearer $KESTREL_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "project": "my-store",
    "source": "https://github.com/acme/my-store",
    "regions": "auto"
  }'

# 201 Created · { "url": "https://my-store.kestrel.app" }`,
  },
] as const;

/** Server component: highlighting happens at build time, so no highlighter ships to the browser. */
export async function Docs() {
  const tabs: DocTab[] = await Promise.all(
    SNIPPETS.map(async (s) => ({
      id: s.id,
      label: s.label,
      raw: s.code,
      html: await codeToHtml(s.code, { lang: s.lang, theme }),
    })),
  );

  return (
    <section id="docs" aria-labelledby="docs-h" className="relative border-t border-line px-[var(--gutter)] py-[14vh]">
      <div className="grid grid-cols-1 gap-y-10 lg:grid-cols-12 lg:gap-x-10">
        <div className="lg:col-span-4">
          <p className="t-label flex items-center gap-3 text-muted">
            <span className="text-sky">12</span>
            <span className="h-px w-8 bg-line-strong" />
            <span>Docs</span>
          </p>
          <h2 id="docs-h" className="t-display mt-6 text-[clamp(2.4rem,5vw,5rem)] text-ink">
            One call. Every location.
          </h2>
          <p className="t-body mt-6 max-w-[38ch]">
            The CLI, the SDKs and the REST API all do the same thing: upload a build, and it is live at 284 locations before the command returns.
          </p>
        </div>
        <div className="lg:col-span-8">
          <DocsTabs tabs={tabs} />
        </div>
      </div>
    </section>
  );
}
