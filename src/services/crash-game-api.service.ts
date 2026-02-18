import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, tap } from 'rxjs';

import { CRASH_GAME_CONFIG } from '../config/crash-game.config';
import { ResponseData } from '../models/crash-game.models';
import { SignalRHubService } from './signalR-hub.service';

interface PlaceBetRequest {
  gameRoundId: number;
  amount: number;
  isFreeBet: boolean;
  sequence: number;
  betIndex: number;
  autoCashoutMultiplier?: number;
}

interface CashoutRequest {
  betReferenceId: string;
  partialCashout: boolean;
  sequence: number;
}

@Injectable({
  providedIn: 'root',
})
export class CrashGameApiService {
  private readonly http = inject(HttpClient);
  private signalRHubService = inject(SignalRHubService);
  private readonly headers = new HttpHeaders({
    Authorization: `${CRASH_GAME_CONFIG.sessionToken}`,
  });

  placeBet(gameRoundId: number): Observable<ResponseData> {
    const requestBody: PlaceBetRequest = {
      gameRoundId,
      amount: CRASH_GAME_CONFIG.defaultBetAmount,
      isFreeBet: false,
      sequence: 0,
      betIndex: 0,
      autoCashoutMultiplier: undefined,
    };

    return this.http.post<ResponseData>(
      CRASH_GAME_CONFIG.placeBetUrl,
      requestBody,
      {
        headers: this.headers,
      },
    );
  }

  cashoutBet(betReferenceId: string): Observable<ResponseData> {
    const requestBody: CashoutRequest = {
      betReferenceId,
      partialCashout: false,
      sequence: 1,
    };
    this.signalRHubService.state.update((x) => ({
      ...x,
      canCash: false,
    }));
    return this.http.post<ResponseData>(
      CRASH_GAME_CONFIG.cashoutBetUrl,
      requestBody,
      {
        headers: this.headers,
      },
    );
  }
}
