import { createBrowserRouter, Navigate } from 'react-router-dom';
import { PublicLayout } from '@/components/layout';
import {
  DashboardPage,
  LoginPage,
  MSPublishingPage,
  ReadSitePage,
  ForgotPasswordPage,
  ResetPasswordPage,
  DrawingRegisterLoginPage,
  DrawingRegisterPage,
  CreateUserPage,
} from '@/pages';
import { useAppSelector } from '@/hooks';
import { FEATURES } from '@/config/features';

function LoginRedirect() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  if (isAuthenticated) {
    return <Navigate to="/ms-publishing" replace />;
  }
  return <LoginPage />;
}

function DrawingRegisterLoginRedirect() {
  // Deliberately the separate drawingRegisterAuth slice — an active MS
  // Publishing session must not skip the Drawing Register's own login.
  const isAuthenticated = useAppSelector((state) => state.drawingRegisterAuth.isAuthenticated);
  if (isAuthenticated) {
    return <Navigate to="/drawing-register" replace />;
  }
  return <DrawingRegisterLoginPage />;
}

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      {
        path: '/',
        element: <DashboardPage />,
      },
      {
        path: '/login',
        element: <LoginRedirect />,
      },
      {
        path: '/forgot-password',
        element: <ForgotPasswordPage />,
      },
      {
        path: '/reset-password/:token',
        element: <ResetPasswordPage />,
      },
      {
        path: '/read-site',
        element: <ReadSitePage />,
      },
      {
        path: '/read-site/:department',
        element: <ReadSitePage />,
      },
      // Gated by FEATURES.drawingRegister (see src/config/features.ts) —
      // flip to false to hide the module without deleting it.
      ...(FEATURES.drawingRegister
        ? [
            {
              path: '/drawing-register/login',
              element: <DrawingRegisterLoginRedirect />,
            },
          ]
        : []),
    ],
  },
  {
    path: '/ms-publishing',
    element: <MSPublishingPage />,
  },
  {
    path: '/users/new',
    element: <CreateUserPage />,
  },
  ...(FEATURES.drawingRegister
    ? [
        {
          path: '/drawing-register',
          element: <DrawingRegisterPage />,
        },
      ]
    : []),
]);
