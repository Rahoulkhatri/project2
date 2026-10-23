import { Features } from "./Features";
import { Regions } from "./Regions";
import { Docs } from "./Docs";
import { Contact } from "./Contact";
import { Pricing } from "@/components/story/Pricing";

/**
 * Everything after the pinned story. Opaque, so the canvas behind it can stop
 * rendering. Server component: Docs highlights its code at build time.
 */
export function AfterStory() {
  return (
    <div className="relative bg-bg">
      <div className="md:hidden">
        <Pricing stacked />
      </div>
      <Features />
      <Regions />
      <Docs />
      <Contact />
    </div>
  );
}
