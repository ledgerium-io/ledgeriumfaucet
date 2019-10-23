/* eslint-disable no-param-reassign */
/* eslint-disable radix */
const redis = require('redis');
const logger = require('../logger');

class Redis {
    constructor() {
      this.client = redis.createClient(process.env.REDIS_URL);
      this.connected = false;
      this.limit = parseInt(process.env.REQUEST_LIMIT,10) || 3;
      this.expiry = parseInt(process.env.REDIS_EXPIRE_SECONDS, 10) * 1000 || 86400000;
      this.listen();
    }

    listen() {
      const self = this;
      this.client.on('connect', () => {
          logger.info('Connected to Redis');
          self.connected = true;
      });

      this.client.on('error', (err) => {
          logger.error(`Error connecting to Redis: ${err}`);
          self.connected = false;
      });
    }

    checkLimit(address, amount) {
      const self = this;
      return new Promise((resolve, reject) => {
        // eslint-disable-next-line consistent-return
        this.client.get(address.toLowerCase(), (error, result) => {
          if (error) return reject(error);
          if (!result) {
            self.client.set(address.toLowerCase(), JSON.stringify({ address: address.toLowerCase(), amount, timestamp: Date.now() }), 'EX', self.expiry);
            return resolve();
          }
          try {
            const newresult = JSON.parse(result);
            if (newresult.address !== address.toLowerCase(address)) return resolve();
            // eslint-disable-next-line prefer-promise-reject-errors
            if (newresult.amount === self.limit) return reject('You have reached the 24 hour limit.');
            // eslint-disable-next-line prefer-promise-reject-errors
            if (newresult.amount + amount > self.limit) return reject(`Requesting ${amount} would put you over the 24 hour limit. Requests: ${result.amount}/${self.limit}. Limit expires in ${self.timeLeft(result.timestamp)}`);

            self.client.set(address.toLowerCase(), JSON.stringify({ address: address.toLowerCase(), amount: result.amount + amount, timestamp: Date.now() }), 'EX', self.expiry);

            return resolve();
          } catch (newerror) {
            logger.error(newerror.message || newerror);
            reject(newerror.message || newerror);
          }
        });
      });
    }

    // eslint-disable-next-line class-methods-use-this
    secondsToString(uptime) {
      if (uptime > 86400) {
        uptime /= 86400;
        return (`${uptime.toFixed(3)} days`);
      } if (uptime > 3600) {
        uptime /= 3600;
        return (`${uptime.toFixed(2)} hours`);
      } if (uptime > 60) {
        uptime /= 60;
        return (`${uptime.toFixed(2)} minutes`);
      }
      return (`${uptime.toFixed(0)} seconds`);
    }

    timeLeft(timestamp) {
      const timeNeeded = this.expiry;
      const timePassed = (Date.now() - timestamp);
      const timeLeft = timeNeeded - timePassed;
      return this.secondsToString(timeLeft / 1000);
    }
}

module.exports = Redis;
