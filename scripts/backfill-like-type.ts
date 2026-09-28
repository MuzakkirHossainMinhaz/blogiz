import mongoose from "mongoose";
import { backfillMissingLikeTypes } from "../src/lib/engagement";
import { connectDB } from "../src/lib/mongodb";

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is required");
    process.exit(1);
  }

  await connectDB();
  const updated = await backfillMissingLikeTypes();
  console.log(`Set type to like on ${updated} documents`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((error) => {
  console.error("Like type backfill failed");
  console.error(error instanceof Error ? error.name : "Error");
  process.exit(1);
});
