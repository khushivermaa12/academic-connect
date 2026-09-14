// frontend/src/components/Avatar.jsx
import React from 'react';
import { fullImageUrl } from '../api';

function initials(name) {
  if (!name) return '';
  return name.split(' ').map(p => p[0]).slice(0,2).join('').toUpperCase();
}

export default function Avatar({ src, alt = '', size = 56, className = '', name = '' }) {
  const style = { width: size, height: size };
  if (!src) {
    return (
      <div style={style} className={`flex items-center justify-center rounded-full bg-gray-600 text-white font-bold ${className}`}>
        {initials(name)}
      </div>
    );
  }
  const url = fullImageUrl(src);
  return (
    <img
      src={url}
      alt={alt || name || 'avatar'}
      style={style}
      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/default-avatar.png'; }}
      className={`object-cover rounded-full border-2 border-gray-700 ${className}`}
    />
  );
}
