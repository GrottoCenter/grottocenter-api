/**
 * TTokenBlacklist.js
 *
 * @description :: Stores per-user token revocation timestamps.
 *                 Tokens with iat < revoked_before are rejected.
 */

module.exports = {
  tableName: 't_token_blacklist',
  primaryKey: 'id_caver',

  attributes: {
    id_caver: {
      type: 'number',
      columnName: 'id_caver',
      required: true,
      unique: true,
    },

    revoked_before: {
      type: 'ref',
      columnName: 'revoked_before',
      columnType: 'timestamptz',
      required: true,
    },
  },
};
