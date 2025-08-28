"use client";

import { useState, useEffect } from 'react';
import Leaderboard from './Leaderboard';

interface LeaderboardPopupProps {
  isOpen: boolean;
  onClose: () => void;
  playerAddress?: string;
}

export default function LeaderboardPopup({ isOpen, onClose, playerAddress }: LeaderboardPopupProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Handle animation timing
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isVisible) return null;

  return (
    <div className="leaderboard-popup-overlay" onClick={onClose}>
      <div 
        className="leaderboard-popup-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header với nút đóng */}
        <div className="popup-header">
          <h2 className="popup-title">🏆 Leaderboard</h2>
          <button 
            onClick={onClose}
            className="popup-close-btn"
            aria-label="Close leaderboard"
          >
            ✕
          </button>
        </div>

        {/* Leaderboard content */}
        <div className="popup-body">
          <Leaderboard playerAddress={playerAddress} />
        </div>
      </div>
    </div>
  );
}
