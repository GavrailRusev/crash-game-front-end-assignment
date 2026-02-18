export interface IActiveRoundState {
  roundReferenceId: string;
  roundId: number;
  gameState: IGameState;
}
export interface IGameState {
  currentAction: ERoundLifecycleState;
  startTime: number;
  multiplier: number;
}
export enum ERoundLifecycleState {
  RoundCreated = 200,
  RoundRunning = 210,
  RoundFinished = 220,
  RoundRecovered = 230,
}
export interface IGameBetStateTransactionData extends IGameBetState {
  balance: number;
}
export interface IBetState {
  betIndex: number;
  betAmount: number;
  totalBetAmount: number;
  totalPayoutAmount: number;
  partialCashout: boolean;
  isBetSplit: boolean;
  cashoutMultiplier: number;
  halfCashoutMultiplier: any;
  autoCashoutMultiplier: any;
  betReferenceId: string;
}
export interface IGameBetState {
  success: boolean;
  errorCode: number | null;
  betReferenceId: string;
  roundReferenceId: string;
  gameState: IGameState;
  betState: IBetState;
  sequence?: number;
  gameRoundId?: number;
}
export interface ResponseData {
  betReferenceId?: string;
  data: IActiveRoundState;
  success: boolean;
  error: any;
}
export interface State {
  betTransactionData: IGameBetStateTransactionData | null;
  currentRoundId: number;
  canBet: boolean;
  canCashOut: boolean;
  roundStateLabel: string;
  actionStatusLabel?: string;
  multiplier: number;
  currentBalance: number;
  betResultLable: string;
  earnedOrLost: number;
  error: boolean;
  connection?: 'connected' | 'connecting' | 'disconnected' | 'establishing';
}
