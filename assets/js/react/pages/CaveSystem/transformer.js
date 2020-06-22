import { pathOr } from 'ramda';

// eslint-disable-next-line import/prefer-default-export
export const getSafeData = (data) => ({
  accessRate: pathOr(0, ['accessRate'], data),
  altitude: pathOr(0, ['altitude'], data),
  author: pathOr('Author', ['author'], data),
  creationDate: pathOr(null, ['dateInscription'], data),
  depth: pathOr(0, ['depth'], data),
  development: pathOr(0, ['length'], data),
  discoveryYear: pathOr(null, ['discoveryYear'], data),
  editionDate: pathOr(null, ['editionDate'], data),
  entries: pathOr([], ['entries'], data),
  id: data.id,
  interestRate: pathOr(0, ['interestRate'], data),
  isDivingCave: pathOr(null, ['isDiving'], data),
  lastEditor: pathOr(null, ['lastEditor'], data),
  localisation: `${data.city || 'city'}, ${data.region ||
    'region'}, ${data.country || 'country'}`,
  mountain: pathOr(null, ['massif', 'name'], data),
  name: data.name,
  progressionRate: pathOr(0, ['progressionRate'], data),
  temperature: pathOr(null, ['temperature'], data),
  undergroundType: pathOr(null, ['massif', 'undergroundType'], data),
});
