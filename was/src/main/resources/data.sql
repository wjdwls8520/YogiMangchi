-- PostgreSQL용 문법 (ON CONFLICT 사용)
-- src/main/resources/data.sql
-- [대장주 & 메이저 1티어] (현물/선물 모두 지원)
INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, market_type, created_at, updated_at)
VALUES ('BTCUSDT', 'BTC', 'YD', 'Bitcoin', '비트코인', true, 'BOTH', now(), now())
    ON CONFLICT (symbol) DO UPDATE SET is_active = EXCLUDED.is_active, market_type = EXCLUDED.market_type, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, market_type, created_at, updated_at)
VALUES ('ETHUSDT', 'ETH', 'YD', 'Ethereum', '이더리움', true, 'BOTH', now(), now())
    ON CONFLICT (symbol) DO UPDATE SET is_active = EXCLUDED.is_active, market_type = EXCLUDED.market_type, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, market_type, created_at, updated_at)
VALUES ('BNBUSDT', 'BNB', 'YD', 'Binance Coin', '바이낸스 코인', true, 'BOTH', now(), now())
    ON CONFLICT (symbol) DO UPDATE SET is_active = EXCLUDED.is_active, market_type = EXCLUDED.market_type, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, market_type, created_at, updated_at)
VALUES ('SOLUSDT', 'SOL', 'YD', 'Solana', '솔라나', true, 'BOTH', now(), now())
    ON CONFLICT (symbol) DO UPDATE SET is_active = EXCLUDED.is_active, market_type = EXCLUDED.market_type, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, market_type, created_at, updated_at)
VALUES ('XRPUSDT', 'XRP', 'YD', 'Ripple', '리플', true, 'BOTH', now(), now())
    ON CONFLICT (symbol) DO UPDATE SET is_active = EXCLUDED.is_active, market_type = EXCLUDED.market_type, updated_at = now();

-- [메이저 알트코인]
INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, market_type, created_at, updated_at)
VALUES ('ADAUSDT', 'ADA', 'YD', 'Cardano', '에이다', true, 'BOTH', now(), now())
    ON CONFLICT (symbol) DO UPDATE SET is_active = EXCLUDED.is_active, market_type = EXCLUDED.market_type, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, market_type, created_at, updated_at)
VALUES ('AVAXUSDT', 'AVAX', 'YD', 'Avalanche', '아발란체', true, 'BOTH', now(), now())
    ON CONFLICT (symbol) DO UPDATE SET is_active = EXCLUDED.is_active, market_type = EXCLUDED.market_type, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, market_type, created_at, updated_at)
VALUES ('DOTUSDT', 'DOT', 'YD', 'Polkadot', '폴카닷', true, 'BOTH', now(), now())
    ON CONFLICT (symbol) DO UPDATE SET is_active = EXCLUDED.is_active, market_type = EXCLUDED.market_type, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, market_type, created_at, updated_at)
VALUES ('LINKUSDT', 'LINK', 'YD', 'Chainlink', '체인링크', true, 'BOTH', now(), now())
    ON CONFLICT (symbol) DO UPDATE SET is_active = EXCLUDED.is_active, market_type = EXCLUDED.market_type, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, market_type, created_at, updated_at)
VALUES ('POLUSDT', 'POL', 'YD', 'Polygon', '폴리곤', true, 'BOTH', now(), now())
    ON CONFLICT (symbol) DO UPDATE SET is_active = EXCLUDED.is_active, market_type = EXCLUDED.market_type, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, market_type, created_at, updated_at)
VALUES ('TRXUSDT', 'TRX', 'YD', 'Tron', '트론', true, 'BOTH', now(), now())
    ON CONFLICT (symbol) DO UPDATE SET is_active = EXCLUDED.is_active, market_type = EXCLUDED.market_type, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, market_type, created_at, updated_at)
VALUES ('LTCUSDT', 'LTC', 'YD', 'Litecoin', '라이트코인', true, 'BOTH', now(), now())
    ON CONFLICT (symbol) DO UPDATE SET is_active = EXCLUDED.is_active, market_type = EXCLUDED.market_type, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, market_type, created_at, updated_at)
VALUES ('BCHUSDT', 'BCH', 'YD', 'Bitcoin Cash', '비트코인 캐시', true, 'BOTH', now(), now())
    ON CONFLICT (symbol) DO UPDATE SET is_active = EXCLUDED.is_active, market_type = EXCLUDED.market_type, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, market_type, created_at, updated_at)
VALUES ('ETCUSDT', 'ETC', 'YD', 'Ethereum Classic', '이더리움 클래식', true, 'BOTH', now(), now())
    ON CONFLICT (symbol) DO UPDATE SET is_active = EXCLUDED.is_active, market_type = EXCLUDED.market_type, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, market_type, created_at, updated_at)
VALUES ('ATOMUSDT', 'ATOM', 'YD', 'Cosmos', '코스모스', true, 'BOTH', now(), now())
    ON CONFLICT (symbol) DO UPDATE SET is_active = EXCLUDED.is_active, market_type = EXCLUDED.market_type, updated_at = now();

-- [밈(Meme) 코인] (테스트용: 도지/시바는 현물, 페페는 선물로 설정)
INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, market_type, created_at, updated_at)
VALUES ('DOGEUSDT', 'DOGE', 'YD', 'Dogecoin', '도지코인', true, 'SPOT', now(), now())
    ON CONFLICT (symbol) DO UPDATE SET is_active = EXCLUDED.is_active, market_type = EXCLUDED.market_type, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, market_type, created_at, updated_at)
VALUES ('SHIBUSDT', 'SHIB', 'YD', 'Shiba Inu', '시바이누', true, 'SPOT', now(), now())
    ON CONFLICT (symbol) DO UPDATE SET is_active = EXCLUDED.is_active, market_type = EXCLUDED.market_type, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, market_type, created_at, updated_at)
