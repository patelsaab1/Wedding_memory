import { afterAll, afterEach, beforeAll } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { clearAlbumAccessCache } from '../src/services/admin/album-access.service.js';

/** @type {MongoMemoryServer | undefined} */
let memoryServer;

beforeAll(async () => {
  memoryServer = await MongoMemoryServer.create();
  const uri = memoryServer.getUri('wedding_memory_test');
  process.env.MONGODB_URI = uri;
  await connectDatabase(uri);
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
  clearAlbumAccessCache();
});

afterAll(async () => {
  await disconnectDatabase();
  if (memoryServer) {
    await memoryServer.stop();
  }
});
