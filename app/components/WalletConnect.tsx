"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  usePrivy,
  type CrossAppAccountWithMetadata,
} from "@privy-io/react-auth";
import { useMonadGamesUser } from "../hooks/useMonadGamesUser";
import { useAppConfig } from "./AppConfigProvider";

function AuthNotConfigured() {
  return (
    <div className="status-message warning">Authentication not configured</div>
  );
}

type Props = { 
  onAddressChange: (address: string) => void;
  onMonadUserChange: (user: { username: string } | null) => void;
};

// Shorten address for UI
const shortAddr = (addr?: string) =>
  addr && addr.startsWith("0x") && addr.length > 10
    ? `${addr.slice(0, 6)}...${addr.slice(-4)}`
    : addr || "";

/** Minimal modal prompting to create Monad ID (EN only) */
function PromptModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: () => void;
}) {
  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-card" role="dialog" aria-modal="true">
        {/* Close icon (top-right) */}
        <button
          className="modal-close"
          aria-label="Close"
          title="Close"
          onClick={onClose}
        >
          ×
        </button>

        <h3 className="modal-title">Create your Monad ID</h3>
        <p className="modal-text">
          You’re logged in but don’t have a Monad ID yet.
          <br />
          Please create your Monad ID to continue.
        </p>

        <div className="modal-actions">
          <button
            className="btn-primary"
            onClick={onCreate}
            aria-label="Create Monad ID"
          >
            Create Monad ID
          </button>
        </div>
      </div>
    </div>
  );
}

function PrivyAuth({ onAddressChange, onMonadUserChange }: Props) {
  const { authenticated, user, ready, logout, login } = usePrivy();
  const env = useAppConfig();

  const crossAppAccount = useMemo<
    CrossAppAccountWithMetadata | undefined
  >(() => {
    if (!user) return undefined;
    return user.linkedAccounts
      .filter((a): a is CrossAppAccountWithMetadata => a.type === "cross_app")
      .find((a) => a.providerApp?.id === env.NEXT_PUBLIC_MONAD_APP_ID);
  }, [user, env.NEXT_PUBLIC_MONAD_APP_ID]);

  const accountAddress = useMemo(() => {
    // Prefer embedded wallet from cross-app account (Monad Games ID)
    const addr = crossAppAccount?.embeddedWallets?.[0]?.address;
    if (!addr && user?.wallet?.address) {
      // Fallback to user’s wallet if any
      return user.wallet.address;
    }
    return typeof addr === "string" ? addr : "";
  }, [crossAppAccount, user]);

  const [prevAddr, setPrevAddr] = useState<string>("");

  useEffect(() => {
    if (accountAddress !== prevAddr) {
      setPrevAddr(accountAddress);
      onAddressChange(accountAddress);
    }
  }, [accountAddress, prevAddr, onAddressChange]);

  const {
    user: monadUser,
    hasUsername,
    isLoading: isLoadingUser,
  } = useMonadGamesUser(accountAddress);

  const [showCopyAlert, setShowCopyAlert] = useState(false);

  const handleCopy = useCallback(() => {
    if (!accountAddress) return;
    navigator.clipboard
      .writeText(accountAddress)
      .then(() => {
        setShowCopyAlert(true);
        setTimeout(() => setShowCopyAlert(false), 2000);
      })
      .catch(() => {});
  }, [accountAddress]);

  const handleCreateMonadIdDirect = useCallback(() => {
    // Open portal to create Monad ID
    window.open(env.NEXT_PUBLIC_MONAD_PORTAL_URL, "_blank");
  }, [env.NEXT_PUBLIC_MONAD_PORTAL_URL]);

  // Popup: show when authenticated, user loaded, but no username
  const needsMonadId =
    authenticated && !isLoadingUser && hasUsername === false && !monadUser?.username;
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (needsMonadId) {
      setShowPrompt(true);
    } else {
      setShowPrompt(false);
    }
  }, [needsMonadId]);

  // Additional safety: hide popup if user has username
  useEffect(() => {
    if (hasUsername && monadUser?.username) {
      setShowPrompt(false);
    }
  }, [hasUsername, monadUser?.username]);

  // Notify parent component when monadUser changes
  useEffect(() => {
    onMonadUserChange(monadUser);
  }, [monadUser, onMonadUserChange]);

  if (!ready) return <div className="status-message info">Loading…</div>;

  // Not connected
  if (!authenticated) {
    return (
      <div className="auth-actions-row">
        <button
          onClick={login}
          className="user-btn"
          aria-label="Connect account"
        >
          Login
        </button>
      </div>
    );
  }

  // Connected
  return (
    <>
      <div className="auth-actions-row">
        {/* Embedded Wallet button - click to copy */}
        <div className="wallet-btn">
          <button onClick={handleCopy} title={accountAddress}>
            {shortAddr(accountAddress)}
          </button>
          {showCopyAlert && <div className="copy-alert">Wallet copied!</div>}
        </div>

        <div className="user-btn">
          {isLoadingUser ? (
            <span className="monad-id-display">Welcome: …</span>
          ) : hasUsername && monadUser?.username ? (
            <span className="monad-id-display-static">
              @{monadUser.username}
            </span>
          ) : (
            <span
              onClick={handleCreateMonadIdDirect}
              className="monad-id-display"
              title="Click to create Monad ID"
              style={{ cursor: "pointer" }}
            >
              Create Monad ID
            </span>
          )}
          <button
            onClick={logout}
            aria-label="Sign out"
            title="Sign out"
            className="logout-btn"
          >
            <img src="/logout.svg" alt="Logout" className="logout-icon" />
          </button>
        </div>
      </div>

      {/* Centered prompt modal */}
      <PromptModal
        open={showPrompt}
        onClose={() => setShowPrompt(false)}
        onCreate={handleCreateMonadIdDirect}
      />
    </>
  );
}

export default function WalletConnect({ onAddressChange, onMonadUserChange }: Props) {
  const env = useAppConfig();
  if (!env.NEXT_PUBLIC_PRIVY_APP_ID) return <AuthNotConfigured />;
  return <PrivyAuth onAddressChange={onAddressChange} onMonadUserChange={onMonadUserChange} />;
}
