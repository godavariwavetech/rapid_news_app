import { notificationClickFromUrl, trackNotificationClick } from '../src/utils/notificationClicks';
import api from '../src/utils/api';
jest.mock('../src/utils/api', () => ({ post: jest.fn() }));
const id='507f1f77bcf86cd799439011',key='a'.repeat(48);
test('Android notification URLs carry report identifiers without changing article IDs', () => {
 expect(notificationClickFromUrl(`rapidnews://news/article?notification_report_id=${id}&notification_click_key=${key}`)).toEqual({notification_report_id:id,notification_click_key:key});
});
test('only tracked notifications post clicks; failures never block article navigation', async () => {
 api.post.mockResolvedValue({});await trackNotificationClick({});expect(api.post).not.toHaveBeenCalled();
 await trackNotificationClick({notification_report_id:id,notification_click_key:key});expect(api.post).toHaveBeenCalledWith('/notification-reports/click',{report_id:id,key});
 api.post.mockRejectedValue(new Error('offline'));await expect(trackNotificationClick({notification_report_id:id,notification_click_key:key})).resolves.toBeUndefined();
});