VALUES ('PEPEUSDT', 'PEPE', 'YD', 'Pepe', '페페코인', true, 'SPOT', now(), now())
    ON CONFLICT (symbol) DO UPDATE SET is_active = EXCLUDED.is_active, market_type = EXCLUDED.market_type, updated_at = now();

-- [디파이(DeFi) & 웹3 & 저장소] (테스트용: 유니스왑은 BOTH, 파일/니어는 현물)
INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, market_type, created_at, updated_at)
VALUES ('UNIUSDT', 'UNI', 'YD', 'Uniswap', '유니스왑', true, 'SPOT', now(), now())
    ON CONFLICT (symbol) DO UPDATE SET is_active = EXCLUDED.is_active, market_type = EXCLUDED.market_type, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, market_type, created_at, updated_at)
VALUES ('FILUSDT', 'FIL', 'YD', 'Filecoin', '파일코인', true, 'SPOT', now(), now())
    ON CONFLICT (symbol) DO UPDATE SET is_active = EXCLUDED.is_active, market_type = EXCLUDED.market_type, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, market_type, created_at, updated_at)
VALUES ('NEARUSDT', 'NEAR', 'YD', 'NEAR Protocol', '니어 프로토콜', true, 'SPOT', now(), now())
    ON CONFLICT (symbol) DO UPDATE SET is_active = EXCLUDED.is_active, market_type = EXCLUDED.market_type, updated_at = now();

-- [신흥 강자 & 레이어 2]
INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, market_type, created_at, updated_at)
VALUES ('APTUSDT', 'APT', 'YD', 'Aptos', '앱토스', true, 'SPOT', now(), now())
    ON CONFLICT (symbol) DO UPDATE SET is_active = EXCLUDED.is_active, market_type = EXCLUDED.market_type, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, market_type, created_at, updated_at)
VALUES ('SUIUSDT', 'SUI', 'YD', 'Sui', '수이', true, 'SPOT', now(), now())
    ON CONFLICT (symbol) DO UPDATE SET is_active = EXCLUDED.is_active, market_type = EXCLUDED.market_type, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, market_type, created_at, updated_at)
VALUES ('SEIUSDT', 'SEI', 'YD', 'Sei', '세이', true, 'SPOT', now(), now())
    ON CONFLICT (symbol) DO UPDATE SET is_active = EXCLUDED.is_active, market_type = EXCLUDED.market_type, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, market_type, created_at, updated_at)
VALUES ('OPUSDT', 'OP', 'YD', 'Optimism', '옵티미즘', true, 'SPOT', now(), now())
    ON CONFLICT (symbol) DO UPDATE SET is_active = EXCLUDED.is_active, market_type = EXCLUDED.market_type, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, market_type, created_at, updated_at)
VALUES ('ARBUSDT', 'ARB', 'YD', 'Arbitrum', '아비트럼', true, 'SPOT', now(), now())
    ON CONFLICT (symbol) DO UPDATE SET is_active = EXCLUDED.is_active, market_type = EXCLUDED.market_type, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, market_type, created_at, updated_at)
VALUES ('STXUSDT', 'STX', 'YD', 'Stacks', '스택스', true, 'SPOT', now(), now())
    ON CONFLICT (symbol) DO UPDATE SET is_active = EXCLUDED.is_active, market_type = EXCLUDED.market_type, updated_at = now();

-- [AI & 기타 트렌드] (테스트용: 월드코인은 BOTH, 인젝티브/페치는 선물 전용)
INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, market_type, created_at, updated_at)
VALUES ('WLDUSDT', 'WLD', 'YD', 'Worldcoin', '월드코인', true, 'SPOT', now(), now())
    ON CONFLICT (symbol) DO UPDATE SET is_active = EXCLUDED.is_active, market_type = EXCLUDED.market_type, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, market_type, created_at, updated_at)
VALUES ('INJUSDT', 'INJ', 'YD', 'Injective', '인젝티브', true, 'SPOT', now(), now())
    ON CONFLICT (symbol) DO UPDATE SET is_active = EXCLUDED.is_active, market_type = EXCLUDED.market_type, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, market_type, created_at, updated_at)
VALUES ('FETUSDT', 'FET', 'YD', 'Fetch.ai', '페치', true, 'SPOT', now(), now())
    ON CONFLICT (symbol) DO UPDATE SET is_active = EXCLUDED.is_active, market_type = EXCLUDED.market_type, updated_at = now();

-- [선물 심볼 레버리지 정책] market_type = BOTH 심볼만 등록
-- BTC/ETH/XRP: 본투자 최대 5배 / 대회 최대 100배
-- 나머지 BOTH: 본투자 최대 3배 / 대회 최대 5배
INSERT INTO futures_symbol_policy (symbol, max_leverage, contest_max_leverage)
VALUES
    ('BTCUSDT',  5, 100),
    ('ETHUSDT',  5, 100),
    ('XRPUSDT',  5, 100),
    ('BNBUSDT',  3,   5),
    ('SOLUSDT',  3,   5),
    ('ADAUSDT',  3,   5),
    ('AVAXUSDT', 3,   5),
    ('DOTUSDT',  3,   5),
    ('LINKUSDT', 3,   5),
    ('POLUSDT',  3,   5),
    ('TRXUSDT',  3,   5),
    ('LTCUSDT',  3,   5),
    ('BCHUSDT',  3,   5),
    ('ETCUSDT',  3,   5),
    ('ATOMUSDT', 3,   5)
ON CONFLICT (symbol) DO UPDATE
    SET max_leverage = EXCLUDED.max_leverage,
        contest_max_leverage = EXCLUDED.contest_max_leverage;