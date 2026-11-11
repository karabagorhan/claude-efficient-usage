/**
 * Haftalık rapor bildirimi (grup 'report'): her Pazar 19:00. Dokununca /report açılır.
 * Ayarlarda bildirimler kapalıysa scheduleGroup yalnız iptal eder; kapatılınca tüm gruplar zaten iptal edilir.
 */
import { translate } from '../../i18n';
import { scheduleGroup, type NotifItem } from '../../lib/notifications';
import { routes } from '../../lib/routes';

export const REPORT_WEEKDAY = 6; // Pazar (0 = Pazartesi)
export const REPORT_HOUR = 19;

export function buildReportNotifs(): NotifItem[] {
  return [
    {
      title: translate('report.notif.title'),
      body: translate('report.notif.body'),
      url: routes.report(),
      trigger: { kind: 'weekly', weekday: REPORT_WEEKDAY, hour: REPORT_HOUR, minute: 0 },
    },
  ];
}

export const syncReportNotifs = () => scheduleGroup('report', buildReportNotifs());
