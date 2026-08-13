import raw from "@/content/site.json";
import type { SiteContent } from "./content";

/**
 * The content as it exists in the repo right now, inlined at build time.
 *
 * TypeScript widens the JSON's literal `type` fields to `string`, which will
 * not narrow to the section union on its own — hence the assertion. The shape
 * is guaranteed by the admin editor, which is the only thing that writes this
 * file.
 */
export const siteContent = raw as unknown as SiteContent;
