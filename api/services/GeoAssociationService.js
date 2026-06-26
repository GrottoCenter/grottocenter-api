/**
 * GeoAssociationService.js
 *
 * @description :: Service for managing associations between organizations and geographic entities.
 */

/**
 * Maps a geographic entity type string ('country' | 'region' | 'massif') to the
 * Waterline config needed to associate it with an organization:
 * - junctionModel: the join model linking the entity to organizations (grottos)
 * - entityModel: the Waterline model for the entity itself
 * - junctionField: the entity-side foreign-key field on the junction model
 * - entityPk: the primary-key attribute used to look the entity up
 * Keeping this here lets each method stay entity-agnostic and resolve the right
 * models/fields from a single lookup.
 */
const mapEntityType = {
  country: {
    junctionModel: 'JOrganizationCountry',
    entityModel: 'TCountry',
    junctionField: 'country',
    entityPk: 'id', // Actually in TCountry model it is mapped to 'id' which corresponds to 'iso' column
  },
  region: {
    junctionModel: 'JOrganizationRegion',
    entityModel: 'TISO31662',
    junctionField: 'region',
    entityPk: 'id', // TISO31662 uses 'id' for 'iso'
  },
  massif: {
    junctionModel: 'JOrganizationMassif',
    entityModel: 'TMassif',
    junctionField: 'massif',
    entityPk: 'id', // TMassif uses 'id'
  },
};

