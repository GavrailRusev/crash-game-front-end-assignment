export const CRASH_GAME_CONFIG = {
  signalRUrl: 'https://rlgl-dev.bluecroco.com/hubs/1.0/',
  hubName: 'transactions',
  placeBetUrl:
    'https://rlgl-dev.bluecroco.com/api/1.0/crash-games/request-place-bet',
  cashoutBetUrl:
    'https://rlgl-dev.bluecroco.com/api/1.0/crash-games/request-cashout-bet',

  sessionToken:
    '9c2123c5153242328ca14c83662521ded8b6c8f293184f1dad687da9ccd25bd8',
  defaultBetAmount: 1.0,
} as const;
