const should = require('should');

describe('TGuideline model', () => {
  describe('history on insert', () => {
    // The insert trigger keys each h_guideline row by the guideline's date.
    // Production's key is (id, date_reviewed); two guidelines registered in the
    // same millisecond must both get their history row.
    it('should accept two guidelines registered at the same instant', async () => {
      const dateInscription = new Date();
      const create = (title) =>
        TGuideline.create({
          title,
          author: 3,
          language: 'fra',
          dateInscription,
        }).fetch();

      const first = await create('Same Instant Guideline A');
      const second = await create('Same Instant Guideline B');

      const history = await HGuideline.find({ t_id: [first.id, second.id] });
      should(history.map((row) => row.t_id)).containDeep([first.id, second.id]);
      should(history).have.length(2);
    });
  });
});
