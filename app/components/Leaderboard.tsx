"use client";

import { useState, useEffect } from "react";
import { useAppConfig } from "./AppConfigProvider";

interface LeaderboardEntry {
  rank: number;
  player: string;
  wallet: string;
  score: number;
}

interface LeaderboardProps {
  playerAddress?: string;
}

export default function Leaderboard({ playerAddress }: LeaderboardProps) {
  // Keep env available if you need it elsewhere
  const _env = useAppConfig();

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const loadLeaderboard = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/leaderboard", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const entries: LeaderboardEntry[] = [];

      if (Array.isArray(data)) {
        data.forEach((entry: Record<string, unknown>) => {
          entries.push({
            rank: Number(entry.rank ?? 1),
            player: String(entry.username ?? "Unknown"),
            wallet: String(entry.walletAddress ?? "Unknown"),
            score: Number(entry.score ?? 0),
          });
        });
      }

      setLeaderboard(entries);
    } catch (_err) {
      setError("Unable to load leaderboard");
      setLeaderboard([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerAddress]);

  const formatAddress = (address: string) => {
    if (!address || address === "Unknown") return "Unknown";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return `#${rank}`;
    }
  };

  const isCurrentPlayer = (address: string) =>
    playerAddress
      ? address.toLowerCase() === playerAddress.toLowerCase()
      : false;

  const getScoreColor = (score: number) => {
    if (score >= 500) return "text-yellow-400"; // Gold
    if (score >= 300) return "text-blue-400"; // Blue
    if (score >= 100) return "text-green-400"; // Green
    return "text-gray-400"; // Gray
  };

  return (
    <div className="leaderboard">
      <div className="leaderboard-header">
        <div className="header-controls">
          <button
            onClick={loadLeaderboard}
            disabled={isLoading}
            className="refresh-btn"
          >
            {isLoading ? "Loading..." : "🔄 Refresh"}
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {isLoading ? (
        <div className="loading-message">Loading leaderboard...</div>
      ) : leaderboard.length > 0 ? (
        <div className="leaderboard-list">
          {/* Header row (sticky nếu dùng CSS đã gửi trước) */}
          <div className="table-header">
            <div>Rank</div>
            <div>Monad ID</div>
            <div>Wallet</div>
            <div>Score</div>
          </div>

          {/* Data rows */}
          {leaderboard.map((entry) => (
            <div
              key={`${entry.wallet}-${entry.rank}`}
              className={`table-row leaderboard-entry ${
                isCurrentPlayer(entry.wallet) ? "current-player" : ""
              }`}
            >
              {/* Col 1: Rank */}
              <div className="cell-rank">{getRankIcon(entry.rank)}</div>

              {/* Col 2: Monad ID (username) */}
              <div className="cell-player">
                <span className="player-name">{entry.player || "Unknown"}</span>
              </div>

              {/* Col 3: Wallet address */}
              <div className="cell-monad-id">
                <a
                  href={`https://testnet.monadexplorer.com/address/${entry.wallet}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="monad-id-display"
                  title={entry.wallet}
                >
                  {formatAddress(entry.wallet)}
                </a>
              </div>

              {/* Col 4: Score (canh phải) */}
              <div className={`cell-score score ${getScoreColor(entry.score)}`}>
                {Number.isFinite(entry.score)
                  ? entry.score.toLocaleString()
                  : "0"}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-message">No leaderboard data available</div>
      )}
    </div>
  );
}
