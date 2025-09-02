export async function GET() {
  try {
              const response = await fetch('https://monad-games-id-site.vercel.app/api/leaderboard?page=1&limit=10&gameId=224&sortBy=scores&sortOrder=desc', {
      method: 'GET',
      headers: {
        'User-Agent': 'Monad-2048-Game/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const jsonData = await response.json();

    if (jsonData && jsonData.data && Array.isArray(jsonData.data)) {
      return Response.json(jsonData.data);
    } else {
      throw new Error('Invalid response format from API');
    }
  } catch (error) {
    return Response.json(
      { error: `Failed to fetch leaderboard: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
