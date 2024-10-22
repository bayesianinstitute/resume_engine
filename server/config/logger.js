import log4js from 'log4js';

log4js.configure({
    appenders: { file: { type: 'file', filename: 'scraper.log' } },
    categories: { default: { appenders: ['file'], level: 'info' } }
});

const getLogger = log4js.getLogger;
export default getLogger;
