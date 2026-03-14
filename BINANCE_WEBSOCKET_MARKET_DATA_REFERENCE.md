# Binance 공개 WebSocket 시장데이터 참고문서

## 문서 목적
- 이 문서는 `API Key 없이` 사용할 수 있는 Binance Spot 공개 WebSocket 시장데이터만 정리한 참고문서입니다.
- 현재 프로젝트는 `모의투자`이므로 `실제 주문`, `실제 계정`, `개인 잔고`, `유저 데이터 스트림`은 제외합니다.
- 중요도는 `우리 프로젝트 기준`입니다.
- 별점 기준:
  - `★★★★★` 매우 자주 사용
  - `★★★★☆` 자주 사용
  - `★★★☆☆` 상황에 따라 사용
  - `★★☆☆☆` 특수한 경우만 사용
  - `★☆☆☆☆` 거의 사용하지 않음

## 먼저 알아둘 핵심 결론
- `현재가`는 보통 `<symbol>@ticker` 또는 `<symbol>@miniTicker`
- `차트`는 보통 `<symbol>@kline_<interval>`
- `호가 최상단`은 `<symbol>@bookTicker`
- `거래량 상위 5종목`은 `!miniTicker@arr` 또는 `!ticker_1d@arr`를 받아서 `서버에서 정렬`
- `시가총액 상위 5종목`은 `Binance Spot WebSocket만으로 직접 불가능`

## 공용 연결 정보
- 기본 WebSocket 주소:
  - `wss://stream.binance.com:9443`
  - `wss://stream.binance.com:443`
- 시장데이터 전용 주소:
  - `wss://data-stream.binance.vision`
- combined stream 예시:
  - `wss://stream.binance.com:9443/stream?streams=btcusdt@ticker/ethusdt@ticker/xrpusdt@ticker`
- raw stream 예시:
  - `wss://stream.binance.com:9443/ws/btcusdt@ticker`

## 연결 제한
- 연결 1개는 최대 `24시간`
- 연결 1개당 최대 `1024 streams`
- 초당 들어오는 메시지 제한 `5 incoming messages/sec`
- `5분당 300 connection attempts / IP`

## 프로젝트에서 추천하는 우선 사용 순서
1. `<symbol>@ticker`
2. `<symbol>@kline_<interval>`
3. `<symbol>@bookTicker`
4. `!miniTicker@arr`
5. `<symbol>@trade`
6. `<symbol>@aggTrade`
7. `<symbol>@depth@100ms`

---

## 1. ★★★★★ Individual Symbol Ticker
- 스트림 형식: `<symbol>@ticker`
- 예시:
  - `btcusdt@ticker`
  - `ethusdt@ticker`
- 업데이트 속도: `1000ms`
- 핵심 용도:
  - 종목 현재가
  - 24시간 변동률
  - 24시간 거래량
  - 최우선 bid/ask 참고
- 왜 중요한가:
  - 메인 시세 카드
  - 종목 리스트
  - 현재가 표시
  - 등락률 표시
- 핵심 필드:
  - `c`: 마지막 가격
  - `P`: 가격 변화율
  - `v`: base asset volume
  - `q`: quote asset volume
  - `b`: best bid
  - `a`: best ask
- 추천 사용 위치:
  - 메인 시세 리스트
  - 종목 상세 헤더
  - 포트폴리오 평가용 현재가

## 2. ★★★★★ Kline / Candlestick
- 스트림 형식: `<symbol>@kline_<interval>`
- 예시:
  - `btcusdt@kline_1m`
  - `ethusdt@kline_5m`
  - `xrpusdt@kline_1h`
- 업데이트 속도:
  - `1s` 봉은 `1000ms`
  - 나머지는 `2000ms`
- 핵심 용도:
  - 차트 봉 데이터
  - 시가/고가/저가/종가
  - 거래량
- 왜 중요한가:
  - 차트 화면의 핵심
  - TradingView나 Lightweight Charts 붙일 때 필수
- 지원 interval:
  - `1s`
  - `1m`
  - `3m`
  - `5m`
  - `15m`
  - `30m`
  - `1h`
  - `2h`
  - `4h`
  - `6h`
  - `8h`
  - `12h`
  - `1d`
  - `3d`
  - `1w`
  - `1M`
- 핵심 필드:
  - `k.o`: 시가
  - `k.c`: 종가
  - `k.h`: 고가
  - `k.l`: 저가
  - `k.v`: 거래량
  - `k.x`: 봉 종료 여부
- 추천 사용 위치:
  - 종목 상세 차트
  - 시간봉/분봉 차트

## 3. ★★★★★ Individual Symbol Book Ticker
- 스트림 형식: `<symbol>@bookTicker`
- 예시:
  - `btcusdt@bookTicker`
