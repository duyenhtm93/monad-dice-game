"use client";
import { useState, useCallback, Suspense } from "react";
import dynamic from "next/dynamic";

// Game is the main part: load immediately
import DiceGame from "./components/dice";
// Auth is small, load immediately
import WalletConnect from "./components/WalletConnect";

// Secondary parts — dynamic to reduce bundle
const Leaderboard = dynamic(() => import("./components/Leaderboard"), {
  ssr: false,
  loading: () => <div style={{ opacity: 0.6 }}>Loading leaderboard…</div>,
});

export default function Home() {
  const [playerAddress, setPlayerAddress] = useState<string | null>(null);
  const [gameScore, setGameScore] = useState<number>(0);

  // Stable callbacks for child components
  const handleAddressChange = useCallback((addr: string | null) => {
    setPlayerAddress(addr ?? null);
  }, []);

  const handleScoreChange = useCallback((score: number) => {
    setGameScore(score);
  }, []);

  return (
    <div className="app-container">
      {/* Header with Logo and Auth */}
      <section className="auth-section">
        <div className="logo-section">
          <img src="/dice-logo.svg" alt="Monad Games" className="logo" />
          <span className="logo-text">Monad Dice Game</span>
        </div>
        <WalletConnect onAddressChange={handleAddressChange} />
      </section>

      {/* Game */}
      <section className="game-section">
        <DiceGame
          playerAddress={playerAddress ?? undefined}
          onScoreChange={handleScoreChange}
        />
      </section>

      {/* Footer */}
      <section className="footer-section">
        <p className="footer-text">© 2025 Created by duyenhtm</p>
        <div className="social-icons">
          <a
            href="https://github.com/duyenhtm93"
            target="_blank"
            rel="noreferrer"
            className="social-button"
          >
            <img src="/github.svg" alt="" />
          </a>
          <a
            href="https://x.com/duyenhtm"
            target="_blank"
            rel="noreferrer"
            className="social-button"
          >
            <img src="/x.svg" alt="" />
          </a>
          <a
            href="https://discord.com/users/duyenhtm"
            target="_blank"
            rel="noreferrer"
            className="social-button"
          >
            <img src="/discord.svg" alt="" />
          </a>
        
        </div>
      </section>
    </div>
  );
}
