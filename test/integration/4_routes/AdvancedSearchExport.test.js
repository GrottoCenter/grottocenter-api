/* eslint-disable global-require */
const supertest = require('supertest');
const should = require('should');
const sinon = require('sinon');

describe('Advanced Search Export features', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('POST /api/v1/advanced-search/export', () => {
    it('should return 400 when columns is missing', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/advanced-search/export')
        .send({
          query: 'test',
          entity: 'organizations',
          columnsName: ['ID'],
        })
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          should(res.text).match(/columns must be a non-empty array/);
          return done();
        });
    });

    it('should return 400 when columnsName is missing', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/advanced-search/export')
        .send({
          query: 'test',
          entity: 'organizations',
          columns: ['id'],
        })
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          should(res.text).match(/columnsName must be a non-empty array/);
          return done();
        });
    });

    it('should return 400 when columns is an empty array', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/advanced-search/export')
        .send({
          query: 'test',
          entity: 'organizations',
          columns: [],
          columnsName: ['ID'],
        })
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          should(res.text).match(/columns must be a non-empty array/);
          return done();
        });
    });

    it('should return 400 when columnsName is an empty array', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/advanced-search/export')
        .send({
          query: 'test',
          entity: 'organizations',
          columns: ['id'],
          columnsName: [],
        })
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          should(res.text).match(/columnsName must be a non-empty array/);
          return done();
        });
    });

    it('should export search results to CSV', (done) => {
      const SearchService = require('../../../api/services/SearchService');
      sinon.stub(SearchService, 'collectionSearch').resolves({
        hits: [
          { document: { id: '1', name: 'Test 1', country: 'FR' } },
          { document: { id: '2', name: 'Test 2', country: 'US' } },
        ],
        found: 2,
      });

      supertest(sails.hooks.http.app)
        .post('/api/v1/advanced-search/export')
        .send({
          query: 'test',
          entity: 'organizations',
          columns: ['id', 'name', 'country'],
          columnsName: ['ID', 'Name', 'Country'],
        })
        .expect(200)
        .expect('Content-Type', /text\/csv/)
        .end((err, res) => {
          if (err) return done(err);
          should(res.text).match(/ID,Name,Country/);
          should(res.text).match(/1,Test 1,FR/);
          should(res.text).match(/2,Test 2,US/);
          return done();
        });
    });

    it('should handle CSV escaping for special characters', (done) => {
      const SearchService = require('../../../api/services/SearchService');
      sinon.stub(SearchService, 'collectionSearch').resolves({
        hits: [
          {
            document: {
              id: '1',
              name: 'Test, with comma',
              desc: 'Has "quotes"',
            },
          },
        ],
        found: 1,
      });

      supertest(sails.hooks.http.app)
        .post('/api/v1/advanced-search/export')
        .send({
          query: 'test',
          entity: 'organizations',
          columns: ['id', 'name', 'desc'],
          columnsName: ['ID', 'Name', 'Description'],
        })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.text).match(/"Test, with comma"/);
          should(res.text).match(/"Has ""quotes"""/);
          return done();
        });
    });

    it('should handle newlines in CSV data', (done) => {
      const SearchService = require('../../../api/services/SearchService');
      sinon.stub(SearchService, 'collectionSearch').resolves({
        hits: [{ document: { id: '1', desc: 'Line1\nLine2' } }],
        found: 1,
      });

      supertest(sails.hooks.http.app)
        .post('/api/v1/advanced-search/export')
        .send({
          query: 'test',
          entity: 'organizations',
          columns: ['id', 'desc'],
          columnsName: ['ID', 'Description'],
        })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.text).match(/"Line1\nLine2"/);
          return done();
        });
    });

    it('should return 400 when results exceed max export limit', (done) => {
      const SearchService = require('../../../api/services/SearchService');
      sinon.stub(SearchService, 'collectionSearch').resolves({
        hits: [],
        found: 10001,
      });

      supertest(sails.hooks.http.app)
        .post('/api/v1/advanced-search/export')
        .send({
          query: 'test',
          entity: 'organizations',
          columns: ['id'],
          columnsName: ['ID'],
        })
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          should(res.text).match(/cannot contain more than 10000 results/);
          return done();
        });
    });

    it('should return 500 on search service error', (done) => {
      const SearchService = require('../../../api/services/SearchService');
      sinon.stub(SearchService, 'collectionSearch').resolves({});

      supertest(sails.hooks.http.app)
        .post('/api/v1/advanced-search/export')
        .send({
          query: 'test',
          entity: 'organizations',
          columns: ['id'],
          columnsName: ['ID'],
        })
        .expect(500, done);
    });

    it('should handle multiple batches of results', (done) => {
      const SearchService = require('../../../api/services/SearchService');
      const stub = sinon.stub(SearchService, 'collectionSearch');
      const batch1 = Array(1000)
        .fill(null)
        .map((_, i) => ({
          document: { id: String(i + 1), name: `Test ${i + 1}` },
        }));
      const batch2 = Array(500)
        .fill(null)
        .map((_, i) => ({
          document: { id: String(i + 1001), name: `Test ${i + 1001}` },
        }));

      stub.onFirstCall().resolves({ hits: batch1, found: 1500 });
      stub.onSecondCall().resolves({ hits: batch2, found: 1500 });

      supertest(sails.hooks.http.app)
        .post('/api/v1/advanced-search/export')
        .send({
          query: 'test',
          entity: 'organizations',
          columns: ['id', 'name'],
          columnsName: ['ID', 'Name'],
        })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(stub.calledTwice).be.true();
          should(res.text).match(/Test 1/);
          should(res.text).match(/Test 1500/);
          return done();
        });
    });

    it('should handle matchAllFields parameter', (done) => {
      const SearchService = require('../../../api/services/SearchService');
      sinon.stub(SearchService, 'collectionSearch').resolves({
        hits: [{ document: { id: '1' } }],
        found: 1,
      });

      supertest(sails.hooks.http.app)
        .post('/api/v1/advanced-search/export')
        .send({
          query: 'test',
          entity: 'organizations',
          columns: ['id'],
          columnsName: ['ID'],
          matchAllFields: false,
        })
        .expect(200, done);
    });

    it('should handle matchAllFields as string "false"', (done) => {
      const SearchService = require('../../../api/services/SearchService');
      sinon.stub(SearchService, 'collectionSearch').resolves({
        hits: [{ document: { id: '1' } }],
        found: 1,
      });

      supertest(sails.hooks.http.app)
        .post('/api/v1/advanced-search/export')
        .send({
          query: 'test',
          entity: 'organizations',
          columns: ['id'],
          columnsName: ['ID'],
          matchAllFields: 'false',
        })
        .expect(200, done);
    });

    it('should apply sort parameter', (done) => {
      const SearchService = require('../../../api/services/SearchService');
      sinon.stub(SearchService, 'collectionSearch').resolves({
        hits: [{ document: { id: '1' } }],
        found: 1,
      });

      supertest(sails.hooks.http.app)
        .post('/api/v1/advanced-search/export')
        .send({
          query: 'test',
          entity: 'organizations',
          columns: ['id'],
          columnsName: ['ID'],
          sort: 'name:asc',
        })
        .expect(200, done);
    });

    it('should apply filter parameter', (done) => {
      const SearchService = require('../../../api/services/SearchService');
      sinon.stub(SearchService, 'collectionSearch').resolves({
        hits: [{ document: { id: '1' } }],
        found: 1,
      });

      supertest(sails.hooks.http.app)
        .post('/api/v1/advanced-search/export')
        .send({
          query: 'test',
          entity: 'organizations',
          columns: ['id'],
          columnsName: ['ID'],
          filter: { country: 'FR' },
        })
        .expect(200, done);
    });

    it('should include BOM for Excel compatibility', (done) => {
      const SearchService = require('../../../api/services/SearchService');
      sinon.stub(SearchService, 'collectionSearch').resolves({
        hits: [{ document: { id: '1' } }],
        found: 1,
      });

      supertest(sails.hooks.http.app)
        .post('/api/v1/advanced-search/export')
        .send({
          query: 'test',
          entity: 'organizations',
          columns: ['id'],
          columnsName: ['ID'],
        })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.text.charCodeAt(0)).equal(0xfeff);
          return done();
        });
    });

    it('should flatten nested objects when parent key is used as column', (done) => {
      const SearchService = require('../../../api/services/SearchService');
      sinon.stub(SearchService, 'collectionSearch').resolves({
        hits: [
          {
            document: {
              id: '1',
              title: 'Karst Book',
              authors: [
                { id: 10, nickname: 'PANOS Vladimir' },
                { id: 20, nickname: 'DUPONT Jean' },
              ],
              iso3166: [
                { iso: 'FR', name: 'France' },
                { iso: 'FR-OCC', name: 'Occitanie' },
              ],
              editor: { id: 5, name: 'MDPI' },
            },
          },
        ],
        found: 1,
      });

      supertest(sails.hooks.http.app)
        .post('/api/v1/advanced-search/export')
        .send({
          query: 'test',
          entity: 'documents',
          columns: ['id', 'title', 'authors', 'iso3166', 'editor'],
          columnsName: ['ID', 'Title', 'Author', 'Country', 'Editor'],
        })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          // Should NOT contain [object Object]
          should(res.text).not.match(/\[object Object\]/);
          // Authors: first string field is nickname (id is number)
          should(res.text).match(/PANOS Vladimir; DUPONT Jean/);
          // iso3166: first string field is iso
          should(res.text).match(/FR; FR-OCC/);
          // editor: single object, first string field is name (id is number)
          should(res.text).match(/MDPI/);
          return done();
        });
    });

    it('should resolve dot-notation keys through nested structures', (done) => {
      const SearchService = require('../../../api/services/SearchService');
      sinon.stub(SearchService, 'collectionSearch').resolves({
        hits: [
          {
            document: {
              id: '1',
              authors: [
                { id: 10, nickname: 'Author A' },
                { id: 20, nickname: 'Author B' },
              ],
              editor: { id: 5, name: 'Publisher X' },
            },
          },
        ],
        found: 1,
      });

      supertest(sails.hooks.http.app)
        .post('/api/v1/advanced-search/export')
        .send({
          query: 'test',
          entity: 'documents',
          columns: ['id', 'authors.nickname', 'editor.name'],
          columnsName: ['ID', 'Author', 'Editor'],
        })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.text).not.match(/\[object Object\]/);
          should(res.text).match(/Author A; Author B/);
          should(res.text).match(/Publisher X/);
          return done();
        });
    });

    it('should handle null and undefined values in CSV', (done) => {
      const SearchService = require('../../../api/services/SearchService');
      sinon.stub(SearchService, 'collectionSearch').resolves({
        hits: [{ document: { id: '1', name: null, desc: undefined } }],
        found: 1,
      });

      supertest(sails.hooks.http.app)
        .post('/api/v1/advanced-search/export')
        .send({
          query: 'test',
          entity: 'organizations',
          columns: ['id', 'name', 'desc'],
          columnsName: ['ID', 'Name', 'Description'],
        })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.text).match(/1,,/);
          return done();
        });
    });
  });
});
