import { Request, Response } from 'express';
import { BadRequestError } from 'src/exceptions/BadRequestError';
import { ParamsWithId } from 'src/types';

import {
    createNewLog,
    deleteLog,
    getAllLogs,
    getAllLogsForPartnerId,
    getAllLogsForPartnerIdAndClientId,
    getLogById,
    updateLog,
} from './logService';
import { Log, LogRequest, LogWithId } from './logType';

// Get all Logs
export async function getAllLogsHandler(req: Request, res: Response<LogWithId[]>): Promise<void> {
    const logs = await getAllLogs();
    res.status(200).json(logs);
}

// Get Log by id
export async function getLogByIdHandler(
    req: Request<ParamsWithId, LogWithId, object>,
    res: Response<LogWithId>
): Promise<void> {
    const safeId = ParamsWithId.parse(req.params);
    const response = await getLogById(safeId.id);
    if (!response) throw new BadRequestError('Log not found');

    res.status(200).json(response);
}

// Create Log
export async function createLogHandler(req: Request<object, LogWithId, Log>, res: Response<LogWithId>): Promise<void> {
    const safeLogData = Log.parse(req.body);
    const newLog = await createNewLog(safeLogData);
    res.status(201).json(newLog);
}

// Update Log
export async function updateLogHandler(
    req: Request<ParamsWithId, LogWithId, Log>,
    res: Response<LogWithId>
): Promise<void> {
    const safeLogData = Log.parse(req.body);
    const safeId = ParamsWithId.parse(req.params);

    const result = await updateLog(safeId.id, safeLogData);
    if (result) {
        res.status(200).json(result);
    } else {
        throw new BadRequestError('Log not found');
    }
}

// Delete Log
export async function deleteLogHandler(
    req: Request<ParamsWithId, object, object>,
    res: Response<{ message: string }>
): Promise<void> {
    const safeId = ParamsWithId.parse(req.params);
    const response = await deleteLog(safeId.id);
    if (response === null) throw new BadRequestError('Log not found');
    const message = `Log with id ${safeId.id} deleted`;
    res.status(204).json({ message });
}

// Get All Logs for Partner Id
export async function getAllLogsForPartnerIdHandler(req: Request, res: Response<LogWithId[]>): Promise<void> {
    const safeBody = LogRequest.parse(req.body);
    const logs = await getAllLogsForPartnerId(safeBody.partnerId, safeBody.days);
    if (!logs) throw new BadRequestError('Logs not found');

    res.status(200).json(logs);
}

// Get All Logs for Partner Id + Client Id
export async function getAllLogsForPartnerIdAndClientIdHandler(
    req: Request,
    res: Response<LogWithId[]>
): Promise<void> {
    const safeId = LogRequest.parse(req.body);
    const logs = await getAllLogsForPartnerIdAndClientId(safeId.partnerId, safeId.clientId ?? '', safeId.days);
    if (!logs) throw new BadRequestError('Logs not found');

    res.status(200).json(logs);
}
