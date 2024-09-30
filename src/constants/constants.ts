import assert from 'assert';

// ***** General *****
assert.ok(process.env.PORT, 'PORT is not defined in .env file');
export const PORT = process.env.PORT;

assert.ok(process.env.NODE_ENV, 'NODE_ENV is not defined in .env file');
export const NODE_ENV = process.env.NODE_ENV;

// ***** Database *****
assert.ok(process.env.PROD_MONGO_URI, 'PROD_MONGO_URI is not defined in .env file');
export const PROD_MONGO_URI = process.env.PROD_MONGO_URI;

assert.ok(process.env.DEV_MONGO_URI, 'DEV_MONGO_URI is not defined in .env file');
export const DEV_MONGO_URI = process.env.DEV_MONGO_URI;

assert.ok(process.env.LOCAL_MONGO_URI, 'LOCAL_MONGO_URI is not defined in .env file');
export const LOCAL_MONGO_URI = process.env.LOCAL_MONGO_URI;

// ***** DATABASE TO USE *****
// based on NODE_ENV
export const MONGO_URI =
    NODE_ENV === 'production' ? PROD_MONGO_URI : NODE_ENV === 'development' ? DEV_MONGO_URI : LOCAL_MONGO_URI;
