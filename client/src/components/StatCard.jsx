import React from 'react';

const StatCard = ({ icon: Icon, title, value, subtitle, badgeText, badgeColor = 'gold' }) => {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <div className="stat-icon-box">
          <Icon size={24} />
        </div>
        {badgeText && (
          <span className={`badge badge-${badgeColor}`}>{badgeText}</span>
        )}
      </div>
      <div className="stat-card-body">
        <h3 className="stat-value">{value}</h3>
        <p className="stat-title">{title}</p>
        {subtitle && <p className="stat-subtitle">{subtitle}</p>}
      </div>
    </div>
  );
};

export default StatCard;

