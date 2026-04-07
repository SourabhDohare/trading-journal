// src/app/shared/models/trade.model.ts

export type InstrumentType = 'STOCK' | 'CRYPTO' | 'FO_FUTURES' | 'FO_OPTIONS' | 'FOREX' | 'COMMODITY' | 'INDEX';
export type TradeType      = 'INTRADAY' | 'SWING' | 'POSITIONAL';
export type Direction      = 'BUY' | 'SELL';
export type OutcomeTag     = 'PROFIT' | 'LOSS' | 'BREAKEVEN' | 'NO_TRADE' | 'OPEN';
export type SetupType      = 'BREAKOUT' | 'REVERSAL' | 'PULLBACK' | 'TREND_FOLLOW' | 'RANGE_TRADE'
                           | 'GAP_PLAY' | 'MOMENTUM' | 'MEAN_REVERSION' | 'VOLUME_BASED' | 'NEWS_BASED' | 'OTHER';
export type MarketContext  = 'TRENDING_UP' | 'TRENDING_DOWN' | 'RANGING' | 'VOLATILE' | 'NEWS_DRIVEN' | 'CONSOLIDATION';
export type EmotionalState = 'CALM' | 'FOMO' | 'REVENGE' | 'HESITATION' | 'OVERCONFIDENT' | 'ANXIOUS' | 'DISCIPLINED';

// All supported time frames
export const TIME_FRAMES = [
  '1min', '3min', '5min', '10min', '15min', '30min',
  '45min', '90min', '1hr', '2hr', '4hr', '6hr', '12hr',
  '1day', '1week'
] as const;
export type TimeFrame = typeof TIME_FRAMES[number];

export interface Trade {
  id: string;
  tradeId: string;
  tradeDate: string;
  exitDate?: string;
  instrument: string;
  instrumentType: InstrumentType;
  tradeType: TradeType;
  direction: Direction;
  entryPrice: number;
  exitPrice?: number;
  stopLoss: number;
  target: number;
  positionSize: number;
  lotSize?: number;
  riskPerTradePercent?: number;
  outcomeTag: OutcomeTag;
  pnlAbsolute?: number;
  pnlPercent?: number;
  plannedRR?: number;
  actualRR?: number;
  setupType: SetupType;
  marketContext: MarketContext;
  timeFrames?: string[];          // multi-select time frames used
  whyTookTrade: string;
  edgeOrSetupLogic: string;
  confirmationUsed: string;
  invalidationReason: string;
  emotionalState: EmotionalState;
  whatWentRight?: string;
  whatWentWrong?: string;
  willRepeat?: string;
  willAvoid?: string;
  disciplineScore?: number;
  tags: string[];
  chartImageUrls?: string[];      // base64 strings, max 5
  notes?: string;
  exchange?: string;
  brokerage?: number;
  taxes?: number;
  slRespected: boolean;
  isReviewed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTradeRequest {
  instrument: string;
  instrumentType: InstrumentType;
  tradeType: TradeType;
  direction: Direction;
  entryPrice: number;
  stopLoss: number;
  target: number;
  exitPrice?: number;
  tradeDate?: string;
  exitDate?: string;
  positionSize: number;
  lotSize?: number;
  riskPerTradePercent?: number;
  setupType: SetupType;
  marketContext: MarketContext;
  timeFrames?: string[];
  whyTookTrade: string;
  edgeOrSetupLogic: string;
  confirmationUsed: string;
  invalidationReason: string;
  emotionalState: EmotionalState;
  outcomeTag?: OutcomeTag;
  pnlAbsolute?: number;
  pnlPercent?: number;
  tags?: string[];
  notes?: string;
  exchange?: string;
  brokerage?: number;
  taxes?: number;
  slRespected?: boolean;
  chartImageUrls?: string[];
}

export interface TradeQuery {
  instrument?: string;
  instrumentType?: InstrumentType;
  outcomeTag?: OutcomeTag;
  emotionalState?: EmotionalState;
  setupType?: SetupType;
  tradeType?: TradeType;
  tags?: string[];
  timeFrames?: string[];
  minRR?: number;
  slRespected?: boolean;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  sortBy?: string;
  sortDir?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
