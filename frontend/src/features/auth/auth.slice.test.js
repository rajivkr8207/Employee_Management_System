import { describe, expect, it } from 'vitest';
import authReducer, { clearAuth, setAccessToken } from './auth.slice';

describe('auth slice', () => {
  it('stores a refreshed access token without clearing the signed-in user', () => {
    const state = {
      user: { id: 'user-1' },
      token: null,
      isAuthenticated: true,
      isInitializing: false,
    };

    expect(authReducer(state, setAccessToken('new-access-token'))).toMatchObject({
      user: { id: 'user-1' },
      token: 'new-access-token',
      isAuthenticated: true,
    });
  });

  it('clears authentication and ends initialization on logout', () => {
    const state = {
      user: { id: 'user-1' },
      token: 'access-token',
      isAuthenticated: true,
      isInitializing: true,
    };

    expect(authReducer(state, clearAuth())).toMatchObject({
      user: null,
      token: null,
      isAuthenticated: false,
      isInitializing: false,
    });
  });
});