- 업데이트 속도: `Real-time`
- 핵심 용도:
  - 최우선 매수 호가
  - 최우선 매도 호가
- 왜 중요한가:
  - 시장가/지정가 체결 기준을 잡을 때 중요
  - 단순 현재가보다 실전 거래 느낌이 강함
- 핵심 필드:
  - `b`: best bid price
  - `B`: best bid qty
  - `a`: best ask price
  - `A`: best ask qty
- 추천 사용 위치:
  - 주문창
  - 호가창 상단
  - 시장가 체결 기준 후보

## 4. ★★★★★ All Market Mini Tickers
- 스트림 형식: `!miniTicker@arr`
- 업데이트 속도: `1000ms`
- 핵심 용도:
  - 전체 시장 종목 중 변경된 종목들의 24시간 요약 통계
- 왜 중요한가:
  - 거래량 상위 종목
  - 급등/급락 종목
  - 메인 마켓 요약
- 핵심 필드:
  - `c`: 현재가
  - `o`: 시가
  - `h`: 고가
  - `l`: 저가
  - `v`: base volume
  - `q`: quote volume
- 추천 사용 위치:
  - 거래량 상위 5종목
  - 메인 페이지 마켓 랭킹
  - 급등/급락 리스트
- 주의:
  - 모든 종목 전체를 매번 주는 것이 아니라 `변경된 종목만` 배열에 들어옴

## 5. ★★★★☆ Trade
- 스트림 형식: `<symbol>@trade`
- 예시:
  - `btcusdt@trade`
- 업데이트 속도: `Real-time`
- 핵심 용도:
  - 개별 체결 이벤트
  - 초단위 체결 흐름
- 왜 중요한가:
  - 최근 체결 리스트
  - 초단타 거래 느낌 UI
- 핵심 필드:
  - `p`: 가격
  - `q`: 수량
  - `T`: 체결 시간
  - `t`: trade id
- 추천 사용 위치:
  - 최근 체결 내역
  - 체결강도 느낌 UI

## 6. ★★★★☆ Aggregate Trade
- 스트림 형식: `<symbol>@aggTrade`
- 예시:
  - `btcusdt@aggTrade`
- 업데이트 속도: `Real-time`
- 핵심 용도:
  - taker order 단위로 묶인 체결 정보
- 왜 중요한가:
  - `trade`보다 데이터량이 약간 정리된 편
  - 최근 체결 흐름 표현에 적합
- 핵심 필드:
  - `p`: 가격
  - `q`: 수량
  - `T`: 체결 시간
  - `a`: aggregate trade id
- 추천 사용 위치:
  - 최근 체결 로그
  - 체결 스트림 간소화 버전

## 7. ★★★★☆ Diff Depth
- 스트림 형식:
  - `<symbol>@depth`
  - `<symbol>@depth@100ms`
- 예시:
  - `btcusdt@depth@100ms`
- 업데이트 속도:
  - `1000ms` 또는 `100ms`
- 핵심 용도:
  - 실시간 오더북 변화
  - 로컬 호가창 관리
- 왜 중요한가:
  - 고급 호가창이 필요하면 중요
  - 지정가 체결 판단을 더 정밀하게 하고 싶을 때 유용
- 핵심 필드:
  - `b`: 변경된 bid 목록
  - `a`: 변경된 ask 목록
  - `U`, `u`: 업데이트 범위
- 추천 사용 위치:
  - 고급 호가창
  - 실전 거래소 스타일 UI
- 주의:
  - 제대로 쓰려면 REST snapshot과 함께 로컬 오더북 동기화 절차가 필요

## 8. ★★★☆☆ Individual Symbol Mini Ticker
- 스트림 형식: `<symbol>@miniTicker`
- 예시:
  - `btcusdt@miniTicker`
- 업데이트 속도: `1000ms`
- 핵심 용도:
  - 종목 1개의 가벼운 24시간 요약 정보
- 왜 중요한가:
  - `@ticker`보다 단순해서 가볍게 쓸 수 있음
- 핵심 필드:
  - `c`: 현재가
  - `o`: 시가
  - `h`: 고가
  - `l`: 저가
  - `v`: base volume
  - `q`: quote volume
- 추천 사용 위치:
  - 간단한 시세 카드
  - 성능 우선의 리스트 화면

## 9. ★★★☆☆ Individual Symbol Rolling Window Statistics
- 스트림 형식: `<symbol>@ticker_<window>`
- 지원 window:
  - `1h`
  - `4h`
  - `1d`
- 예시:
  - `btcusdt@ticker_1h`
  - `ethusdt@ticker_1d`
- 업데이트 속도: `1000ms`
- 핵심 용도:
  - 특정 시간창 기준 변동률과 거래량
- 왜 중요한가:
  - 시간대별 랭킹
  - 단기 강세 종목 정렬
