import { MongoMemoryServer } from "mongodb-memory-server";
import { writeFileSync } from "node:fs";

const mongo = await MongoMemoryServer.create();
const uri = mongo.getUri();
writeFileSync("/tmp/blogiz-mongo-uri.txt", uri);
console.log(uri);
// Keep alive
setInterval(() => {}, 1 << 30);
