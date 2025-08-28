// Game configuration for 2048 Game
export const GAME_CONFIG = {
  // Your registered game address
  GAME_ADDRESS: process.env.NEXT_PUBLIC_GAME_ADDRESS,
  
  // Game settings
  SCORE_SUBMISSION: {
    // Submit score every X points
    SCORE_THRESHOLD: 10,
    
    // Track transactions (actions that cost points/tokens)
    TRANSACTION_THRESHOLD: 1,
  },
  
  // Game metadata for smart contract registration
  METADATA: {
    name: '2048 Game',
    url: 'https://monad-game-2048.vercel.app',
    image: 'https://picsum.photos/200'
  }
} as const;