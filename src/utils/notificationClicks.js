import api from './api';
export const notificationClickFromUrl = url => {
 const query = String(url || '').split('?')[1] || '';
 const values = Object.fromEntries(query.split('&').filter(Boolean).map(part => { const [k,v] = part.split('='); return [k,v || '']; }));
 return { notification_report_id: values.notification_report_id, notification_click_key: values.notification_click_key };
};
export const trackNotificationClick = data => {
 if (!/^[a-f\d]{24}$/i.test(data?.notification_report_id || '') || !/^[a-f\d]{48}$/i.test(data?.notification_click_key || '')) return Promise.resolve();
 return api.post('/notification-reports/click', { report_id: data.notification_report_id, key: data.notification_click_key }).catch(() => {});
};
