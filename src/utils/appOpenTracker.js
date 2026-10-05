// Count one cold launch, then one open for each real background -> active visit.
// Temporary inactive states (permission dialogs, notification shade) do not count.
export const createAppOpenTracker = (initialState, onOpen, { now = Date.now, minBackgroundMs = 1000 } = {}) => {
  let currentState = initialState;
  let hasOpened = false;
  let backgrounded = false;
  let backgroundAt = null;
  let handleOpen = onOpen;
  const open = () => {
    hasOpened = true;
    backgrounded = false;
    backgroundAt = null;
    handleOpen();
  };
  return {
    setOnOpen(callback) { handleOpen = callback; },
    start() {
      if (!hasOpened && currentState !== 'background' && currentState !== 'inactive') open();
    },
    change(nextState) {
      if (nextState === 'background' && currentState !== 'background') {
        backgrounded = true;
        backgroundAt = now();
      }
      if (nextState === 'active') {
        if (!hasOpened || (backgrounded && now() - backgroundAt >= minBackgroundMs)) open();
        // Android can briefly report background during activity/permission
        // handoffs. Returning within one second stays in the same visit.
        backgrounded = false;
        backgroundAt = null;
      }
      currentState = nextState;
    },
  };
};

// React remounts and Fast Refresh must not create another cold-launch event.
// This state belongs to the JS app process, rather than a navigator instance.
export const getAppOpenTracker = (initialState, onOpen) => {
  const key = '__rapidNewsAppOpenTracker';
  if (!globalThis[key]) {
    globalThis[key] = createAppOpenTracker(initialState, onOpen);
  } else {
    globalThis[key].setOnOpen(onOpen);
    globalThis[key].change(initialState);
  }
  return globalThis[key];
};
