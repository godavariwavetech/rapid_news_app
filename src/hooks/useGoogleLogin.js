import { useState } from 'react';
import { Alert } from 'react-native';
import { useDispatch } from 'react-redux';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { userLogin } from '../redux/reducers/auth';

export const useGoogleLogin = () => {
  const dispatch = useDispatch();
  const [signingIn, setSigningIn] = useState(false);

  const handleGoogleLogin = async () => {
    if (signingIn) return;
    setSigningIn(true);
    try {
      await GoogleSignin.signOut();
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      if (response.type === 'cancelled') return;

      const idToken = response.data?.idToken;
      if (!idToken) throw new Error('Google returned no idToken');

      // .unwrap() so a rejected backend call throws here instead of failing silently
      await dispatch(userLogin({ idToken })).unwrap();
    } catch (error) {
      if (error?.code === statusCodes.SIGN_IN_CANCELLED) return;

      const detail =
        error?.code === statusCodes.DEVELOPER_ERROR
          ? "DEVELOPER_ERROR (10) — this build's signing certificate isn't registered in the Google Cloud project."
          : error?.code
            ? `Google sign-in failed (code ${error.code})`
            : error?.message || JSON.stringify(error);

      console.log('[GoogleLogin]', detail, error);
      Alert.alert('Sign-in failed', detail);
    } finally {
      setSigningIn(false);
    }
  };

  return { signingIn, handleGoogleLogin };
};
