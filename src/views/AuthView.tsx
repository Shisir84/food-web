import React from 'react';
import { DaybreakAuthView } from './DaybreakAuthView.tsx';

interface AuthViewProps {
  portal: 'customer' | 'rider' | 'restaurant' | 'admin';
  mode: 'login' | 'register';
  onNavigate: (path: string) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  portal,
  mode,
  onNavigate,
}) => {
  return (
    <DaybreakAuthView
      portal={portal}
      mode={mode}
      onNavigate={onNavigate}
    />
  );
};
