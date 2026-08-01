import { RouterProvider } from 'react-router-dom';
import { ReduxProvider, QueryProvider } from '@/hooks';
import { DocumentPreviewProvider } from '@/features/document-preview';
import { SessionBootstrap } from '@/features/auth/SessionBootstrap';
import { ToastProvider } from '@/features/toast';
import { router } from '@/router';

export default function App() {
  return (
    <ReduxProvider>
      <QueryProvider>
        <ToastProvider>
          <SessionBootstrap>
            <DocumentPreviewProvider>
              <RouterProvider router={router} />
            </DocumentPreviewProvider>
          </SessionBootstrap>
        </ToastProvider>
      </QueryProvider>
    </ReduxProvider>
  );
}
