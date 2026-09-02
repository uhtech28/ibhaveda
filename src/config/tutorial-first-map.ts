/**
 * The painted map the tutorial lands on, per template.
 *
 * WHY THIS EXISTS
 * ---------------
 * The tutorial always sends the user to STAGE 1 of their template's map,
 * and those PNGs are the heaviest asset on the platform -- 3.1 to 4.8 MB
 * each. Phaser only starts fetching once /map/world has mounted, so the
 * download happens while the user is staring at "Entering the World...".
 *
 * The contributors beat that immediately precedes it is a screen the user
 * spends several seconds on, doing nothing that touches the network. That
 * is free time to pull the map down, so by the time they hit Continue the
 * bytes are in cache and the map paints as soon as Phaser boots.
 *
 * Kept as a tiny hand-maintained table rather than reaching into the map
 * page's biome->URL resolver, which is a local function there and depends
 * on Convex-loaded biome names we do not have at this point in the flow.
 * A wrong or stale entry costs one wasted request and nothing else -- the
 * real load still goes through the map page's own resolution.
 *
 * Stage-1 biomes, from the template configs:
 *   venture  -> The Village      lab      -> Observatory
 *   academic -> Ancient Library  creative -> Sacred Grove
 */
export const TUTORIAL_FIRST_MAP_URL: Readonly<Record<string, string>> = {
  venture: "/assets/maps-v2/village-painted/village-map.png",
  academic: "/assets/maps-v2/academic/library-map.png",
  lab: "/assets/maps-v2/lab/observatory-map.png",
  creative: "/assets/maps-v2/forest/forest-map.png",
};

/** Map URL for a template id, or null when we have no painted map for it. */
export function tutorialFirstMapUrl(
  templateId: string | null | undefined,
): string | null {
  // Null template = venture, which is the default flow.
  return TUTORIAL_FIRST_MAP_URL[templateId ?? "venture"] ?? null;
}
