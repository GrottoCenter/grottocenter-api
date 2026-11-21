const should = require('should');
const {
  needsHistoryFallback,
  resolveDocumentValidationStatus,
  resolveSnapshotValidationStatus,
} = require('../../../api/utils/documentValidationStatus');
const {
  DOCUMENT_VALIDATION_STATUS,
} = require('../../../config/constants/document');

describe('documentValidationStatus', () => {
  const decided = new Date('2025-01-01T00:00:00Z');
  const undecided = { isValidated: false, dateValidation: null };

  it('exposes the four statuses', () => {
    should(Object.values(DOCUMENT_VALIDATION_STATUS).sort()).eql([
      'modificationPending',
      'pending',
      'rejected',
      'validated',
    ]);
  });

  describe('resolveDocumentValidationStatus()', () => {
    [
      {
        label: 'an accepted document',
        doc: { isValidated: true, dateValidation: decided },
        out: 'validated',
      },
      {
        label: 'an accepted document whose modification was refused',
        doc: {
          isValidated: true,
          dateValidation: decided,
          modifiedDocJson: null,
        },
        out: 'validated',
      },
      {
        label: 'a refused submission',
        doc: { isValidated: false, dateValidation: decided, validator: 1 },
        out: 'rejected',
      },
      {
        label: 'a new submission',
        doc: { ...undecided, modifiedDocJson: null },
        out: 'pending',
      },
      {
        label: 'a corrected submission after a refusal, despite its validator',
        doc: {
          ...undecided,
          validator: 1,
          modifiedDocJson: { wasValidated: false },
        },
        out: 'pending',
      },
      {
        label: 'a pending modification of an accepted document',
        doc: { ...undecided, modifiedDocJson: { wasValidated: true } },
        out: 'modificationPending',
      },
    ].forEach(({ label, doc, out }) => {
      it(`returns ${out} for ${label}`, () => {
        should(resolveDocumentValidationStatus(doc)).equal(out);
      });
    });

    it('falls back on the history for a legacy modification', () => {
      const legacy = { ...undecided, modifiedDocJson: { documentData: {} } };
      should(
        resolveDocumentValidationStatus(legacy, { hasValidatedHistory: true })
      ).equal('modificationPending');
      should(
        resolveDocumentValidationStatus(legacy, { hasValidatedHistory: false })
      ).equal('pending');
      should(resolveDocumentValidationStatus(legacy)).be.undefined();
    });

    it('ignores the history when the row tells', () => {
      should(
        resolveDocumentValidationStatus(
          { ...undecided, modifiedDocJson: { wasValidated: false } },
          { hasValidatedHistory: true }
        )
      ).equal('pending');
    });

    [
      { label: 'without isValidated', doc: { dateValidation: null } },
      { label: 'without dateValidation', doc: { isValidated: false } },
      { label: 'without modifiedDocJson', doc: undecided },
      { label: 'from search', doc: { id: '1', title: 'A title' } },
      { label: 'for a missing document', doc: undefined },
    ].forEach(({ label, doc }) => {
      it(`returns undefined ${label}`, () => {
        should(resolveDocumentValidationStatus(doc)).be.undefined();
      });
    });
  });

  describe('needsHistoryFallback()', () => {
    it('is true for a legacy pending modification only', () => {
      should(
        needsHistoryFallback({ ...undecided, modifiedDocJson: {} })
      ).be.true();
      should(
        needsHistoryFallback({
          ...undecided,
          modifiedDocJson: { wasValidated: true },
        })
      ).be.false();
      should(
        needsHistoryFallback({ ...undecided, modifiedDocJson: null })
      ).be.false();
      should(
        needsHistoryFallback({
          isValidated: false,
          dateValidation: decided,
          modifiedDocJson: {},
        })
      ).be.false();
      should(
        needsHistoryFallback({ isValidated: true, modifiedDocJson: {} })
      ).be.false();
    });
  });

  describe('resolveSnapshotValidationStatus()', () => {
    it('describes the historical version', () => {
      should(
        resolveSnapshotValidationStatus(
          { isValidated: true, dateValidation: decided },
          false
        )
      ).equal('validated');
      should(
        resolveSnapshotValidationStatus(
          { isValidated: false, dateValidation: decided },
          false
        )
      ).equal('rejected');
      should(resolveSnapshotValidationStatus(undecided, false)).equal(
        'pending'
      );
      should(resolveSnapshotValidationStatus(undecided, true)).equal(
        'modificationPending'
      );
    });
  });
});
