import { model, models } from 'mongoose';

import { ReportSchema } from './reportSchema';
import { Report } from './reportType';

export const ReportModel = models.Report || model<Report>('Report', ReportSchema);
