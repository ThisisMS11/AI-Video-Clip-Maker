import { MongoClient } from 'mongodb';
import { createLoggerWithLabel } from './logger';
import { RETRIES } from '@/constants';
const logger = createLoggerWithLabel('MONGO_CLIENT');

if (!process.env.MONGODB_URI) {
    logger.error('MongoDB URI not found');
    throw new Error('Please add your Mongo URI to .env.local');
}

const uri = process.env.MONGODB_URI;
const RETRY_DELAY_MS = 1000;

async function connectWithRetry(): Promise<MongoClient> {
    for (let attempt = 1; attempt <= RETRIES.MONGO_DB_SERVICE; attempt++) {
        try {
            const client = new MongoClient(uri);
            await client.connect();
            logger.info(`MongoDB connection successful on attempt ${attempt}`);
            return client;
        } catch (error) {
            logger.error(
                `MongoDB connection attempt ${attempt} failed: ${JSON.stringify(error)}`
            );

            if (attempt === RETRIES.MONGO_DB_SERVICE) {
                logger.error(
                    'Max retries reached. Unable to connect to MongoDB.'
                );
                throw new Error(
                    'Failed to connect to MongoDB after multiple attempts'
                );
            }

            // Wait before next retry
            await new Promise((resolve) =>
                setTimeout(resolve, RETRY_DELAY_MS * attempt)
            );
        }
    }

    throw new Error('Unexpected error in MongoDB connection');
}

let _client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
    let globalWithMongo = global as typeof globalThis & {
        _mongoClientPromise?: Promise<MongoClient>;
    };

    if (!globalWithMongo._mongoClientPromise) {
        globalWithMongo._mongoClientPromise = connectWithRetry();
    }
    clientPromise = globalWithMongo._mongoClientPromise;
} else {
    clientPromise = connectWithRetry();
}

export default clientPromise;
