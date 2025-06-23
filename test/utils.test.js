import { expect } from 'chai';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

describe('Utils Test Suite', () => {
  describe('RedisClient', () => {
    it('isAlive returns true when connected', () => {
      expect(redisClient.isAlive()).to.equal(true);
    });
  });

  describe('DBClient', function () {
    // Increase timeout to allow for db connection
    this.timeout(10000);

    // This hook runs before the tests in this block, waiting for the connection
    before((done) => {
      setTimeout(done, 3000);
    });

    it('isAlive returns true when connected', () => {
      expect(dbClient.isAlive()).to.equal(true);
    });

    it('nbUsers returns a number', async () => {
      const numUsers = await dbClient.nbUsers();
      expect(numUsers).to.be.a('number');
    });

    it('nbFiles returns a number', async () => {
      const numFiles = await dbClient.nbFiles();
      expect(numFiles).to.be.a('number');
    });
  });
});
