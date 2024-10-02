import { connectMongo } from 'src/middleware/mongoDbConnect';

import { ReportModel } from './reportModel';
import { Report, ReportWithId } from './reportType';

// ***** Basic CRUD *****
// Create a Report
export async function createReport(Report: Report): Promise<ReportWithId> {
    await connectMongo();
    const result = await ReportModel.create(Report);
    return result;
}

// Get a Report by ID
export async function getReportById(id: string): Promise<ReportWithId> {
    await connectMongo();
    const result = await ReportModel.findById(id);
    return result;
}

// Get all Reports
export async function getAllReports(): Promise<ReportWithId[]> {
    await connectMongo();
    const result = await ReportModel.find({});
    return result;
}

// Delete a Report
export async function deleteReportById(id: string): Promise<void> {
    await connectMongo();
    await ReportModel.findByIdAndDelete(id);
}
