import { Injectable, signal } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { CRASH_GAME_CONFIG } from '../config/crash-game.config';
import {
  ERoundLifecycleState,
  IActiveRoundState,
  IGameBetStateTransactionData,
  State,
} from '../models/crash-game.models';
@Injectable({
  providedIn: 'root',
})
export class SignalRHubService {
  private hubConnection?: signalR.HubConnection;
  private handlersRegistered = false;
  INITIAL_STATE: State = {
    betTransactionData: null,
    canBet: false,
    canCashOut: false,
    roundStateLabel: this.getRoundStatusLabel(),
    currentRoundId: 0,
    multiplier: 0,
    currentBalance: 0,
    earnedOrLost: 0,
    betResultLable: '',
    error: false,
    connection: 'establishing',
  };
  state = signal<State>(this.INITIAL_STATE);
  constructor() {}

  private getRoundStatusLabel(
    roundAction: ERoundLifecycleState | null = null,
  ): string {
    switch (roundAction) {
      case ERoundLifecycleState.RoundCreated:
        return 'Betting Phase';
      case ERoundLifecycleState.RoundRunning:
        return 'Multiplier Updating';
      case ERoundLifecycleState.RoundFinished:
        return 'Round Finished';
      case ERoundLifecycleState.RoundRecovered:
        return 'Round Recovered';
      default:
        return 'Waiting for Round to start';
    }
  }
  public startConnection = () => {
    const connection = this.ensureHubConnection();

    if (connection.state !== signalR.HubConnectionState.Disconnected) {
      return;
    }

    connection
      .start()
      .then(() => this.state.update((x) => ({ ...x, connection: 'connected' })))
      .catch((err) => {
        console.log('Error establishing SignalR connection: ' + err);
        this.state.update((x) => ({
          ...x,
          error: true,
          actionStatusLabel: 'Unable to reach game server. Retry?',
        }));
      });
  };
  //reducers
  private roundUpdate = (connection: signalR.HubConnection) => {
    connection.on('roundUpdate', (payload: IActiveRoundState) => {
      const currentAction = payload.gameState.currentAction;

      this.state.update((x) => {
        const nextState: State = {
          ...x,
          roundStateLabel: this.getRoundStatusLabel(currentAction),
        };

        if (currentAction === ERoundLifecycleState.RoundCreated) {
          return {
            ...nextState,
            canBet: true,
            currentRoundId: payload.roundId,
            actionStatusLabel: '',
            multiplier: 0,
          };
        }

        if (currentAction === ERoundLifecycleState.RoundRunning) {
          return {
            ...nextState,
            canBet: false,
            canCashOut: Boolean(x.betTransactionData?.betReferenceId),
            multiplier: payload.gameState.multiplier,
          };
        }

        return nextState;
      });
    });
  };
  //bet
  private creditResult = (connection: signalR.HubConnection) => {
    connection.on('creditResult', (payload: IGameBetStateTransactionData) => {
      if (
        payload.gameState.currentAction === ERoundLifecycleState.RoundCreated
      ) {
        this.state.update((x) => ({
          ...x,
          earnedOrLost: 0,
          betResultLable: '',
          betTransactionData: payload,
          currentBalance: payload.balance,
          multiplier: 0,
        }));
      }
    });
  };
  //cashout
  private debitResult = (connection: signalR.HubConnection) => {
    connection.on('debitResult', (payload: IGameBetStateTransactionData) => {
      this.state.update((x) => ({
        ...this.INITIAL_STATE,
        connection: x.connection,
        roundStateLabel: this.getRoundStatusLabel(
          payload.gameState.currentAction,
        ),
        betResultLable:
          payload.gameState.currentAction === ERoundLifecycleState.RoundFinished
            ? 'Lost'
            : 'Earned',
        earnedOrLost:
          payload.gameState.currentAction === ERoundLifecycleState.RoundFinished
            ? CRASH_GAME_CONFIG.defaultBetAmount
            : payload.betState.cashoutMultiplier *
                CRASH_GAME_CONFIG.defaultBetAmount -
              CRASH_GAME_CONFIG.defaultBetAmount,

        actionStatusLabel: x.actionStatusLabel,
        currentBalance: payload.balance,
      }));
    });
  };

  private registerLifecycleHandlers(connection: signalR.HubConnection) {
    if (this.handlersRegistered) {
      return;
    }

    this.roundUpdate(connection);
    this.creditResult(connection);
    this.debitResult(connection);
    connection.onclose((error) => {
      console.log('onclose fired', error);
      this.state.update((x) => ({ ...x, connection: 'disconnected' }));
    });

    connection.onreconnecting((error) => {
      console.log('onreconnecting fired', error);
      this.state.update((x) => ({ ...x, connection: 'connecting' }));
    });

    connection.onreconnected((connectionId) => {
      console.log('onreconnected fired', connectionId);
      this.state.update((x) => ({ ...x, connection: 'connected' }));
    });

    this.handlersRegistered = true;
  }

  private ensureHubConnection(): signalR.HubConnection {
    if (!this.hubConnection) {
      this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl(
          `${CRASH_GAME_CONFIG.signalRUrl}${CRASH_GAME_CONFIG.hubName}`,
          {
            accessTokenFactory: () => CRASH_GAME_CONFIG.sessionToken,
          },
        )
        .withAutomaticReconnect([0, 2000, 5000, 10000])
        .build();

      // this.hubConnection.serverTimeoutInMilliseconds = 5000; // faster offline detection
      // this.hubConnection.keepAliveIntervalInMilliseconds = 2000;
    }

    this.registerLifecycleHandlers(this.hubConnection);

    return this.hubConnection;
  }
}
