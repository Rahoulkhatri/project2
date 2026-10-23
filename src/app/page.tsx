import { Experience } from "@/components/Experience";
import { AfterStory } from "@/components/sections/AfterStory";
import { Footer } from "@/components/sections/Footer";
import { BEATS } from "@/lib/copy";

/** Without JavaScript the pinned 3D story can't run, so the same copy is served as plain content. */
function NoScriptStory() {
  return (
    <noscript>
      <style>{`html.is-booting,html.is-booting body{overflow:auto!important}#preloader,[data-scene],#story{display:none!important}`}</style>
      <div className="relative z-10 mx-auto max-w-3xl px-6 pb-24 pt-28">
        <h1 className="t-display text-5xl text-ink">Every request has a journey. We make it short.</h1>
        <p className="t-body mt-6">
          Kestrel is the edge platform for developers. This page follows one request from a laptop in Karachi, across the internet, through the edge, to a server and back, in 87 ms. It is a 3D story that needs JavaScript; here is the same journey in text.
        </p>
        {BEATS.map((b) => (
          <section key={b.scene} className="mt-14 border-t border-line pt-8">
            <h2 className="t-display text-3xl text-ink">{b.title}</h2>
            <p className="t-body mt-4">{b.body}</p>
            <ul className="t-mono mt-4 text-[13px] text-ink">
              {b.specs.map(([k, v]) => (
                <li key={k}>
                  {k}: {v}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </noscript>
  );
}

export default function Home() {
  return (
    <>
      <NoScriptStory />
      <Experience after={<AfterStory />} footer={<Footer />} />
    </>
  );
}
