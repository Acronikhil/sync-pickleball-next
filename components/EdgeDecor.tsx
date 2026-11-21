import type { ThemeSpec } from "@/lib/themes";
import { SnowCap } from "./SnowCap";
import { StringLights } from "./StringLights";
import { Bunting } from "./Bunting";

/**
 * The festival trim along a card's top edge: a snow drift, a string of
 * lights or bunting. Place it inside a `relative` wrapper that doesn't clip.
 */
export function EdgeDecor({
  edge,
  seed = 1,
  colors = [],
}: {
  edge: ThemeSpec["edge"];
  seed?: number;
  /** Flag colours, for bunting. */
  colors?: string[];
}) {
  if (edge === "snow") {
    return <SnowCap seed={seed} className="absolute inset-x-5 -top-3 z-[2] h-7 md:inset-x-8 md:h-8" />;
  }
  if (edge === "lights") {
    return <StringLights className="absolute inset-x-6 -top-1 z-[2] h-7 md:inset-x-10 md:h-9" />;
  }
  if (edge === "bunting" && colors.length > 0) {
    return <Bunting colors={colors} className="absolute inset-x-6 -top-1 z-[2] h-8 md:inset-x-10 md:h-10" />;
  }
  return null;
}
