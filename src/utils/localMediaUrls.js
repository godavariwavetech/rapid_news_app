const PRIVATE_IPV4_ORIGIN = /^https?:\/\/(?:10(?:\.\d{1,3}){3}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2}|192\.168(?:\.\d{1,3}){2})(?::\d+)?(?=\/media\/f\/)/i;

const getLocalApiOrigin = (apiBaseUrl) => {
  const match = String(apiBaseUrl || '').match(/^(https?:\/\/[^/]+)/i);
  if (!match) return null;

  const hostname = match[1].replace(/^https?:\/\//i, '').split(':')[0];
  const isPrivateIpv4 =
    /^10(?:\.\d{1,3}){3}$/.test(hostname) ||
    /^172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2}$/.test(hostname) ||
    /^192\.168(?:\.\d{1,3}){2}$/.test(hostname);

  const isLoopback = hostname === 'localhost' || /^127(?:\.\d{1,3}){3}$/.test(hostname);
  return isPrivateIpv4 || isLoopback ? match[1] : null;
};

export const normalizeLocalMediaUrls = (value, apiBaseUrl) => {
  const localOrigin = getLocalApiOrigin(apiBaseUrl);
  if (!localOrigin) return value;

  const normalize = (item) => {
    if (typeof item === 'string') {
      return item.replace(PRIVATE_IPV4_ORIGIN, localOrigin);
    }
    if (Array.isArray(item)) {
      return item.map(normalize);
    }
    if (item && typeof item === 'object') {
      return Object.fromEntries(
        Object.entries(item).map(([key, nestedValue]) => [key, normalize(nestedValue)]),
      );
    }
    return item;
  };

  return normalize(value);
};
