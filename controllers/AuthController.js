#!/usr/bin/node

import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  static async getConnect(req, res) {
    const authData = req.header('Authorization');
    if (!authData || !authData.startsWith('Basic ')) return res.status(401).send({ error: 'Unauthorized' });
    
    const userData = Buffer.from(authData.substring(6), 'base64').toString('utf-8');
    const [email, password] = userData.split(':');
    if (!email || !password) return res.status(401).send({ error: 'Unauthorized' });

    const user = await (await dbClient.users()).findOne({ email, password: sha1(password) });
    if (user) {
      const token = uuidv4();
      const key = `auth_${token}`;
      await redisClient.set(key, user._id.toString(), 24 * 60 * 60);
      return res.status(200).send({ token });
    }
    
    return res.status(401).send({ error: 'Unauthorized' });
  }

  static async getDisconnect(req, res) {
    const token = req.header('X-Token');
    if (!token) return res.status(401).send({ error: 'Unauthorized' });
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    
    if (userId) {
      await redisClient.del(key);
      return res.status(204).send();
    }
    
    return res.status(401).send({ error: 'Unauthorized' });
  }
}
export default AuthController;
