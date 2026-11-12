import React from 'react';

const FeatureCard = ({ icon: Icon, title, description, stepNumber, variant = 'white' }) => {
  return (
    <div className={`feature-card feature-card-${variant}`}>
      {stepNumber && <span className="feature-step">0{stepNumber}</span>}
      <div className="feature-icon-wrapper">
        <Icon size={28} className="feature-icon" />
      </div>
      <h3 className="feature-title">{title}</h3>
      <div className="gold-divider" style={{ width: '32px', margin: '10px 0 14px' }} />
      <p className="feature-desc">{description}</p>
    </div>
  );
};

export default FeatureCard;

