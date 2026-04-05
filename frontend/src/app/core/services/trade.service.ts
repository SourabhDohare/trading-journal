// src/app/core/services/trade.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Trade, CreateTradeRequest, TradeQuery, PageResponse } from '../../shared/models/trade.model';
import { Analytics } from '../../shared/models/analytics.model';

@Injectable({ providedIn: 'root' })
export class TradeService {
  private base = `${environment.apiUrl}/trades`;

  constructor(private http: HttpClient) {}

  createTrade(payload: CreateTradeRequest): Observable<Trade> {
    return this.http.post<Trade>(this.base, payload);
  }

  getTrades(page = 0, size = 20, sortBy = 'tradeDate', sortDir = 'desc'): Observable<PageResponse<Trade>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sortBy', sortBy)
      .set('sortDir', sortDir);
    return this.http.get<PageResponse<Trade>>(this.base, { params });
  }

  getTradeById(id: string): Observable<Trade> {
    return this.http.get<Trade>(`${this.base}/${id}`);
  }

  updateTrade(id: string, payload: Partial<Trade>): Observable<Trade> {
    return this.http.put<Trade>(`${this.base}/${id}`, payload);
  }

  deleteTrade(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  queryTrades(query: TradeQuery): Observable<Trade[]> {
    return this.http.post<Trade[]>(`${this.base}/query`, query);
  }

  getAnalytics(from?: string, to?: string): Observable<Analytics> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<Analytics>(`${this.base}/analytics`, { params });
  }

  getDailyReport(): Observable<Analytics> {
    return this.http.get<Analytics>(`${environment.apiUrl}/reports/daily`);
  }

  getWeeklyReport(): Observable<Analytics> {
    return this.http.get<Analytics>(`${environment.apiUrl}/reports/weekly`);
  }

  getMonthlyReport(): Observable<Analytics> {
    return this.http.get<Analytics>(`${environment.apiUrl}/reports/monthly`);
  }

  getCustomReport(from: string, to: string): Observable<Analytics> {
    return this.http.get<Analytics>(`${environment.apiUrl}/reports/custom`, {
      params: new HttpParams().set('from', from).set('to', to)
    });
  }
}
