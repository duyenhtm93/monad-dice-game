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
  const [monadUser, setMonadUser] = useState<{ username: string } | null>(null);

  // Stable callbacks for child components
  const handleAddressChange = useCallback((addr: string | null) => {
    setPlayerAddress(addr ?? null);
  }, []);

  const handleScoreChange = useCallback((score: number) => {
    setGameScore(score);
  }, []);

  const handleMonadUserChange = useCallback((user: { username: string } | null) => {
    setMonadUser(user);
  }, []);

  return (
    <div className="app-container">
      {/* Header with Logo and Auth */}
      <section className="auth-section">
        <div className="logo-section">
          <img src="/dice-logo.svg" alt="Monad Games" className="logo" />
          <span className="logo-text">Monad Dice Game</span>
        </div>
        <WalletConnect 
          onAddressChange={handleAddressChange} 
          onMonadUserChange={handleMonadUserChange}
        />
      </section>

      {/* Game */}
      <section className="game-section">
        <DiceGame
          playerAddress={playerAddress ?? undefined}
          onScoreChange={handleScoreChange}
          monadUser={monadUser}
        />
      </section>

      {/* Footer */}
      <section className="footer-section">
        <p className="footer-text">© Created by duyenhtm</p>
      </section>
    </div>
  );
}
