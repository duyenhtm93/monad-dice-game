"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import LeaderboardPopup from "./LeaderboardPopup";
import { useAppConfig } from "./AppConfigProvider";

/** ===== Dice Game: core types & helpers (comments in English) ===== **/

type Die = 1 | 2 | 3 | 4 | 5 | 6;

// Scoring by number of hits per round
const SCORE_TABLE: Record<number, number> = {
  0: 0,
  1: 100,
  2: 300,
  3: 1000,
};

interface GameState {
  // player’s current pick (1..6)
  chosen: Die | null;
  // last roll of three dice
  rolls: Die[];
  // how many dice matched chosen in last roll
  hits: number;
  // total score (accumulates by round)
  score: number;
  // local best score
  bestScore: number;
  // last round’s score (for UI)
  lastRoundScore: number;
  // play count (1-10 per session)
  playCount: number;
}

interface GameProps {
  playerAddress?: string;
  onScoreChange?: (score: number) => void;
}

function rollDice(n: number = 3): Die[] {
  const out: Die[] = [];
  for (let i = 0; i < n; i++) {
    out.push((Math.floor(Math.random() * 6) + 1) as Die);
  }
  return out;
}

function countHits(chosen: Die | null, rolls: Die[]): number {
  if (!chosen) return 0;
  return rolls.reduce((acc, r) => acc + (r === chosen ? 1 : 0), 0);
}

/** ===== Dice Icon Component ===== **/

// Helper component to render dice with SVG icons
function DiceIcon({
  value,
  className = "",
  isChoice = false,
  ...props
}: {
  value: number;
  className?: string;
  isChoice?: boolean;
  [key: string]: unknown;
}) {
  if (value === 0) {
    return (
      <div className={`die empty ${className}`.trim()} {...props}>
        ?
      </div>
    );
  }

  const dieClass = isChoice ? "die-choice" : "die";

  return (
    <div className={`${dieClass} ${className}`.trim()} {...props}>
      <img
        src={`/dice-${value}.svg`}
        alt={`Dice ${value}`}
        className="dice-icon"
      />
    </div>
  );
}

/** ===== Component ===== **/

