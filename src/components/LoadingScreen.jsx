import React from 'react';
import { motion } from 'framer-motion';

export const LoadingScreen = ({ message = "Loading..." }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="loading-container"
    >
      <div className="spinner"></div>
      <p className="loading-text">{message}</p>
    </motion.div>
  );
};

export const SkeletonLoader = ({ count = 3 }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {[...Array(count)].map((_, i) => (
        <div key={i} className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="skeleton" style={{ width: '48px', height: '48px', borderRadius: '14px' }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ width: '120px', height: '1.2rem', marginBottom: '8px' }} />
              <div className="skeleton" style={{ width: '180px', height: '0.8rem' }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
