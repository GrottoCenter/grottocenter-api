const should = require('should');
const getEntityDisplayName = require('../../../api/utils/getEntityDisplayName');

describe('getEntityDisplayName()', () => {
  it('should return the main name set by NameService', () => {
    should(
      getEntityDisplayName({
        name: 'Gouffre Berger',
        names: [{ name: 'Other' }],
      })
    ).equal('Gouffre Berger');
  });

  it('should fall back on the first TName row', () => {
    should(
      getEntityDisplayName({ names: [{ name: 'First' }, { name: 'Second' }] })
    ).equal('First');
  });

  it('should use the title of a comment, description, location or rigging', () => {
    should(getEntityDisplayName({ title: 'A title', body: 'A body' })).equal(
      'A title'
    );
  });

  it('should use the first title text of a document', () => {
    should(
      getEntityDisplayName({ titles: [{ text: 'Doc title' }, { text: 'Alt' }] })
    ).equal('Doc title');
  });

  it('should excerpt the body of a history, which has no title', () => {
    const body = 'x'.repeat(80);
    const name = getEntityDisplayName({ body });
    should(name).equal(`${'x'.repeat(50)}...`);
  });

  it('should use the first description title of a document', () => {
    should(
      getEntityDisplayName({ descriptions: [{ title: 'Described' }] })
    ).equal('Described');
  });

  it('should skip empty collections and blank fields', () => {
    should(
      getEntityDisplayName({
        name: '',
        names: [],
        title: null,
        titles: [{}],
        descriptions: [],
      })
    ).be.null();
  });

  it('should return null for nothing usable', () => {
    should(getEntityDisplayName({ id: 1 })).be.null();
    should(getEntityDisplayName(null)).be.null();
    should(getEntityDisplayName(undefined)).be.null();
  });
});