export default function DiceGame({ playerAddress, onScoreChange }: GameProps) {
  const env = useAppConfig(); // (not used now, but kept for consistency)
  const [mounted, setMounted] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [lastSavedScore, setLastSavedScore] = useState(0); // prevent duplicate save

  const BEST_KEY = "dice-best-score";

  const loadBestScore = () => {
    try {
      return Number(localStorage.getItem(BEST_KEY) || 0);
    } catch {
      return 0;
    }
  };

  const saveBestScore = (score: number) => {
    try {
      localStorage.setItem(BEST_KEY, String(score));
    } catch {}
  };

  const [gameState, setGameState] = useState<GameState>({
    chosen: null,
    rolls: [],
    hits: 0,
    score: 0,
    bestScore: 0, // avoid hydration mismatch
    lastRoundScore: 0,
    playCount: 0,
  });

  const [isRolling, setIsRolling] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // State để đảo mặt số khi rolling
  const [rollingFaces, setRollingFaces] = useState<Die[]>([1, 2, 3]);

  // Cleanup on unmount to avoid dangling timeouts
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setIsRolling(false);
    };
  }, []);

  // Đảo mặt số liên tục khi rolling
  useEffect(() => {
    if (!isRolling) return;
    
    const id = setInterval(() => {
      setRollingFaces([
        (Math.floor(Math.random() * 6) + 1) as Die,
        (Math.floor(Math.random() * 6) + 1) as Die,
        (Math.floor(Math.random() * 6) + 1) as Die,
      ]);
    }, 200); // Tăng từ 100ms lên 200ms
    
    return () => clearInterval(id);
  }, [isRolling]);

  // Initialize game: reset score & last state
  const initializeGame = useCallback(() => {
    const bestNow = loadBestScore();
    setGameState({
      chosen: null,
      rolls: [],
      hits: 0,
      score: 0,
      bestScore: bestNow,
      lastRoundScore: 0,
      playCount: 0,
    });
    setLastSavedScore(0);
    setIsRolling(false); // Reset rolling state
  }, []);

  // Select a number (1..6)
  const chooseNumber = useCallback((n: Die) => {
    setGameState((prev) => ({
      ...prev,
      chosen: n,
    }));
    setIsRolling(false); // Reset rolling when choosing new number
  }, []);

  // Play one round — FIXED to avoid double state update
  const rollOnce = useCallback(() => {
    // Prevent re-entry while rolling
    if (isRolling) return;

    // Guard: must choose, and must have rolls left
    if (gameState.chosen == null || gameState.playCount >= 10) return;

    // Start rolling animation
    setIsRolling(true);

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Simulate dice rolling time (match your 3D animation)
    timeoutRef.current = setTimeout(() => {
      setGameState((current) => {
        // If somehow no choice or out of rolls at this exact moment, no-op
        if (current.chosen == null || current.playCount >= 10) {
          return current;
        }

        const rolls = rollDice(3);
        const hits = countHits(current.chosen, rolls);
        const gained = SCORE_TABLE[hits] ?? 0;
        const newScore = current.score + gained;
        const best = Math.max(current.bestScore, newScore);
        if (best > current.bestScore) saveBestScore(best);

        return {
          ...current,
          rolls,
          hits,
          score: newScore,
          bestScore: best,
          lastRoundScore: gained,
          playCount: current.playCount + 1, // ✅ single increment here only
        };
      });

      // Stop rolling animation
      setIsRolling(false);
      timeoutRef.current = null;
         }, 2500);
  }, [isRolling, gameState.chosen, gameState.playCount]);

  // Optional keyboard: 1..6 to choose, Space to roll
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key >= "1" && e.key <= "6") {
        e.preventDefault();
        chooseNumber(Number(e.key) as Die);
      } else if (e.code === "Space") {
        e.preventDefault();
        rollOnce();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [chooseNumber, rollOnce]);

  // Mount & load best
  useEffect(() => {
    setMounted(true);
    const bestScore = loadBestScore();
    setGameState((prev) => ({ ...prev, bestScore }));
  }, []);

  // Emit score up to parent if needed
  useEffect(() => {
    if (onScoreChange) onScoreChange(gameState.score);
  }, [gameState.score, onScoreChange]);

  const shortAddr =
    playerAddress && playerAddress.startsWith("0x") && playerAddress.length > 10
      ? `${playerAddress.slice(0, 6)}…${playerAddress.slice(-4)}`
      : playerAddress || "Guest";

  if (!mounted) {
    return (
      <div className="game-container">
        <header className="game-header">
          <h1 className="game-title">Welcome to Monad Dice Game</h1>
        </header>

        <div className="score-panel" aria-live="polite">
          <button className="score-button current-score">
            <strong>Score:</strong>
            <span className="score-value">0</span>
          </button>
          <button className="score-button play-count">
            <strong>Lượt:</strong>
            <span className="score-value">{gameState.playCount}/10</span>
          </button>
        </div>

        {/* Skeleton layout */}
        <div className="dice-layout">
          <div className="choose-grid">
            {Array.from({ length: 6 }, (_, i) => (
              <button key={i} className="choose-btn" disabled>
                {i + 1}
              </button>
            ))}
          </div>
          <div className="dice-row">
            <div className="die empty">?</div>
            <div className="die empty">?</div>
            <div className="die empty">?</div>
          </div>
        </div>

        <div className="control-panel">
          <button onClick={initializeGame} className="control-button new-game">
            New Game
          </button>
          <button
            disabled
            className="control-button save-score"
            aria-disabled="true"
          >
            Save Score
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      {/* Header */}
      <header className="game-header">
        <h1 className="game-title">Welcome to Monad Dice Game</h1>
      </header>

      {/* Scores */}
      <div className="score-panel" aria-live="polite">
        <button
          className="score-button current-score"
          aria-label={`Current score ${gameState.score}`}
        >
          <strong>Score:</strong>
          <span className="score-value">{gameState.score}</span>
        </button>

        <button
          onClick={() => setIsLeaderboardOpen(true)}
          className="score-button leaderboard-btn"
          aria-label="Open leaderboard"
        >
          <span className="score-value">Leaderboard</span>
        </button>

        <button
          className="score-button play-count"
          aria-label={`Play count ${gameState.playCount}/10`}
        >
          <strong>Rolls:</strong>
          <span className="score-value">{gameState.playCount}/10</span>
        </button>
      </div>

      {/* Core layout */}
      <div className="dice-layout">
        {/* Last roll display */}
        <div className="dice-row" aria-label="Dice results">
          {isRolling ? (
            <>
              {rollingFaces.map((v, i) => (
                <DiceIcon key={i} value={v} className="rolling" />
              ))}
            </>
          ) : gameState.rolls.length === 0 ? (
            <>
              <DiceIcon value={0} />
              <DiceIcon value={0} />
              <DiceIcon value={0} />
            </>
          ) : (
            gameState.rolls.map((d, i) => (
              <DiceIcon
                key={i}
                value={d}
                className={gameState.chosen === d ? "hit" : ""}
                aria-label={`Die ${i + 1}: ${d}`}
              />
            ))
          )}
        </div>

        {/* Round info */}
        <div className="round-info" aria-live="polite">
          <div>
            Chosen: <strong>{gameState.chosen ?? "-"}</strong>
          </div>
          <div>
            Hits: <strong>{gameState.hits}</strong>
          </div>
          <div>
            Round Score: <strong>{gameState.lastRoundScore}</strong>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="control-panel">
        <div className="control-buttons">
          <button onClick={initializeGame} className="control-button new-game">
            New Game
          </button>

          <button
            onClick={rollOnce}
            className="control-button"
            disabled={
              gameState.chosen == null || gameState.playCount >= 10 || isRolling
            }
            title={
              gameState.chosen == null
                ? "Choose a dice first"
                : gameState.playCount >= 10
                ? "No more rolls left"
                : "Roll (Space)"
            }
          >
            {isRolling ? "Rolling..." : "Roll"}
          </button>

          <button
            onClick={async () => {
              if (!playerAddress) {
                alert("Please login to save your score!");
                return;
              }
              if (gameState.score === 0) {
                alert("Please play and earn some points before saving!");
                return;
              }
              if (gameState.score <= lastSavedScore) {
                alert(
                  "This score has already been saved! Try to get a higher score."
                );
                return;
              }

              try {
                const response = await fetch("/api/save-score", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    playerAddress,
                    scoreAmount: gameState.score,
                  }),
                });

                const result = await response.json();

                if (result.success) {
                  alert(
                    `✅ Score saved successfully!\nScore: ${
                      gameState.score
                    }\nTransaction: ${result.transactionHash.slice(
                      0,
                      6
                    )}...${result.transactionHash.slice(-4)}`
                  );
                  setLastSavedScore(gameState.score);
                } else {
                  throw new Error(result.error || "Failed to save score");
                }
              } catch (error) {
                console.error("❌ Failed to save score:", error);
                alert(
                  `Failed to save score: ${
                    error instanceof Error ? error.message : "Unknown error"
                  }`
                );
              }
            }}
            disabled={
              !playerAddress ||
              gameState.score === 0 ||
              gameState.score <= lastSavedScore
            }
            className="control-button save-score"
          >
            Save Score
          </button>
        </div>
      </div>

      {/* Choose number 1..6 - Separated from control panel */}
      <div
        className="choose-grid"
        role="radiogroup"
        aria-label="Choose your dice"
      >
        {([1, 2, 3, 4, 5, 6] as Die[]).map((n) => (
          <button
            key={n}
            role="radio"
            aria-checked={gameState.chosen === n}
            className={`choose-btn dice-choice-btn ${
              gameState.chosen === n ? "active" : ""
            }`}
            onClick={() => chooseNumber(n)}
            disabled={isRolling}
          >
            <DiceIcon value={n} isChoice={true} />
          </button>
        ))}
      </div>

      {/* Hint text below choose grid */}
      <div className="choose-hint">Choose a die face, then click Roll.</div>

      {/* Leaderboard Popup */}
      <LeaderboardPopup
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        playerAddress={playerAddress}
      />
    </div>
  );
}
