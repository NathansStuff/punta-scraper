import {
    createLog,
    deleteLogById,
    findAllLogs,
    findLogById,
    findLogsByPartnerId,
    findLogsByPartnerIdAndClientId,
    updateLogById,
} from './logDal';
import { Log, LogWithId } from './logType';

// Get all Logs
export async function getAllLogs(): Promise<LogWithId[]> {
    const Logs = await findAllLogs();
    return Logs;
}

// Get Log by id
export async function getLogById(id: string): Promise<LogWithId | null> {
    const Log = await findLogById(id);
    return Log;
}

// Create Log
export async function createNewLog(Log: Log): Promise<LogWithId> {
    const newLog = await createLog(Log);
    return newLog;
}

// Update Log
export async function updateLog(id: string, updatedData: Partial<Log>): Promise<LogWithId | null> {
    const Log = await updateLogById(id, updatedData);
    return Log;
}

// Delete Log
export async function deleteLog(id: string): Promise<void | null> {
    const response = await deleteLogById(id);
    return response;
}

// Get All Logs for Partner Id
export async function getAllLogsForPartnerId(partnerId: string, days?: number): Promise<LogWithId[] | null> {
    const Logs = await findLogsByPartnerId(partnerId, days);
    return Logs;
}

// Get All Logs for Partner Id + Client Id
export async function getAllLogsForPartnerIdAndClientId(
    partnerId: string,
    clientId: string,
    days?: number
): Promise<LogWithId[] | null> {
    const Logs = await findLogsByPartnerIdAndClientId(partnerId, clientId, days);
    return Logs;
}
