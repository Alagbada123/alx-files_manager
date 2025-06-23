#!/usr/bin/node

import sha1 from 'sha1';
import Bull from 'bull';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const userQueue = new Bull('userQueue');

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;
    if (!email) return res.status(400).send({ error: 'Missing email' });
    if (!password) return res.status(400).send({ error: 'Missing password' });

    const usersCollection = await dbClient.users();
    const user = await usersCollection.findOne({ email });
    if (user) return res.status(400).send({ error: 'Already exist' });

    const result = await usersCollection.insertOne({ email, password: sha1(password) });
    const userId = result.insertedId.toString();

    userQueue.add({ userId }); // Add job to the queue for welcome email

    return res.status(201).send({ id: userId, email });
  }

  static async getMe(req, res) {
    const token = req.header('X-Token');
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (userId) {
      const user = await (await dbClient.users()).findOne({ _id: new ObjectId(userId) });
      if (user) {
        return res.status(200).send({ id: user._id, email: user.email });
      }
    }
    return res.status(401).send({ error: 'Unauthorized' });
  }
}

export default UsersController;
