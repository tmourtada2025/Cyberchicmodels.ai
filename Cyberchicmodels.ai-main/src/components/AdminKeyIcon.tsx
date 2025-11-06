import React, { useState } from 'react';
import { Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function AdminKeyIcon() {
  const [showTooltip, setShowTooltip] = useState(false);
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/admin');
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <Key className="h-4 w-4" />
      </button>
      
      {showTooltip && (
        <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-black text-white text-xs rounded whitespace-nowrap">
          admin
        </div>
      )}
    </div>
  );
}