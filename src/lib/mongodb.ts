import mongoose from "mongoose";
import { requireMongoUri } from "@/lib/env";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  uri: string | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose || { conn: null, promise: null, uri: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

export async function connectDB() {
  const uri = requireMongoUri();

  if (cached.conn && cached.uri === uri) {
    return cached.conn;
  }

  if (cached.uri !== uri) {
    cached.promise = null;
    cached.conn = null;
    cached.uri = uri;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, { bufferCommands: false });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    cached.conn = null;
    throw error;
  }

  return cached.conn;
}
