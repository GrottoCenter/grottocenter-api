// This fix issue https://github.com/balderdashy/sails/issues/2691 when doing a prod deployment
module.exports = {
  hookTimeout: 600000
};
