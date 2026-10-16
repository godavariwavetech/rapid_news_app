import { createAppOpenTracker, getAppOpenTracker } from '../src/utils/appOpenTracker';

afterEach(() => { delete globalThis.__rapidNewsAppOpenTracker; });

test('cold launch and repeated active events count once', () => {
  const opened = jest.fn();
  const tracker = createAppOpenTracker('active', opened);
  tracker.start();
  tracker.start();
  tracker.change('active');
  expect(opened).toHaveBeenCalledTimes(1);
});

test('inactive dialogs do not count as reopening the app', () => {
  const opened = jest.fn();
  const tracker = createAppOpenTracker('active', opened);
  tracker.start();
  for (let i = 0; i < 5; i++) {
    tracker.change('inactive');
    tracker.change('active');
  }
  expect(opened).toHaveBeenCalledTimes(1);
});

test('each actual background and foreground visit counts once', () => {
  const opened = jest.fn();
  let time = 0;
  const tracker = createAppOpenTracker('active', opened, { now: () => time });
  tracker.start();
  for (let i = 0; i < 4; i++) {
    tracker.change('inactive');
    tracker.change('background');
    tracker.change('background');
    time += 1000;
    tracker.change('inactive');
    tracker.change('active');
    tracker.change('active');
  }
  expect(opened).toHaveBeenCalledTimes(5);
});

test('short Android startup background handoff remains one open', () => {
  let time = 0;
  const opened = jest.fn();
  const tracker = createAppOpenTracker('active', opened, { now: () => time });
  tracker.start();
  time = 1500;
  tracker.change('background');
  time += 203;
  tracker.change('active');
  tracker.start();
  expect(opened).toHaveBeenCalledTimes(1);
  time += 3000;
  tracker.change('background');
  time += 1000;
  tracker.change('active');
  expect(opened).toHaveBeenCalledTimes(2);
});

test('navigator remount keeps the existing visit and updates callback', () => {
  const first = jest.fn();
  const firstTracker = getAppOpenTracker('active', first);
  firstTracker.start();
  const remounted = jest.fn();
  const nextTracker = getAppOpenTracker('active', remounted);
  nextTracker.start();
  expect(nextTracker).toBe(firstTracker);
  expect(first).toHaveBeenCalledTimes(1);
  expect(remounted).not.toHaveBeenCalled();
});

test('foreground before deferred startup does not double count', () => {
  const opened = jest.fn();
  const tracker = createAppOpenTracker('inactive', opened);
  tracker.change('active');
  tracker.start();
  expect(opened).toHaveBeenCalledTimes(1);
});

test('background startup is counted only once the app becomes visible', () => {
  const opened = jest.fn();
  const tracker = createAppOpenTracker('background', opened);
  tracker.start();
  expect(opened).not.toHaveBeenCalled();
  tracker.change('inactive');
  tracker.change('active');
  tracker.start();
  expect(opened).toHaveBeenCalledTimes(1);
});
