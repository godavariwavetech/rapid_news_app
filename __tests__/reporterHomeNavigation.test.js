import {StackActions, StackRouter} from '@react-navigation/native';

test('reporter Home returns to the existing news screen', () => {
  const router = StackRouter({initialRouteName: 'Main'});
  const options = {
    routeNames: ['Main', 'Reporter'],
    routeParamList: {},
    routeGetIdList: {},
  };
  let state = router.getInitialState(options);
  const mainKey = state.routes[0].key;
  state = router.getStateForAction(state, StackActions.push('Reporter'), options);
  state = router.getStateForAction(
    state,
    StackActions.popTo('Main', {screen: 'HomeTab'}),
    options,
  );
  expect(state.index).toBe(0);
  expect(state.routes).toHaveLength(1);
  expect(state.routes[0]).toMatchObject({
    key: mainKey,
    name: 'Main',
    params: {screen: 'HomeTab'},
  });
});
