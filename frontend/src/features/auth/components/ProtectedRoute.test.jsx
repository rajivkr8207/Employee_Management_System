import { afterEach, describe, expect, it } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { cleanup, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import authReducer from '../auth.slice';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';

afterEach(cleanup);

const renderProtectedRoute = (auth, initialEntry = '/protected') => {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/login" element={<p>Login page</p>} />
          <Route path="/account-status" element={<p>Account status page</p>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/protected" element={<p>Protected content</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
};

describe('ProtectedRoute', () => {
  it('keeps protected content gated while the session is initializing', () => {
    renderProtectedRoute({
      isAuthenticated: false,
      isInitializing: true,
      user: null,
    });

    expect(screen.getByText('Loading your profile...')).toBeTruthy();
    expect(screen.queryByText('Login page')).toBeNull();
  });

  it('redirects signed-out visitors to login', () => {
    renderProtectedRoute({ isAuthenticated: false, user: null });

    expect(screen.getByText('Login page')).toBeTruthy();
  });

  it('redirects pending non-admin accounts to account status', () => {
    renderProtectedRoute({
      isAuthenticated: true,
      user: { role: 'employee', isApproved: false },
    });

    expect(screen.getByText('Account status page')).toBeTruthy();
  });

  it('allows an authenticated approved account to access protected content', () => {
    renderProtectedRoute({
      isAuthenticated: true,
      user: { role: 'employee', isApproved: true },
    });

    expect(screen.getByText('Protected content')).toBeTruthy();
  });
});

describe('PublicRoute', () => {
  it('renders public content while the session is initializing', () => {
    const store = configureStore({
      reducer: { auth: authReducer },
      preloadedState: {
        auth: { isAuthenticated: false, isInitializing: true, user: null },
      },
    });

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<p>Login page</p>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </Provider>,
    );

    expect(screen.getByText('Login page')).toBeTruthy();
  });
});
