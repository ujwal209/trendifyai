import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URL!;
const dbName = "trendify";

if (!uri) {
  throw new Error("MONGODB_URL environment variable is not set");
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const options = {
  autoSelectFamily: false,
};

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the MongoClient
  // is not recreated on every hot-reload
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export async function getDb(): Promise<Db> {
  const c = await clientPromise;
  return c.db(dbName);
}

export default clientPromise;
