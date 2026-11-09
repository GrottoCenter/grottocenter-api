/**
 * Which page shows a cave (#1735).
 *
 * A cave with a single entrance is shown as that entrance's page, the cave
 * itself being hidden; a cave with two or more entrances is a network, shown
 * on its own cave page. This module is the only place that holds the
 * threshold: every consumer (organization payload, document links, entrance
 * documents) goes through it instead of comparing entrance counts itself.
 *
 * A cave without any entrance has nothing else to show it, so it falls back
 * on the cave page.
 */

const NETWORK_MIN_ENTRANCES = 2;

/**
 * @param {number} entranceCount
 * @returns {boolean} whether a cave with that many entrances is a network
 */
const isNetwork = (entranceCount) => entranceCount >= NETWORK_MIN_ENTRANCES;

/**
 * @param {number} entranceCount
 * @returns {boolean} whether a cave with that many entrances is shown as its
 *  entrance's page
 */
const isShownAsEntrance = (entranceCount) => entranceCount === 1;

/**
 * Resolve the page a link to the cave must point to.
 * @param {{ id: number, name?: string }} cave
 * @param {Array<{ id: number, name?: string }>} entrances the cave's entrances
 *  that can be displayed (the caller decides, typically the non-deleted ones)
 * @returns {{ type: 'cave' | 'entrance', id: number, name: string | null }}
 */
const resolveCaveDisplayTarget = (cave, entrances) => {
  if (isShownAsEntrance(entrances.length)) {
    const [entrance] = entrances;
    return { type: 'entrance', id: entrance.id, name: entrance.name ?? null };
  }
  return { type: 'cave', id: cave.id, name: cave.name ?? null };
};

module.exports = {
  NETWORK_MIN_ENTRANCES,
  isNetwork,
  isShownAsEntrance,
  resolveCaveDisplayTarget,
};
