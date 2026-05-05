const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');
const CommonService = require('../../../../api/services/CommonService');

describe('Entrance features', () => {
  describe('Delete - Auditability', () => {
    let moderatorToken;
    let entrance;
    let cave;
    let organization;
    let location;
    let description;
    let rigging;
    let history;
    let comment;
    let name;
    let document;

    before(async () => {
      moderatorToken = await AuthTokenService.getRawBearerModeratorToken();

      // Create a cave (sole entrance triggers cave cascade delete)
      cave = await TCave.create({
        author: 1,
        dateInscription: new Date(),
        dateReviewed: new Date(),
      }).fetch();

      // Create an organization to link as exploring grotto
      organization = await TGrotto.create({
        author: 1,
        dateInscription: new Date(),
        dateReviewed: new Date(),
      }).fetch();

      // Create the entrance with all required fields (already marked deleted)
      entrance = await TEntrance.create({
        author: 1,
        latitude: '45.123',
        longitude: '6.456',
        dateInscription: new Date(),
        cave: cave.id,
        country: 'FR',
        geology: 'Q35758',
        isPublic: true,
        isSensitive: false,
        isDeleted: true,
        modalities: 'NO,NO,NO,NO',
        hasContributions: false,
        isOfInterest: false,
      }).fetch();

      // Link explorer caver to entrance (j_caver_cave_explorer via cave)
      await TCave.addToCollection(cave.id, 'explorerCavers', [1]);

      // Link exploring organization to cave (j_grotto_cave_explorer)
      await TCave.addToCollection(cave.id, 'exploringGrottos', [
        organization.id,
      ]);

      // Link partnering organization to cave (j_grotto_cave_partner)
      await TCave.addToCollection(cave.id, 'partneringGrottos', [
        organization.id,
      ]);

      // Create related sub-entities
      name = await TName.create({
        author: 1,
        name: 'Test Entrance Name',
        entrance: entrance.id,
        language: 'eng',
        isMain: true,
        dateInscription: new Date(),
      }).fetch();

      location = await TLocation.create({
        author: 1,
        entrance: entrance.id,
        body: 'Test location body',
        title: 'Test Location',
        language: 'eng',
        dateInscription: new Date(),
      }).fetch();

      description = await TDescription.create({
        author: 1,
        entrance: entrance.id,
        body: 'Test description body',
        title: 'Test Description',
        language: 'eng',
        dateInscription: new Date(),
      }).fetch();

      rigging = await TRigging.create({
        author: 1,
        entrance: entrance.id,
        title: 'Test Rigging',
        language: 'eng',
        dateInscription: new Date(),
      }).fetch();

      history = await THistory.create({
        author: 1,
        entrance: entrance.id,
        body: 'Test history body',
        language: 'eng',
        dateInscription: new Date(),
      }).fetch();

      comment = await TComment.create({
        author: 1,
        entrance: entrance.id,
        title: 'Test Comment',
        body: 'Test comment body',
        language: 'eng',
        dateInscription: new Date(),
      }).fetch();

      document = await TDocument.create({
        author: 1,
        dateInscription: new Date(),
        datePublication: '2020',
        isValidated: false,
        type: 4,
        license: 1,
      }).fetch();

      // Link document to entrance via junction
      await TEntrance.addToCollection(entrance.id, 'documents', [document.id]);

      // Create h_ history rows for each entity (simulating prior edits)
      await CommonService.query(
        `INSERT INTO h_entrance (id, id_author, date_reviewed, date_inscription,
          is_public, is_sensitive, modalities, has_contributions, latitude,
          longitude, is_of_interest, id_cave, id_country, id_geology,
          has_bat, danger_flooding, danger_co2, danger_rockfall,
          danger_pollution, need_clean_gear, need_stay_on_trail,
          has_rules, is_touristic)
         VALUES ($1, 1, NOW(), NOW(), true, false, 'NO,NO,NO,NO', false,
          '45.123', '6.456', false, $2, 'FR', 'Q35758',
          false, false, false, false, false, false, false, false, false)`,
        [entrance.id, cave.id]
      );

      await CommonService.query(
        `INSERT INTO h_cave (id, id_author, date_reviewed, date_inscription)
         VALUES ($1, 1, NOW(), NOW())`,
        [cave.id]
      );

      await CommonService.query(
        `INSERT INTO h_location (id, id_author, date_reviewed, date_inscription,
          body, title, id_entrance, id_language)
         VALUES ($1, 1, NOW(), NOW(), 'Old location', 'Old Title', $2, 'eng')`,
        [location.id, entrance.id]
      );

      await CommonService.query(
        `INSERT INTO h_description (id, id_author, date_reviewed, date_inscription,
          body, title, id_entrance, id_language, relevance)
         VALUES ($1, 1, NOW(), NOW(), 'Old desc', 'Old Title', $2, 'eng', 0)`,
        [description.id, entrance.id]
      );

      await CommonService.query(
        `INSERT INTO h_rigging (id, id_author, date_reviewed, date_inscription,
          title, id_entrance, id_language)
         VALUES ($1, 1, NOW(), NOW(), 'Old Rigging', $2, 'eng')`,
        [rigging.id, entrance.id]
      );

      await CommonService.query(
        `INSERT INTO h_history (id, id_author, date_reviewed, date_inscription,
          body, id_entrance, id_language)
         VALUES ($1, 1, NOW(), NOW(), 'Old history', $2, 'eng')`,
        [history.id, entrance.id]
      );

      await CommonService.query(
        `INSERT INTO h_comment (id, id_author, date_reviewed, date_inscription,
          title, body, id_entrance, id_language)
         VALUES ($1, 1, NOW(), NOW(), 'Old Comment', 'Old body', $2, 'eng')`,
        [comment.id, entrance.id]
      );

      await CommonService.query(
        `INSERT INTO h_name (id, id_author, date_reviewed, date_inscription,
          name, is_main, id_entrance, id_language)
         VALUES ($1, 1, NOW(), NOW(), 'Old Name', true, $2, 'eng')`,
        [name.id, entrance.id]
      );
    });

    it('should permanently delete entrance and preserve all h_ rows', async () => {
      await supertest(sails.hooks.http.app)
        .delete(`/api/v1/entrances/${entrance.id}?isPermanent=1`)
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      // --- Verify t_ rows are deleted ---

      const tEntrance = await TEntrance.findOne(entrance.id);
      should(tEntrance).be.undefined();

      const tLocation = await TLocation.findOne(location.id);
      should(tLocation).be.undefined();

      const tDescription = await TDescription.findOne(description.id);
      should(tDescription).be.undefined();

      const tRigging = await TRigging.findOne(rigging.id);
      should(tRigging).be.undefined();

      const tHistory = await THistory.findOne(history.id);
      should(tHistory).be.undefined();

      const tComment = await TComment.findOne(comment.id);
      should(tComment).be.undefined();

      const tName = await TName.findOne(name.id);
      should(tName).be.undefined();

      // Cave should also be deleted (sole entrance triggers cascade)
      const tCave = await TCave.findOne(cave.id);
      should(tCave).be.undefined();

      // Document should still exist (unlinked, not deleted)
      const tDocument = await TDocument.findOne(document.id);
      should(tDocument).not.be.undefined();

      // Junction tables should be cleaned up
      const caverExplorer = await CommonService.query(
        'SELECT COUNT(*)::integer AS cnt FROM j_caver_cave_explorer WHERE id_cave = $1',
        [cave.id]
      );
      should(caverExplorer.rows[0].cnt).equal(0);

      const grottoExplorer = await CommonService.query(
        'SELECT COUNT(*)::integer AS cnt FROM j_grotto_cave_explorer WHERE id_cave = $1',
        [cave.id]
      );
      should(grottoExplorer.rows[0].cnt).equal(0);

      const grottoPartner = await CommonService.query(
        'SELECT COUNT(*)::integer AS cnt FROM j_grotto_cave_partner WHERE id_cave = $1',
        [cave.id]
      );
      should(grottoPartner.rows[0].cnt).equal(0);

      // --- Verify h_ rows are preserved for auditability ---

      const hEntrance = await CommonService.query(
        'SELECT COUNT(*)::integer AS cnt FROM h_entrance WHERE id = $1',
        [entrance.id]
      );
      should(hEntrance.rows[0].cnt).be.aboveOrEqual(1);

      const hCave = await CommonService.query(
        'SELECT COUNT(*)::integer AS cnt FROM h_cave WHERE id = $1',
        [cave.id]
      );
      should(hCave.rows[0].cnt).be.aboveOrEqual(1);

      const hLocation = await CommonService.query(
        'SELECT COUNT(*)::integer AS cnt FROM h_location WHERE id = $1',
        [location.id]
      );
      should(hLocation.rows[0].cnt).be.aboveOrEqual(1);

      // Verify h_location FK was nulled (entrance was deleted, not merged)
      const hLocationFk = await CommonService.query(
        'SELECT id_entrance FROM h_location WHERE id = $1',
        [location.id]
      );
      should(hLocationFk.rows[0].id_entrance).be.null();

      const hDescription = await CommonService.query(
        'SELECT COUNT(*)::integer AS cnt FROM h_description WHERE id = $1',
        [description.id]
      );
      should(hDescription.rows[0].cnt).be.aboveOrEqual(1);

      const hRigging = await CommonService.query(
        'SELECT COUNT(*)::integer AS cnt FROM h_rigging WHERE id = $1',
        [rigging.id]
      );
      should(hRigging.rows[0].cnt).be.aboveOrEqual(1);

      const hHistory = await CommonService.query(
        'SELECT COUNT(*)::integer AS cnt FROM h_history WHERE id = $1',
        [history.id]
      );
      should(hHistory.rows[0].cnt).be.aboveOrEqual(1);

      const hComment = await CommonService.query(
        'SELECT COUNT(*)::integer AS cnt FROM h_comment WHERE id = $1',
        [comment.id]
      );
      should(hComment.rows[0].cnt).be.aboveOrEqual(1);

      const hName = await CommonService.query(
        'SELECT COUNT(*)::integer AS cnt FROM h_name WHERE id = $1',
        [name.id]
      );
      should(hName.rows[0].cnt).be.aboveOrEqual(1);
    });

    after(async () => {
      // Clean up h_ rows inserted in before() (raw SQL since Waterline
      // can't reliably operate on composite-PK history tables)
      await CommonService.query('DELETE FROM h_name WHERE id = $1', [name?.id]);
      await CommonService.query('DELETE FROM h_comment WHERE id = $1', [
        comment?.id,
      ]);
      await CommonService.query('DELETE FROM h_history WHERE id = $1', [
        history?.id,
      ]);
      await CommonService.query('DELETE FROM h_rigging WHERE id = $1', [
        rigging?.id,
      ]);
      await CommonService.query('DELETE FROM h_description WHERE id = $1', [
        description?.id,
      ]);
      await CommonService.query('DELETE FROM h_location WHERE id = $1', [
        location?.id,
      ]);
      await CommonService.query('DELETE FROM h_entrance WHERE id = $1', [
        entrance?.id,
      ]);
      await CommonService.query('DELETE FROM h_cave WHERE id = $1', [cave?.id]);

      // Clean up remaining t_ test data (idempotent — safe if test failed mid-way)
      await TDocument.destroy({ id: document?.id });
      await TGrotto.destroy({ id: organization?.id });
      await TName.destroy({ id: name?.id });
      await TComment.destroy({ id: comment?.id });
      await THistory.destroy({ id: history?.id });
      await TRigging.destroy({ id: rigging?.id });
      await TDescription.destroy({ id: description?.id });
      await TLocation.destroy({ id: location?.id });
      await TEntrance.destroy({ id: entrance?.id });
      await TCave.destroy({ id: cave?.id });
    });
  });
});
