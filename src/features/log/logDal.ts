import { connectMongo } from 'src/middleware/mongoDbConnect';

import { LogModel } from './logModel';
import { Log, LogWithId } from './logType';

// Get all Logs
export async function findAllLogs(): Promise<LogWithId[]> {
    await connectMongo();
    return await LogModel.find().skip(0).limit(100);
}

// Get Log by ID
export async function findLogById(id: string): Promise<LogWithId | null> {
    await connectMongo();
    return await LogModel.findById(id);
}

// Create a new Log
export async function createLog(LogData: Log): Promise<LogWithId> {
    await connectMongo();
    return await LogModel.create(LogData);
}

// Update Log by ID
export async function updateLogById(id: string, updatedData: Partial<Log>): Promise<LogWithId | null> {
    await connectMongo();
    return await LogModel.findByIdAndUpdate(id, updatedData, { new: true });
}

// Delete Log by ID
export async function deleteLogById(id: string): Promise<void | null> {
    await connectMongo();
    return await LogModel.findByIdAndDelete(id);
}

// Get All Logs for Partner Id within timeframe
export async function findLogsByPartnerId(id: string, days = 30): Promise<LogWithId[] | null> {
    await connectMongo();
    return await LogModel.find({
        partnerId: id,
        createdAt: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) },
    });
}

// Get All Logs for Partner Id + Client Id
export async function findLogsByPartnerIdAndClientId(
    partnerId: string,
    clientId: string,
    days = 30
): Promise<LogWithId[] | null> {
    await connectMongo();
    return await LogModel.find({
        partnerId,
        clientId,
        createdAt: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) },
    });
}

// Find logs by query
export async function findLogsByQuery(query: object): Promise<LogWithId[]> {
    await connectMongo();
    return await LogModel.find(query).exec();
}
