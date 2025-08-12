/**
 * Helper for localizing parent descriptions in bibliographic metadata records
 *
 * This helper adds localized parent information to dcDescriptions based on the
 * client's language preference. It processes parent records and adds appropriate
 * localized messages for collection and issue parents.
 */

module.exports = {
  friendlyName: 'Localize parent descriptions',

  description:
    'Add localized parent information to dcDescriptions based on client language',

  inputs: {
    record: {
      type: 'ref',
      description: 'The bibliographic metadata record to process',
      required: true,
    },

    req: {
      type: 'ref',
      description: 'The request object for i18n access',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Record with localized parent descriptions',
      outputType: 'ref',
    },
  },

  async fn(inputs) {
    const { record, req } = inputs;

    // If record doesn't exist or has no parents, return as-is
    if (!record || !record.parents || record.parents.length === 0) {
      return record;
    }

    const localizedDescriptions = [];

    // Add existing descriptions first
    if (record.dcDescriptions && record.dcDescriptions.length > 0) {
      localizedDescriptions.push(...record.dcDescriptions);
    }

    // Process each parent to add localized description
    record.parents.forEach((parent) => {
      if (parent.dcTitle && parent.dcTypeGrottocenter) {
        let localizedKey = '';

        // Determine the appropriate localization key based on parent type
        if (parent.dcTypeGrottocenter.includes('issue')) {
          localizedKey = 'Parent issue title';
        } else if (parent.dcTypeGrottocenter.includes('collection')) {
          localizedKey = 'Parent collection title';
        }

        // Add localized parent description if we found a matching type
        if (localizedKey) {
          // Try to get localized prefix using req.i18n
          let localizedPrefix = localizedKey; // fallback

          // eslint-disable-next-line no-underscore-dangle
          if (req.i18n && typeof req.i18n.__ === 'function') {
            // eslint-disable-next-line no-underscore-dangle
            localizedPrefix = req.i18n.__(localizedKey);
          }

          const finalMessage = `${localizedPrefix}: ${parent.dcTitle}`;
          localizedDescriptions.push(finalMessage);
        }
      }
    });

    // Update the record's dcDescriptions
    record.dcDescriptions = localizedDescriptions;

    return record;
  },
};
