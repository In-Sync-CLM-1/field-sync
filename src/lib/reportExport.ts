import { RepReportSummary, ReportTotals, ReportPeriod, RepReportDetail } from '@/hooks/useReportData';
import { format } from 'date-fns';

const periodLabel: Record<ReportPeriod, string> = {
  today: 'Today',
  week: 'This Week',
  month: 'This Month',
};

function download(filename: string, text: string) {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const csvCell = (v: string | number) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Team report → one row per rep + a totals row. */
export function exportTeamReportCsv(rows: RepReportSummary[], totals: ReportTotals, period: ReportPeriod) {
  const header = ['Rep', 'Distance (km)', 'Clients Visited', 'Visits', 'Planned', 'Adherence %', 'Orders', 'Order Value', 'Collections', 'Collected Value', 'Hours'];
  const body = rows.map(r => [
    r.name, r.distanceKm, r.clientsVisited, r.visits, r.visitsPlanned, r.adherencePct,
    r.ordersCount, r.ordersValue, r.collectionsCount, r.collectionsValue, r.hours,
  ]);
  const totalRow = ['TOTAL', totals.distanceKm, totals.clientsVisited, totals.visits, '', '',
    totals.ordersCount, totals.ordersValue, totals.collectionsCount, totals.collectionsValue, ''];
  const lines = [header, ...body, totalRow].map(r => r.map(csvCell).join(','));
  const stamp = format(new Date(), 'yyyy-MM-dd');
  download(`team-report-${period}-${stamp}.csv`, lines.join('\n'));
}

/** Single rep report → summary + visit lines + order/collection lines. */
export function exportRepReportCsv(detail: RepReportDetail, period: ReportPeriod) {
  const s = detail.summary;
  const out: string[] = [];
  out.push(`Field-Sync Report — ${s.name} — ${periodLabel[period]} — ${format(new Date(), 'dd MMM yyyy')}`);
  out.push('');
  out.push(['Distance (km)', 'Clients Visited', 'Visits', 'Planned', 'Adherence %', 'Orders', 'Order Value', 'Collections', 'Collected Value', 'Hours'].join(','));
  out.push([s.distanceKm, s.clientsVisited, s.visits, s.visitsPlanned, s.adherencePct, s.ordersCount, s.ordersValue, s.collectionsCount, s.collectionsValue, s.hours].join(','));
  out.push('');
  out.push('VISITS');
  out.push(['Customer', 'Check In', 'Check Out', 'Duration (min)', 'Status', 'Purpose'].map(csvCell).join(','));
  detail.visits.forEach(v => out.push([
    v.customerName,
    v.checkInTime ? format(new Date(v.checkInTime), 'dd MMM hh:mm a') : '',
    v.checkOutTime ? format(new Date(v.checkOutTime), 'dd MMM hh:mm a') : '',
    v.durationMin ?? '', v.status ?? '', v.purpose ?? '',
  ].map(csvCell).join(',')));
  out.push('');
  out.push('ORDERS');
  out.push(['Customer', 'Product', 'Amount'].join(','));
  detail.orders.forEach(o => out.push([o.customerName, o.productName ?? '', o.amount].map(csvCell).join(',')));
  out.push('');
  out.push('COLLECTIONS');
  out.push(['Customer', 'Mode', 'Amount'].join(','));
  detail.collections.forEach(c => out.push([c.customerName, c.paymentMode ?? '', c.amount].map(csvCell).join(',')));
  const stamp = format(new Date(), 'yyyy-MM-dd');
  download(`report-${s.name.replace(/\s+/g, '-').toLowerCase()}-${period}-${stamp}.csv`, out.join('\n'));
}
