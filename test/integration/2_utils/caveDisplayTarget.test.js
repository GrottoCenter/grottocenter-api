const should = require('should');
const {
  NETWORK_MIN_ENTRANCES,
  isNetwork,
  isShownAsEntrance,
  resolveCaveDisplayTarget,
} = require('../../../api/utils/caveDisplayTarget');

describe('caveDisplayTarget', () => {
  const cave = { id: 10, name: 'Gouffre Berger' };
  const entrance = (id) => ({ id, name: `Entrance ${id}` });

  it('should make two entrances the network threshold', () => {
    should(NETWORK_MIN_ENTRANCES).equal(2);
  });

  describe('isNetwork / isShownAsEntrance', () => {
    [
      [0, false, false],
      [1, false, true],
      [2, true, false],
      [5, true, false],
    ].forEach(([count, network, asEntrance]) => {
      it(`should classify a cave with ${count} entrance(s)`, () => {
        should(isNetwork(count)).equal(network);
        should(isShownAsEntrance(count)).equal(asEntrance);
      });
    });
  });

  describe('resolveCaveDisplayTarget', () => {
    it('should point to the entrance of a single-entrance cave', () => {
      should(resolveCaveDisplayTarget(cave, [entrance(3)])).deepEqual({
        type: 'entrance',
        id: 3,
        name: 'Entrance 3',
      });
    });

    it('should point to the cave of a network', () => {
      should(
        resolveCaveDisplayTarget(cave, [entrance(3), entrance(4)])
      ).deepEqual({ type: 'cave', id: 10, name: 'Gouffre Berger' });
    });

    it('should fall back on the cave when it has no entrance', () => {
      should(resolveCaveDisplayTarget(cave, [])).deepEqual({
        type: 'cave',
        id: 10,
        name: 'Gouffre Berger',
      });
    });

    it('should give a null name when the target has none', () => {
      should(resolveCaveDisplayTarget({ id: 10 }, [{ id: 3 }])).deepEqual({
        type: 'entrance',
        id: 3,
        name: null,
      });
      should(resolveCaveDisplayTarget({ id: 10 }, [])).deepEqual({
        type: 'cave',
        id: 10,
        name: null,
      });
    });
  });
});
