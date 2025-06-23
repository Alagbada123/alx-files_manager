import { expect } from 'chai';
import sinon from 'sinon';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

describe('Utils', () => {
  describe('RedisClient', () => {
    it('isAlive returns true when connected', () => {
      expect(redisClient.isAlive()).to.equal(true);
    });

    // Add more tests for get, set, del using sinon stubs
  });

  describe('DBClient', function() {
    this.timeout(10000); // Increase timeout for db connection
    it('isAlive returns true when connected', (done) => {
        setTimeout(() => {
          expect(dbClient.isAlive()).to.equal(true);
          done();
        }, 3000);
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
