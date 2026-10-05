import {Linking} from 'react-native';
import {NEWS_LINK_ORIGIN, normalizeNewsLink} from '../utils/newsLinks';

export const newsLinking = {
  prefixes: [NEWS_LINK_ORIGIN],
  config: {
    // Keep a Home route behind the article so Back works on a cold launch.
    // Do not mount Splash here: its timer would replace the article with Main.
    initialRouteName: 'Main',
    screens: {
      Main: 'app',
      NewsDetail: 'app/article/:articleId',
    },
  },
  async getInitialURL() {
    return normalizeNewsLink(await Linking.getInitialURL());
  },
  subscribe(listener) {
    const subscription = Linking.addEventListener('url', ({url}) => {
      const normalized = normalizeNewsLink(url);
      if (normalized) {
        listener(normalized);
      }
    });
    return () => subscription.remove();
  },
};