module.exports = {
  /**
   * Sets the association between a geographic entity and an organization.
   * Supports associating multiple managing organizations to a single geographic entity.
   *
   * @param {string} entityType - 'country', 'region', or 'massif'
   * @param {string|number} entityId - The ID of the geographic entity
   * @param {number} organizationId - The ID of the organization
   * @param {number} userId - The ID of the caver performing the action
   * @returns {Promise<Object>} The entity ID and organization ID
   */
  async setAssociation(entityType, entityId, organizationId, userId) {
    const config = mapEntityType[entityType];
    if (!config) {
      const error = new Error('Invalid entity type');
      error.code = 'E_BAD_REQUEST';
      throw error;
    }

    if (!entityId) {
      const error = new Error('entityId is required');
      error.code = 'E_BAD_REQUEST';
      throw error;
    }

    // Defense-in-depth: the validateId policy already rejects invalid numeric
    // IDs at the route level (returning 404), so this service-level check is
    // currently unreachable via the API. It remains as a guard for any direct
    // service call that bypasses the controller/policy layer.
    const orgId = parseInt(organizationId, 10);
    if (Number.isNaN(orgId) || orgId <= 0 || orgId > 2147483647) {
      const error = new Error(
        'organizationId must be a valid positive integer within range'
      );
      error.code = 'E_BAD_REQUEST';
      throw error;
    }

    return sails.getDatastore().transaction(async (db) => {
      // 1. Verify the Organization exists and is not soft-deleted
      const grotto = await TGrotto.findOne({
        id: orgId,
        isDeleted: false,
      }).usingConnection(db);

      if (!grotto) {
        const error = new Error('Organization not found');
        error.code = 'E_NOT_FOUND';
        throw error;
      }

      // 2. Verify the Geographic Entity exists
      const geoEntity = await sails.models[config.entityModel.toLowerCase()]
        .findOne({ [config.entityPk]: entityId })
        .usingConnection(db);

      if (!geoEntity) {
        const error = new Error('Geographic entity not found');
        error.code = 'E_NOT_FOUND';
        throw error;
      }

      // 3. Upsert the Association in the Junction Table
      const JunctionModel = sails.models[config.junctionModel.toLowerCase()];

      const existingJunction = await JunctionModel.findOne({
        [config.junctionField]: entityId,
        grotto: orgId,
      }).usingConnection(db);

      if (existingJunction) {
        // Update existing association
        await JunctionModel.updateOne({
          [config.junctionField]: entityId,
          grotto: orgId,
        })
          .set({
            reviewer: userId,
            dateReviewed: new Date(),
          })
          .usingConnection(db);
      } else {
        // Create new association
        await JunctionModel.create({
          [config.junctionField]: entityId,
          grotto: orgId,
          author: userId,
          dateInscription: new Date(),
        }).usingConnection(db);
      }

      return {
        entityId,
        organizationId: orgId,
      };
    });
  },

  /**
   * Removes the association between a geographic entity and a managing organization.
   *
   * @param {string} entityType - 'country', 'region', or 'massif'
   * @param {string|number} entityId - The ID of the geographic entity
   * @param {number} organizationId - The ID of the organization to remove
   * @returns {Promise<boolean>} True if removed successfully
   */
  async removeAssociation(entityType, entityId, organizationId) {
    const config = mapEntityType[entityType];
    if (!config) {
      const error = new Error('Invalid entity type');
      error.code = 'E_BAD_REQUEST';
      throw error;
    }

    if (!entityId) {
      const error = new Error('entityId is required');
      error.code = 'E_BAD_REQUEST';
      throw error;
    }

    // Defense-in-depth: the validateId policy already rejects invalid numeric
    // IDs at the route level (returning 404), so this service-level check is
    // currently unreachable via the API. It remains as a guard for any direct
    // service call that bypasses the controller/policy layer.
    const orgId = parseInt(organizationId, 10);
    if (Number.isNaN(orgId) || orgId <= 0 || orgId > 2147483647) {
      const error = new Error(
        'organizationId must be a valid positive integer within range'
      );
      error.code = 'E_BAD_REQUEST';
      throw error;
    }

    return sails.getDatastore().transaction(async (db) => {
      // 1. Verify the Geographic Entity exists
      const geoEntity = await sails.models[config.entityModel.toLowerCase()]
        .findOne({ [config.entityPk]: entityId })
        .usingConnection(db);

      if (!geoEntity) {
        const error = new Error('Geographic entity not found');
        error.code = 'E_NOT_FOUND';
        throw error;
      }

      // 2. Remove the Association
      const JunctionModel = sails.models[config.junctionModel.toLowerCase()];
      const existingJunction = await JunctionModel.findOne({
        [config.junctionField]: entityId,
        grotto: orgId,
      }).usingConnection(db);

      if (!existingJunction) {
        const error = new Error('Association not found');
        error.code = 'E_NOT_FOUND';
        throw error;
      }

      await JunctionModel.destroyOne({
        [config.junctionField]: entityId,
        grotto: orgId,
      }).usingConnection(db);

      return true;
    });
  },

  /**
   * Gets the formatted organizations associated with a geographic entity for GET endpoints.
   *
   * Note: returns [] (not null) when no associations exist. This intentionally
   * diverges from the spec wording ("include a null value") because an empty
   * array is more appropriate for a many-to-many relationship — it avoids
   * null-checks on the client and matches the Swagger schema (type: array).
   *
   * @param {string} entityType - 'country', 'region', or 'massif'
   * @param {string|number} entityId - The ID of the geographic entity
   * @returns {Promise<Array>} The array of formatted organization objects
   */
  async getFormattedOrganizations(entityType, entityId) {
    const config = mapEntityType[entityType];
    if (!config || !entityId) return [];

    const JunctionModel = sails.models[config.junctionModel.toLowerCase()];
    const junctions = await JunctionModel.find({
      [config.junctionField]: entityId,
    }).populate('grotto');

    if (!junctions || junctions.length === 0) return [];

    const grottos = junctions.map((j) => j.grotto).filter(Boolean);

    if (!grottos || grottos.length === 0) return [];

    const activeGrottoIds = grottos
      .filter((g) => !g.isDeleted)
      .map((g) => g.id);

    let names = [];
    if (activeGrottoIds.length > 0) {
      names = await TName.find({
        grotto: activeGrottoIds,
        isMain: true,
        isDeleted: false,
      });
    }

    const formattedOrganizations = grottos.map((grotto) => {
      if (grotto.isDeleted) {
        return {
          id: grotto.id,
          isDeleted: true,
          redirectTo: grotto.redirectTo || null,
        };
      }

      const name = names.find((n) => n.grotto === grotto.id);
      return {
        id: grotto.id,
        name: name ? name.name : null,
        language: name ? name.language : null,
      };
    });

    return formattedOrganizations;
  },
};
