"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Magnetic } from "@/components/ui/Magnetic";

const COMMAND = "npx kestrel deploy";

export function DeployTerminal() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(COMMAND);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard can be blocked (insecure context, permissions); the command stays selectable.
    }
  };

  return (
    <div className="border border-line bg-panel/80 backdrop-blur-md">
      <div className="t-label flex items-center justify-between border-b border-line px-4 py-2.5 text-muted">
        <span>~/my-store — zsh</span>
        <span>kestrel 4.12.0</span>
      </div>
      <div className="flex items-center justify-between gap-4 px-4 py-5">
        <code className="t-mono select-all text-[clamp(15px,1.5vw,20px)] text-ink">
          <span className="text-lime">$</span> {COMMAND}
          <span className="caret ml-1" aria-hidden />
        </code>
        <Magnetic strength={0.3}>
          <button
            type="button"
            onClick={copy}
            data-cursor="copy"
            className="t-label relative h-11 w-[96px] overflow-hidden border border-line-strong text-ink transition-colors duration-300 hover:border-sky hover:text-sky"
            aria-label={copied ? "Copied" : `Copy ${COMMAND}`}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={copied ? "done" : "copy"}
                className="absolute inset-0 grid place-items-center"
                initial={{ y: "100%" }}
                animate={{ y: "0%" }}
                exit={{ y: "-100%" }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              >
                {copied ? "copied" : "copy"}
              </motion.span>
            </AnimatePresence>
          </button>
        </Magnetic>
      </div>
    </div>
  );
}
