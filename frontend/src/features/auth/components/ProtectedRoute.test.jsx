import { describe, expect, it } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import authReducer from '../auth.slice';
import ProtectedRoute from './ProtectedRoute';

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
