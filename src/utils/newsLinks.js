export const NEWS_LINK_ORIGIN = 'https://www.rapidnewsnetwork.in';
export const APP_INSTALL_URL = 'https://play.google.com/store/apps/details?id=com.rapidnews';

export const getNewsShareUrl = newsId => {
  if (newsId === undefined || newsId === null || String(newsId).trim() === '') {
    return `${NEWS_LINK_ORIGIN}/app`;
  }
  return `${NEWS_LINK_ORIGIN}/app/article/${encodeURIComponent(String(newsId).trim())}`;
};

// Accept old shared links too, but send every article through the same route.
// Match the complete host/path so queries aren't accidentally used as IDs.
export const normalizeNewsLink = url => {
  if (typeof url !== 'string') {
    return null;
  }
  const match = url.match(/^(?:https:\/\/(?:www\.)?rapidnewsnetwork\.in\/app\/article\/|https:\/\/godavariwave\.in\/news\/|rapidnews:\/\/news\/)([^/?#]+)\/?(?:[?#].*)?$/i);
  if (match) {
    try {
      const id = decodeURIComponent(match[1]);
      if (!id.trim() || /[/?#]/.test(id)) {
        return null;
      }
      return getNewsShareUrl(id);
    } catch {
      return null;
    }
  }
  if (/^https:\/\/(?:www\.)?rapidnewsnetwork\.in\/app\/?(?:[?#].*)?$/i.test(url)) {
    return `${NEWS_LINK_ORIGIN}/app`;
  }
  return null;
};
