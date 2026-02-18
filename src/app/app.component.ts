import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SignalRHubService } from '../services/signalR-hub.service';
import { CrashGameApiService } from '../services/crash-game-api.service';
import { firstValueFrom, map, of, switchMap, take, tap } from 'rxjs';
import { ERoundLifecycleState } from '../models/crash-game.models';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  title = 'crash-game';
  signalRService = inject(SignalRHubService);
  api = inject(CrashGameApiService);
  gameState = computed(() => this.signalRService.state());
  //selectors
  enablePlaceBet = computed(
    () => this.gameState().canBet && !this.isDisconnected(),
  );
  enableCashOut = computed(
    () => this.gameState().canCashOut && !this.isDisconnected(),
  );
  roundStateLabel = computed(() =>
    this.isDisconnected() ? '' : this.gameState().roundStateLabel,
  );
  balance = computed(() => this.gameState().currentBalance.toFixed(2));
  buttonText = computed(() =>
    this.enablePlaceBet() ? 'Bet' : this.enableCashOut() ? 'Cash Out' : 'Wait',
  );
  actionStatusLabel = computed(() => this.gameState().actionStatusLabel);
  multiplier = computed(() => this.gameState().multiplier);
  earnedOrLost = computed(() => this.gameState().earnedOrLost.toFixed(2));
  betResultLable = computed(() => this.gameState().betResultLable);
  connection = computed(() => this.gameState().connection);
  isDisconnected = computed(() => this.connection() !== 'connected');
  ngOnInit() {
    this.signalRService.startConnection();
  }
  connect() {
    this.signalRService.startConnection();
  }
  async action() {
    const snapshot = this.gameState();

    if (snapshot.canBet) {
      const result = await firstValueFrom(
        this.api.placeBet(snapshot.currentRoundId),
      );

      this.signalRService.state.update((x) =>
        result.success
          ? {
              ...x,
              error: false,
              canBet: false,
              actionStatusLabel: 'Bet successfully!',
            }
          : { ...x, error: true, actionStatusLabel: result.error.message },
      );
    }

    if (snapshot.canCashOut) {
      const betRef = snapshot.betTransactionData?.betReferenceId ?? '';
      const result = await firstValueFrom(this.api.cashoutBet(betRef));
      this.signalRService.state.update((x) =>
        result.success
          ? {
              ...x,
              error: false,
              canCashOut: false,
              actionStatusLabel: 'Cached out successfully!',
            }
          : { ...x, error: true, actionStatusLabel: result.error.message },
      );
    }
  }
}
