/**
 */

module.exports = {
  getSetting: (key) =>
    new Promise((resolve, reject) => {
      // TODO replace by an access to table settings
      // For now, just implement a switchcase
      switch (key) {
        case 'map.partition.row':
          resolve(4);
          break;
        case 'map.partition.column':
          resolve(5);
          break;
        case 'map.partition.group.minsize':
          resolve(50);
          break;
        default:
          reject(new Error('Key not found'));
      }
    }),
};
