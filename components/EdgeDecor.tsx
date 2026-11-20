import type { ThemeSpec } from "@/lib/themes";
import { SnowCap } from "./SnowCap";
import { StringLights } from "./StringLights";

/**
 * The festival trim along a card's top edge: a snow drift or a string of
 * lights. Place it inside a `relative` wrapper that doesn't clip.
 */
export function EdgeDecor({ edge, seed = 1 }: { edge: ThemeSpec["edge"]; seed?: number }) {
  if (edge === "snow") {
    return <SnowCap seed={seed} className="absolute inset-x-5 -top-3 z-[2] h-7 md:inset-x-8 md:h-8" />;
  }
  if (edge === "lights") {
    return <StringLights className="absolute inset-x-6 -top-1 z-[2] h-7 md:inset-x-10 md:h-9" />;
  }
  return null;
}
