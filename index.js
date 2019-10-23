// eslint-disable-next-line import/no-unresolved
const dotenv = require('dotenv');
const path = require('path');
const logger = require('./lib/logger');

const environment = process.env.NODE_ENV || 'dev';

if (environment === 'dev') {
    logger.info(`Loading Environment Variables from ${environment}.env`);
    dotenv.config({ path: path.resolve(process.cwd(), `./environments/${environment}/.env`) });
}

const server = require('./lib/server.js');

const port = process.env.SERVER_PORT || 5577;
server.listen(port, () => {
  logger.info(`Listening on port ${port}`);
});
