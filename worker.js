import Bull from 'bull';
import { ObjectId } from 'mongodb';
import imageThumbnail from 'image-thumbnail';
import fs from 'fs';
import dbClient from './utils/db';

const fileQueue = new Bull('fileQueue');
const userQueue = new Bull('userQueue');

fileQueue.process(async (job) => {
  const { fileId, userId } = job.data;

  if (!fileId) throw new Error('Missing fileId');
  if (!userId) throw new Error('Missing userId');

  const file = await (
    await dbClient.files()
  ).findOne({
    _id: new ObjectId(fileId),
    userId: new ObjectId(userId),
  });

  if (!file) throw new Error('File not found');

  const sizes = [500, 250, 100];
  for (const size of sizes) {
    const options = { width: size };
    const thumbnail = await imageThumbnail(file.localPath, options);
    const thumbPath = `${file.localPath}_${size}`;
    fs.writeFileSync(thumbPath, thumbnail);
  }
});

userQueue.process(async (job) => {
  const { userId } = job.data;
  if (!userId) throw new Error('Missing userId');

  const user = await (
    await dbClient.users()
  ).findOne({ _id: new ObjectId(userId) });
  if (!user) throw new Error('User not found');

  console.log(`Welcome ${user.email}!`);
});