- 추천 사용 위치:
  - 1시간 급등 종목
  - 4시간 거래량 랭킹

## 10. ★★★☆☆ All Market Rolling Window Statistics
- 스트림 형식: `!ticker_<window>@arr`
- 지원 window:
  - `1h`
  - `4h`
  - `1d`
- 업데이트 속도: `1000ms`
- 핵심 용도:
  - 전체 종목 중 바뀐 종목의 롤링 통계
- 왜 중요한가:
  - 시간별 랭킹 페이지
  - 1시간/4시간 급등락 TOP N
- 추천 사용 위치:
  - 랭킹 화면
  - 마켓 스캐너
- 주의:
  - 이것도 `변경된 종목만` 배열에 들어옴

## 11. ★★★☆☆ Average Price
- 스트림 형식: `<symbol>@avgPrice`
- 예시:
  - `btcusdt@avgPrice`
- 업데이트 속도: `1000ms`
- 핵심 용도:
  - 고정 구간 평균가
- 왜 중요한가:
  - 보조 지표로는 쓸 수 있지만 핵심은 아님
- 핵심 필드:
  - `w`: 평균가
  - `i`: 평균 interval
- 추천 사용 위치:
  - 보조 정보
  - 비교용 통계값

## 12. ★★☆☆☆ Partial Book Depth
- 스트림 형식:
  - `<symbol>@depth5`
  - `<symbol>@depth10`
  - `<symbol>@depth20`
  - 또는 `@100ms`
- 예시:
  - `btcusdt@depth10`
  - `btcusdt@depth20@100ms`
- 업데이트 속도:
  - `1000ms` 또는 `100ms`
- 핵심 용도:
  - 호가창 상단 일부만 보기
- 왜 중요한가:
  - 깊은 오더북이 필요 없으면 간단하게 사용 가능
- 추천 사용 위치:
  - 간단한 호가창
  - 상단 5~20호가 표시

## 13. ★★☆☆☆ Kline with UTC+8 Offset
- 스트림 형식: `<symbol>@kline_<interval>@+08:00`
- 예시:
  - `btcusdt@kline_1d@+08:00`
- 업데이트 속도:
  - `1s` 봉은 `1000ms`
  - 나머지는 `2000ms`
- 핵심 용도:
  - UTC+8 기준으로 하루/주/월 차트를 보고 싶을 때
- 왜 중요한가:
  - 한국 서비스 기준에서는 일반적으로 우선순위 낮음
- 추천 사용 위치:
  - 특정 시간대 기준 봉이 꼭 필요할 때만 사용

## 14. ★☆☆☆☆ Reference Price
- 스트림 형식: `<symbol>@referencePrice`
- 예시:
  - `bazusd@referencePrice`
- 업데이트 속도: `1000ms`
- 핵심 용도:
  - 기준 가격
- 왜 중요한가:
  - 일반 모의투자 서비스에서는 거의 안 쓸 가능성이 큼
- 추천 사용 위치:
  - 특수 가격 비교 기능

---

## 거래량 상위 5종목을 구하는 방법
- 직접 `top5`를 주는 전용 스트림은 없음
- 추천 방법:
  1. `!miniTicker@arr` 또는 `!ticker_1d@arr` 구독
  2. 서버에서 최신 상태를 캐시
  3. `q` 기준으로 내림차순 정렬
  4. 상위 5개 반환
- 참고:
  - `q`는 quote asset volume
  - USDT 마켓끼리는 비교가 비교적 자연스러움

## 시가총액 상위 5종목을 구할 수 있는가
- `Binance Spot WebSocket만으로는 직접 불가능`
- 이유:
  - 시가총액 계산에 필요한 `유통량`, `공급량`, `market cap` 데이터가 없음
- 필요 시:
  - CoinGecko
  - CoinMarketCap
  - 별도 메타데이터 제공자

## 우리 프로젝트에서 실제 추천 조합
- 메인 시세 카드:
  - `<symbol>@ticker`
- 종목 상세 차트:
  - `<symbol>@kline_1m`
  - `<symbol>@kline_5m`
  - `<symbol>@kline_1h`
- 주문창:
  - `<symbol>@bookTicker`
- 최근 체결:
  - `<symbol>@trade` 또는 `<symbol>@aggTrade`
- 거래량 랭킹:
  - `!miniTicker@arr`

## 1차 구현 우선순위
1. `<symbol>@ticker`
2. `<symbol>@kline_1m`
3. `<symbol>@bookTicker`
4. `!miniTicker@arr`
5. `<symbol>@trade`

## 공식 참고 자료
- [Binance Spot WebSocket Streams](https://raw.githubusercontent.com/binance/binance-spot-api-docs/master/web-socket-streams.md)
- [Binance Spot API Docs Repository](https://github.com/binance/binance-spot-api-docs)
