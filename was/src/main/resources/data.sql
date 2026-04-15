-- PostgreSQL용 문법 (ON CONFLICT 사용)
-- src/main/resources/data.sql
-- [대장주 & 메이저 1티어] (현물/선물 모두 지원)
INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, market_type, created_at, updated_at)
VALUES ('BTCYD', 'BTC', 'YD', 'Bitcoin', '비트코인', true, 'BOTH', now(), now())
    ON CONFLICT (symbol) DO UPDATE SET is_active = EXCLUDED.is_active, market_type = EXCLUDED.market_type, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, market_type, created_at, updated_at)
VALUES ('ETHYD', 'ETH', 'YD', 'Ethereum', '이더리움', true, 'BOTH', now(), now())
    ON CONFLICT (symbol) DO UPDATE SET is_active = EXCLUDED.is_active, market_type = EXCLUDED.market_type, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, market_type, created_at, updated_at)
VALUES ('BNBYD', 'BNB', 'YD', 'Binance Coin', '바이낸스 코인', true, 'BOTH', now(), now())
    ON CONFLICT (symbol) DO UPDATE SET is_active = EXCLUDED.is_active, market_type = EXCLUDED.market_type, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, market_type, created_at, updated_at)
VALUES ('SOLYD', 'SOL', 'YD', 'Solana', '솔라나', true, 'BOTH', now(), now())
    ON CONFLICT (symbol) DO UPDATE SET is_active = EXCLUDED.is_active, market_type = EXCLUDED.market_type, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, market_type, created_at, updated_at)
VALUES ('XRPYD', 'XRP', 'YD', 'Ripple', '리플', true, 'BOTH', now(), now())
    ON CONFLICT (symbol) DO UPDATE SET is_active = EXCLUDED.is_active, market_type = EXCLUDED.market_type, updated_at = now();

-- [메이저 알트코인]
INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, market_type, created_at, updated_at)
VALUES ('ADAYD', 'ADA', 'YD', 'Cardano', '에이다', true, 'BOTH', now(), now())
    ON CONFLICT (symbol) DO UPDATE SET is_active = EXCLUDED.is_active, market_type = EXCLUDED.market_type, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, market_type, created_at, updated_at)
VALUES ('AVAXYD', 'AVAX', 'YD', 'Avalanche', '아발란체', true, 'BOTH', now(), now())
    ON CONFLICT (symbol) DO UPDATE SET is_active = EXCLUDED.is_active, market_type = EXCLUDED.market_type, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, market_type, created_at, updated_at)
VALUES ('DOTYD', 'DOT', 'YD', 'Polkadot', '폴카닷', true, 'BOTH', now(), now())
    ON CONFLICT (symbol) DO UPDATE SET is_active = EXCLUDED.is_active, market_type = EXCLUDED.market_type, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, market_type, created_at, updated_at)
VALUES ('LINKYD', 'LINK', 'YD', 'Chainlink', '체인링크', true, 'BOTH', now(), now())
    ON CONFLICT (symbol) DO UPDATE SET is_active = EXCLUDED.is_active, market_type = EXCLUDED.market_type, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, market_type, created_at, updated_at)
VALUES ('POLYD', 'POL', 'YD', 'Polygon', '폴리곤', true, 'BOTH', now(), now())
    ON CONFLICT (symbol) DO UPDATE SET is_active = EXCLUDED.is_active, market_type = EXCLUDED.market_type, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, market_type, created_at, updated_at)
VALUES ('TRXYD', 'TRX', 'YD', 'Tron', '트론', true, 'BOTH', now(), now())
    ON CONFLICT (symbol) DO UPDATE SET is_active = EXCLUDED.is_active, market_type = EXCLUDED.market_type, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, market_type, created_at, updated_at)
VALUES ('LTCYD', 'LTC', 'YD', 'Litecoin', '라이트코인', true, 'BOTH', now(), now())
    ON CONFLICT (symbol) DO UPDATE SET is_active = EXCLUDED.is_active, market_type = EXCLUDED.market_type, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, market_type, created_at, updated_at)
VALUES ('BCHYD', 'BCH', 'YD', 'Bitcoin Cash', '비트코인 캐시', true, 'BOTH', now(), now())
    ON CONFLICT (symbol) DO UPDATE SET is_active = EXCLUDED.is_active, market_type = EXCLUDED.market_type, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, market_type, created_at, updated_at)
VALUES ('ETCYD', 'ETC', 'YD', 'Ethereum Classic', '이더리움 클래식', true, 'BOTH', now(), now())
    ON CONFLICT (symbol) DO UPDATE SET is_active = EXCLUDED.is_active, market_type = EXCLUDED.market_type, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, market_type, created_at, updated_at)
VALUES ('ATOMYD', 'ATOM', 'YD', 'Cosmos', '코스모스', true, 'BOTH', now(), now())
    ON CONFLICT (symbol) DO UPDATE SET is_active = EXCLUDED.is_active, market_type = EXCLUDED.market_type, updated_at = now();

