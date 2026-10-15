import {Linking} from 'react-native';
import {trackNotificationClick, notificationClickFromUrl} from '../utils/notificationClicks';
import {NEWS_LINK_ORIGIN, normalizeNewsLink} from '../utils/newsLinks';

export const newsLinking = {
  prefixes: [NEWS_LINK_ORIGIN],
  config: {
    initialRouteName: 'Main',
    screens: {
      // Shared links go straight to the existing Home feed; NewsDetail is
      // reserved for in-article links and is never part of this transition.
      Main: {
        path: 'app',
        screens: {HomeTab: 'article/:sharedArticleId'},
      },
    },
  },
  async getInitialURL() {
    const url = await Linking.getInitialURL();
    const normalized = normalizeNewsLink(url);
    if (normalized) trackNotificationClick(notificationClickFromUrl(url));
    return normalized;
  },
  subscribe(listener) {
    const subscription = Linking.addEventListener('url', ({url}) => {
      const normalized = normalizeNewsLink(url);
      if (normalized) {
        trackNotificationClick(notificationClickFromUrl(url));
        listener(normalized);
      }
    });
    return () => subscription.remove();
  },
};
