import React from 'react';

export default function Welcome({ onStart }) {
  return (
    <div className="welcome-container">
      <h1>Property Insights</h1>
      <p>Analyze real estate data with professional-grade accuracy.</p>
      <button 
        onClick={onStart}
        className="start-button"
      >
        Get Started
      </button>
    </div>
  );
}
.start-button {
  padding: 12px 30px;
  font-size: 1.1rem;
  background-color: #ffffff;
  color: #1e3c72;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  transition: transform 0.2s;
}

.start-button:hover {
  transform: scale(1.05);
  background-color: #f0f0f0;
}