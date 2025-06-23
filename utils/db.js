#!/usr/bin/node

import { MongoClient } from 'mongodb';

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 27017;
const DB_DATABASE = process.env.DB_DATABASE || 'files_manager';
const url = `mongodb://${DB_HOST}:${DB_PORT}`;

class DBClient {
  constructor() {
    this.client = new MongoClient(url, { useUnifiedTopology: true, useNewUrlParser: true });
    this.client.connect((err) => {
      if (!err) {
        this.db = this.client.db(DB_DATABASE);
      } else {
        console.log('MongoDB connection error:', err);
        this.db = false;
      }
    });
  }

  isAlive() {
    return !!this.db;
  }

  async nbUsers() {
    return this.db.collection('users').countDocuments();
  }

  async nbFiles() {
    return this.db.collection('files').countDocuments();
  }

  async users() {
    return this.db.collection('users');
  }

  async files() {
    return this.db.collection('files');
  }
}

const dbClient = new DBClient();
export default dbClient;
