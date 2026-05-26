'use client';
import { store } from '../store';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#0A0A0A',
            color: '#f8fafc',
            border: '1px solid #1A1A1A',
            borderRadius: '10px',
          },
        }}
      />
    </Provider>
  );
}
