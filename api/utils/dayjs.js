const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
const duration = require('dayjs/plugin/duration');

dayjs.extend(customParseFormat);
dayjs.extend(duration);

module.exports = dayjs;
