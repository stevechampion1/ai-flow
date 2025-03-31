// src/components/WorkflowEditor/LoadingOverlay.tsx
import React from 'react';
import { BounceLoader } from 'react-spinners';

interface LoadingOverlayProps {
  isLoading: boolean;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <div className="loading-overlay">
      <BounceLoader color="#36d7b7" />
    </div>
  );
};

export default LoadingOverlay;