-- [밈(Meme) 코인] (테스트용: 도지/시바는 현물, 페페는 선물로 설정)
INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, market_type, created_at, updated_at)
VALUES ('DOGEYD', 'DOGE', 'YD', 'Dogecoin', '도지코인', true, 'SPOT', now(), now())
    ON CONFLICT (symbol) DO UPDATE SET is_active = EXCLUDED.is_active, market_type = EXCLUDED.market_type, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, market_type, created_at, updated_at)
VALUES ('SHIBYD', 'SHIB', 'YD', 'Shiba Inu', '시바이누', true, 'SPOT', now(), now())
    ON CONFLICT (symbol) DO UPDATE SET is_active = EXCLUDED.is_active, market_type = EXCLUDED.market_type, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, market_type, created_at, updated_at)
VALUES ('PEPEYD', 'PEPE', 'YD', 'Pepe', '페페코인', true, 'FUTURE', now(), now())
    ON CONFLICT (symbol) DO UPDATE SET is_active = EXCLUDED.is_active, market_type = EXCLUDED.market_type, updated_at = now();

-- [디파이(DeFi) & 웹3 & 저장소] (테스트용: 유니스왑은 BOTH, 파일/니어는 현물)
INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, market_type, created_at, updated_at)
VALUES ('UNIYD', 'UNI', 'YD', 'Uniswap', '유니스왑', true, 'BOTH', now(), now())
    ON CONFLICT (symbol) DO UPDATE SET is_active = EXCLUDED.is_active, market_type = EXCLUDED.market_type, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, market_type, created_at, updated_at)
VALUES ('FILYD', 'FIL', 'YD', 'Filecoin', '파일코인', true, 'SPOT', now(), now())
    ON CONFLICT (symbol) DO UPDATE SET is_active = EXCLUDED.is_active, market_type = EXCLUDED.market_type, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, market_type, created_at, updated_at)
VALUES ('NEARYD', 'NEAR', 'YD', 'NEAR Protocol', '니어 프로토콜', true, 'SPOT', now(), now())
    ON CONFLICT (symbol) DO UPDATE SET is_active = EXCLUDED.is_active, market_type = EXCLUDED.market_type, updated_at = now();

-- [신흥 강자 & 레이어 2]
INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, market_type, created_at, updated_at)
VALUES ('APTYD', 'APT', 'YD', 'Aptos', '앱토스', true, 'BOTH', now(), now())
    ON CONFLICT (symbol) DO UPDATE SET is_active = EXCLUDED.is_active, market_type = EXCLUDED.market_type, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, market_type, created_at, updated_at)
VALUES ('SUIYD', 'SUI', 'YD', 'Sui', '수이', true, 'BOTH', now(), now())
    ON CONFLICT (symbol) DO UPDATE SET is_active = EXCLUDED.is_active, market_type = EXCLUDED.market_type, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, market_type, created_at, updated_at)
VALUES ('SEIYD', 'SEI', 'YD', 'Sei', '세이', true, 'BOTH', now(), now())
    ON CONFLICT (symbol) DO UPDATE SET is_active = EXCLUDED.is_active, market_type = EXCLUDED.market_type, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, market_type, created_at, updated_at)
VALUES ('OPYD', 'OP', 'YD', 'Optimism', '옵티미즘', true, 'BOTH', now(), now())
    ON CONFLICT (symbol) DO UPDATE SET is_active = EXCLUDED.is_active, market_type = EXCLUDED.market_type, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, market_type, created_at, updated_at)
VALUES ('ARBYD', 'ARB', 'YD', 'Arbitrum', '아비트럼', true, 'BOTH', now(), now())
    ON CONFLICT (symbol) DO UPDATE SET is_active = EXCLUDED.is_active, market_type = EXCLUDED.market_type, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, market_type, created_at, updated_at)
VALUES ('STXYD', 'STX', 'YD', 'Stacks', '스택스', true, 'BOTH', now(), now())
    ON CONFLICT (symbol) DO UPDATE SET is_active = EXCLUDED.is_active, market_type = EXCLUDED.market_type, updated_at = now();

-- [AI & 기타 트렌드] (테스트용: 월드코인은 BOTH, 인젝티브/페치는 선물 전용)
INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, market_type, created_at, updated_at)
VALUES ('WLDYD', 'WLD', 'YD', 'Worldcoin', '월드코인', true, 'BOTH', now(), now())
    ON CONFLICT (symbol) DO UPDATE SET is_active = EXCLUDED.is_active, market_type = EXCLUDED.market_type, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, market_type, created_at, updated_at)
VALUES ('INJYD', 'INJ', 'YD', 'Injective', '인젝티브', true, 'FUTURE', now(), now())
    ON CONFLICT (symbol) DO UPDATE SET is_active = EXCLUDED.is_active, market_type = EXCLUDED.market_type, updated_at = now();

INSERT INTO market_symbol (symbol, base_asset, quote_asset, display_name_en, display_name_kr, is_active, market_type, created_at, updated_at)
VALUES ('FETYD', 'FET', 'YD', 'Fetch.ai', '페치', true, 'FUTURE', now(), now())
    ON CONFLICT (symbol) DO UPDATE SET is_active = EXCLUDED.is_active, market_type = EXCLUDED.market_type, updated_at = now();