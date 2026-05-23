import { accountingTableCatalog as baseAccountingTableCatalog, type AccountingTableTemplate } from './table-catalog';
import { ifrsReportingAccountingTables } from './ifrs-reporting-table-catalog';
import { consolidationAccountingTables } from './consolidation-table-catalog';
import { taxPayrollAccountingTables } from './tax-payroll-table-catalog';
import { auditAccountingTables } from './audit-table-catalog';
import { managementDecisionAccountingTables } from './management-decision-table-catalog';
import { publicSectorAccountingTables } from './public-sector-table-catalog';
import { aisControlAccountingTables } from './ais-control-table-catalog';
import { errorSuspenseAccountingTables } from './error-suspense-table-catalog';

export type { AccountingTableLevel, AccountingTableTemplate } from './table-catalog';

export const accountingTableCatalog: AccountingTableTemplate[] = [
  ...baseAccountingTableCatalog,
  ...ifrsReportingAccountingTables,
  ...consolidationAccountingTables,
  ...taxPayrollAccountingTables,
  ...auditAccountingTables,
  ...managementDecisionAccountingTables,
  ...publicSectorAccountingTables,
  ...aisControlAccountingTables,
  ...errorSuspenseAccountingTables,
];

export const accountingTableTemplateLabels = accountingTableCatalog.map((template) => template.label);

export function applyAccountingTableTemplate(label: string) {
  return accountingTableCatalog.find((template) => template.label === label);
}
