export async function GET() {
  const envVars = {
    NEXT_PUBLIC_PRIVY_APP_ID: process.env.NEXT_PUBLIC_PRIVY_APP_ID || '',
    NEXT_PUBLIC_MONAD_APP_ID: process.env.NEXT_PUBLIC_MONAD_APP_ID || '',
    NEXT_PUBLIC_MONAD_PORTAL_URL: process.env.NEXT_PUBLIC_MONAD_PORTAL_URL || '',
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || '',
    NEXT_PUBLIC_GAME_ADDRESS: process.env.NEXT_PUBLIC_GAME_ADDRESS || '',
    NEXT_PUBLIC_DISABLE_BACKEND: process.env.NEXT_PUBLIC_DISABLE_BACKEND || '',
  };
  
  return Response.json(envVars);
}
