import { createReport, deleteReportById, getAllReports, getReportById } from './reportDal';
import { Report, ReportWithId } from './reportType';

// Service to get a Report by ID
export async function getReportByIdService(id: string): Promise<ReportWithId | null> {
    return await getReportById(id);
}

// Service to get all Reports
export async function getAllReportsService(): Promise<ReportWithId[]> {
    return await getAllReports();
}

// Service to create a Report
export async function createReportService(Report: Report): Promise<ReportWithId> {
    return await createReport(Report);
}

// Service to delete a Report
export async function deleteReportService(id: string): Promise<void> {
    return await deleteReportById(id);
}
