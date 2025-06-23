import { expect } from 'chai';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

describe('Utils', () => {
  describe('RedisClient', () => {
    it('isAlive returns true when connected', () => {
      expect.hasAssertions();
      expect(redisClient.isAlive()).toEqual(true);
    });
  });

  describe('DBClient', function () {
    this.timeout(10000);
    before((done) => {
      setTimeout(done, 3000); // Wait for db to connect
    });

    it('isAlive returns true when connected', () => {
      expect.hasAssertions();
      expect(dbClient.isAlive()).toEqual(true);
    });

    it('nbUsers returns a number', async () => {
      expect.hasAssertions();
      const numUsers = await dbClient.nbUsers();
      expect(typeof numUsers).toEqual('number');
    });

    it('nbFiles returns a number', async () => {
      expect.hasAssertions();
      const numFiles = await dbClient.nbFiles();
      expect(typeof numFiles).toEqual('number');
    });
  });
});
