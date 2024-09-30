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

assert.ok(process.env.GOOGLE_ADDRESS_API_KEY, 'GOOGLE_ADDRESS_API_KEY is not defined in .env file');
export const GOOGLE_ADDRESS_API_KEY = process.env.GOOGLE_ADDRESS_API_KEY;

// ***** MANAGE_URL *****
assert.ok(process.env.LOCAL_MANAGE_API_URL, 'LOCAL_MANAGE_API_URL is not defined in .env file');
export const LOCAL_MANAGE_API_URL = process.env.LOCAL_MANAGE_API_URL;

assert.ok(process.env.DEV_MANAGE_API_URL, 'DEV_MANAGE_API_URL is not defined in .env file');
export const DEV_MANAGE_API_URL = process.env.DEV_MANAGE_API_URL;

assert.ok(process.env.PROD_MANAGE_API_URL, 'PROD_MANAGE_API_URL is not defined in .env file');
export const PROD_MANAGE_API_URL = process.env.PROD_MANAGE_API_URL;

// ***** MANAGE_API_URL TO USE *****
// based on NODE_ENV
export const MANAGE_API_URL =
    NODE_ENV === 'production'
        ? PROD_MANAGE_API_URL
        : NODE_ENV === 'development'
        ? DEV_MANAGE_API_URL
        : LOCAL_MANAGE_API_URL;

// ***** DIQ_API_KEY *****

assert.ok(process.env.LOCAL_DIQ_API_KEY, 'LOCAL_DIQ_API_KEY is not defined in .env file');
export const LOCAL_DIQ_API_KEY = process.env.LOCAL_DIQ_API_KEY;

assert.ok(process.env.DEV_DIQ_API_KEY, 'DEV_DIQ_API_KEY is not defined in .env file');
export const DEV_DIQ_API_KEY = process.env.DEV_DIQ_API_KEY;

assert.ok(process.env.PROD_DIQ_API_KEY, 'PROD_DIQ_API_KEY is not defined in .env file');
export const PROD_DIQ_API_KEY = process.env.PROD_DIQ_API_KEY;

// ***** DIQ_API_KEY TO USE *****
// based on NODE_ENV
export const DIQ_API_KEY =
    NODE_ENV === 'production' ? PROD_DIQ_API_KEY : NODE_ENV === 'development' ? DEV_DIQ_API_KEY : LOCAL_DIQ_API_KEY;
