import React from 'react';

const PageHeader = ({ title, subtitle, children, right }) => {
  return (
    <div className="page-header">
      <div className="page-header-text">
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      <div className="page-actions">
        {children || right}
      </div>
    </div>
  );
};

export default PageHeader;
