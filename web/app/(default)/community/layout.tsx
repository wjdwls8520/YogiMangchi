import FloatMenu from "./components/FloatMenu";
import Menu from "./components/Menu";
import ReportModal from "./components/ReportModal";
import Top5 from "./components/Top5";
import WriteModalWrapper from "./components/WriteModalWrapper";
import { Ranker } from "./types/ranker";

const ranker: Ranker[] = [
    {
        profile: '',
        nickName: '주식고수',
        Profit: 636250609,
        rate: 170,
    },
    {
        profile: '',
        nickName: '선비왕',
        Profit: 612230400,
        rate: 166,
    },
    {
        profile: '',
        nickName: '인생한방',
        Profit: 578030802,
        rate: 169,
    },
    {
        profile: '',
        nickName: '코인대장',
        Profit: 552100300,
        rate: 162,
    },
    {
        profile: '',
        nickName: '불장러',
        Profit: 498320150,
        rate: 158,
    },
];


export default async function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {

    return (
        <>
            <section className="md:grid md:grid-cols-11 lg:grid-cols-15 gap-11 relative">
                <Menu />
                <div className="col-span-8">
                    {children}
                </div>
                <Top5 ranker={ranker} />
                <FloatMenu />
                <WriteModalWrapper />     
                <ReportModal />
            </section>
        </>
    )
}