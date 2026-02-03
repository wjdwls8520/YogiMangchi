import MainLayout from '../shared/layout/MainLayout';
import Button from '../shared/ui/Button';
import MarketIndexList from '../features/stock/ui/MarketIndexList';
import StockGridList from '../features/stock/ui/StockGridList';

import StockNewsList from '../features/stock/ui/StockNewsList';
import HomeChartistSection from '../features/chartist/ui/HomeChartistSection';
import AdBanner from '../features/ad/ui/AdBanner';
import IPOList from '../features/ipo/ui/IPOList';
import './Home.css';

export default function Home() {

  const topStocks = [
    { code: "005930", name: "삼성전자" },
    { code: "000660", name: "SK하이닉스" },
    { code: "035420", name: "NAVER" },
    { code: "035720", name: "카카오" }
  ];

  const big4Stocks = [
    { code: "005930", name: "삼성전자" },
    { code: "373220", name: "LG에너지솔루션" },
    { code: "000660", name: "SK하이닉스" },
    { code: "207940", name: "삼성바이오로직스" }
  ];

  return (
    <MainLayout>
      {/* Section 1: Hero */}
      <section className="homeHero">
        <h1 className="homeTitle">
          나의 욕망을 실현할 곳, <br />
          <span className="homeTitleHighlight">여기망치</span>
        </h1>
        <p className="homeSubtitle">
          나만의 투자경험, 투자비법을 모의투자와 커뮤니티로 실현해보세요.
        </p>
        <div className="homeActions">
          <Button size="lg" variant="primary">트레이닝 시작하기</Button>
          <Button size="lg" variant="secondary">차티스트 보기</Button>
        </div>
      </section>

      {/* Section 2: Market Indices */}
      <section className="homeSection">
        <h2 className="homeSectionTitle">
          시장 지표
        </h2>
        <MarketIndexList />
      </section>

      {/* Section 3: Top Stocks */}
      <section className="homeSection">
        <div className="homeSectionHeader">
          <h2 className="homeSectionTitle">
            오늘의 인기 종목
          </h2>
          <Button variant="ghost" size="sm" className="viewAllBtn">종목 더 보기</Button>
        </div>
        <StockGridList stocks={topStocks} />
      </section>

      {/* Section 4: Korea Big 4 */}
      <section className="homeSection">
        <div className="homeSectionHeader">
          <h2 className="homeSectionTitle">
            대한민국 Big 4
          </h2>
          <Button variant="ghost" size="sm" className="viewAllBtn">종목 더 보기</Button>
        </div>
        <StockGridList stocks={big4Stocks} />
      </section>

      {/* Section 5: Top 3 Chartists */}
      <section className="homeSection">
        <div className="homeSectionHeader">
          <h2 className="homeSectionTitle">
            인기 차티스트 TOP 3
          </h2>
        </div>
        <HomeChartistSection />
      </section>

      {/* Section 6: Stock News */}
      <section className="homeSection">
        <h2 className="homeSectionTitle">
          주요 뉴스
        </h2>
        <StockNewsList />
      </section>

      {/* Section 7: Advertisement */}
      <section className="homeSection">
        <AdBanner />
      </section>

      {/* Section 8: Upcoming IPOs */}
      <section className="homeSection">
        <div className="homeSectionHeader">
          <h2 className="homeSectionTitle">
            다가오는 공모주
          </h2>
          <Button variant="ghost" size="sm" className="viewAllBtn">더 보기</Button>
        </div>
        <IPOList />
      </section>
    </MainLayout>
  );
}