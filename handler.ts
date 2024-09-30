import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import awsServerlessExpress from 'aws-serverless-express';
import { IncomingMessage, Server, ServerResponse } from 'http';

import app from './src/core/app';

const server: Server = awsServerlessExpress.createServer(app);

exports.handler = (
    event: APIGatewayProxyEvent,
    context: Context
): Server<typeof IncomingMessage, typeof ServerResponse> => {
    return awsServerlessExpress.proxy(server, event, context);
};
