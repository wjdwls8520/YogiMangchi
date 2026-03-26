-- PostgreSQL용 문법 (ON CONFLICT 사용)
-- src/main/resources/data.sql

-- [대장주 & 메이저 1티어]
INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, created_at, updated_at)
VALUES ('BTCUSDT', 'BTC', 'USDT', 'Bitcoin', '비트코인', true, now(), now()) ON CONFLICT (symbol) DO UPDATE SET is_active = true, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, created_at, updated_at)
VALUES ('ETHUSDT', 'ETH', 'USDT', 'Ethereum', '이더리움', true, now(), now()) ON CONFLICT (symbol) DO UPDATE SET is_active = true, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, created_at, updated_at)
VALUES ('BNBUSDT', 'BNB', 'USDT', 'Binance Coin', '바이낸스 코인', true, now(), now()) ON CONFLICT (symbol) DO UPDATE SET is_active = true, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, created_at, updated_at)
VALUES ('SOLUSDT', 'SOL', 'USDT', 'Solana', '솔라나', true, now(), now()) ON CONFLICT (symbol) DO UPDATE SET is_active = true, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, created_at, updated_at)
VALUES ('XRPUSDT', 'XRP', 'USDT', 'Ripple', '리플', true, now(), now()) ON CONFLICT (symbol) DO UPDATE SET is_active = true, updated_at = now();

-- [메이저 알트코인]
INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, created_at, updated_at)
VALUES ('ADAUSDT', 'ADA', 'USDT', 'Cardano', '에이다', true, now(), now()) ON CONFLICT (symbol) DO UPDATE SET is_active = true, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, created_at, updated_at)
VALUES ('AVAXUSDT', 'AVAX', 'USDT', 'Avalanche', '아발란체', true, now(), now()) ON CONFLICT (symbol) DO UPDATE SET is_active = true, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, created_at, updated_at)
VALUES ('DOTUSDT', 'DOT', 'USDT', 'Polkadot', '폴카닷', true, now(), now()) ON CONFLICT (symbol) DO UPDATE SET is_active = true, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, created_at, updated_at)
VALUES ('LINKUSDT', 'LINK', 'USDT', 'Chainlink', '체인링크', true, now(), now()) ON CONFLICT (symbol) DO UPDATE SET is_active = true, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, created_at, updated_at)
VALUES ('POLUSDT', 'POL', 'USDT', 'Polygon', '폴리곤', true, now(), now()) ON CONFLICT (symbol) DO UPDATE SET is_active = true, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, created_at, updated_at)
VALUES ('TRXUSDT', 'TRX', 'USDT', 'Tron', '트론', true, now(), now()) ON CONFLICT (symbol) DO UPDATE SET is_active = true, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, created_at, updated_at)
VALUES ('LTCUSDT', 'LTC', 'USDT', 'Litecoin', '라이트코인', true, now(), now()) ON CONFLICT (symbol) DO UPDATE SET is_active = true, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, created_at, updated_at)
VALUES ('BCHUSDT', 'BCH', 'USDT', 'Bitcoin Cash', '비트코인 캐시', true, now(), now()) ON CONFLICT (symbol) DO UPDATE SET is_active = true, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, created_at, updated_at)
VALUES ('ETCUSDT', 'ETC', 'USDT', 'Ethereum Classic', '이더리움 클래식', true, now(), now()) ON CONFLICT (symbol) DO UPDATE SET is_active = true, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, created_at, updated_at)
VALUES ('ATOMUSDT', 'ATOM', 'USDT', 'Cosmos', '코스모스', true, now(), now()) ON CONFLICT (symbol) DO UPDATE SET is_active = true, updated_at = now();

-- [밈(Meme) 코인]
INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, created_at, updated_at)
VALUES ('DOGEUSDT', 'DOGE', 'USDT', 'Dogecoin', '도지코인', true, now(), now()) ON CONFLICT (symbol) DO UPDATE SET is_active = true, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, created_at, updated_at)
VALUES ('SHIBUSDT', 'SHIB', 'USDT', 'Shiba Inu', '시바이누', true, now(), now()) ON CONFLICT (symbol) DO UPDATE SET is_active = true, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, created_at, updated_at)
VALUES ('PEPEUSDT', 'PEPE', 'USDT', 'Pepe', '페페코인', true, now(), now()) ON CONFLICT (symbol) DO UPDATE SET is_active = true, updated_at = now();

-- [디파이(DeFi) & 웹3 & 저장소]
INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, created_at, updated_at)
VALUES ('UNIUSDT', 'UNI', 'USDT', 'Uniswap', '유니스왑', true, now(), now()) ON CONFLICT (symbol) DO UPDATE SET is_active = true, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, created_at, updated_at)
VALUES ('FILUSDT', 'FIL', 'USDT', 'Filecoin', '파일코인', true, now(), now()) ON CONFLICT (symbol) DO UPDATE SET is_active = true, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, created_at, updated_at)
VALUES ('NEARUSDT', 'NEAR', 'USDT', 'NEAR Protocol', '니어 프로토콜', true, now(), now()) ON CONFLICT (symbol) DO UPDATE SET is_active = true, updated_at = now();

-- [신흥 강자 & 레이어 2]
INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, created_at, updated_at)
VALUES ('APTUSDT', 'APT', 'USDT', 'Aptos', '앱토스', true, now(), now()) ON CONFLICT (symbol) DO UPDATE SET is_active = true, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, created_at, updated_at)
VALUES ('SUIUSDT', 'SUI', 'USDT', 'Sui', '수이', true, now(), now()) ON CONFLICT (symbol) DO UPDATE SET is_active = true, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, created_at, updated_at)
VALUES ('SEIUSDT', 'SEI', 'USDT', 'Sei', '세이', true, now(), now()) ON CONFLICT (symbol) DO UPDATE SET is_active = true, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, created_at, updated_at)
VALUES ('OPUSDT', 'OP', 'USDT', 'Optimism', '옵티미즘', true, now(), now()) ON CONFLICT (symbol) DO UPDATE SET is_active = true, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, created_at, updated_at)
VALUES ('ARBUSDT', 'ARB', 'USDT', 'Arbitrum', '아비트럼', true, now(), now()) ON CONFLICT (symbol) DO UPDATE SET is_active = true, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, created_at, updated_at)
VALUES ('STXUSDT', 'STX', 'USDT', 'Stacks', '스택스', true, now(), now()) ON CONFLICT (symbol) DO UPDATE SET is_active = true, updated_at = now();

-- [AI & 기타 트렌드]
INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, created_at, updated_at)
VALUES ('WLDUSDT', 'WLD', 'USDT', 'Worldcoin', '월드코인', true, now(), now()) ON CONFLICT (symbol) DO UPDATE SET is_active = true, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, created_at, updated_at)
VALUES ('INJUSDT', 'INJ', 'USDT', 'Injective', '인젝티브', true, now(), now()) ON CONFLICT (symbol) DO UPDATE SET is_active = true, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, created_at, updated_at)
VALUES ('FETUSDT', 'FET', 'USDT', 'Fetch.ai', '페치', true, now(), now()) ON CONFLICT (symbol) DO UPDATE SET is_active = true, updated_at = now();