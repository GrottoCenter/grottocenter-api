const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
const duration = require('dayjs/plugin/duration');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(customParseFormat);
dayjs.extend(duration);
dayjs.extend(utc);
dayjs.extend(timezone);

module.exports = dayjs;
