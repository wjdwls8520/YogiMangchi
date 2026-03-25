import SubMenu from "@/components/SubMenu";
import CommunityList from "../components/CommunityList";
import NewsList from "./components/NewsList";
import { Post } from "../types/post";

const menus  = [
    { id: "best", label: "주간 인기글" },
    { id: "latest", label: "최신글" },
];

const posts: Post[] = [
    {
        id: '1',
        nickname: '코인왕',
        profileImg: '',
        title: '안녕하세요 코인왕 입니다.',
        content: '제 프로필을 눌러서 팔로잉해주세요. 제 프로필을 눌러서 팔로잉해주세요. 제 프로필을 눌러서 팔로잉해주세요.',
        images: [],
        likeCount: 100,
        unlikeCount: 10,
        replyCount: 2,
        reportCount: 170,
        createAt: '16:40',
        updateAt: '16:40',
    },
    {
        id: '2',
        nickname: '비트마스터',
        profileImg: '',
        title: '오늘 장 분위기 좋네요',
        content: '비트코인 상승 흐름 이어지는 중입니다. 다들 성투하세요!',
        images: [],
        likeCount: 85,
        unlikeCount: 5,
        replyCount: 4,
        reportCount: 3,
        createAt: '15:20',
        updateAt: '15:20',
    },
    {
        id: '3',
        nickname: '알트헌터',
        profileImg: '',
        title: '요즘 알트 뭐 보시나요?',
        content: '괜찮은 알트 코인 추천 부탁드립니다. 같이 분석해봐요.',
        images: [],
        likeCount: 64,
        unlikeCount: 3,
        replyCount: 7,
        reportCount: 1,
        createAt: '14:10',
        updateAt: '14:10',
    },
    {
        id: '4',
        nickname: '단타고수',
        profileImg: '',
        title: '단타 타이밍 공유합니다',
        content: '지금 단타 들어가기 괜찮은 자리입니다. 참고만 하세요.',
        images: [],
        likeCount: 120,
        unlikeCount: 15,
        replyCount: 10,
        reportCount: 5,
        createAt: '13:05',
        updateAt: '13:05',
    },
    {
        id: '5',
        nickname: '존버킹',
        profileImg: '',
        title: '존버는 승리한다',
        content: '하락장에서도 멘탈 유지가 중요합니다. 장기적으로 보면 올라요.',
        images: [],
        likeCount: 200,
        unlikeCount: 20,
        replyCount: 12,
        reportCount: 2,
        createAt: '12:00',
        updateAt: '12:00',
    },
    {
        id: '6',
        nickname: '차트분석가',
        profileImg: '',
        title: '차트상 저항선 돌파 임박',
        content: '현재 구간에서 저항선 테스트 중입니다. 돌파 시 추가 상승 가능성 있습니다.',
        images: [],
        likeCount: 95,
        unlikeCount: 6,
        replyCount: 5,
        reportCount: 0,
        createAt: '11:30',
        updateAt: '11:30',
    }
];


export default async function CategoryPage({
  params,
}: {
  params: { category: string };
}) {

    const { category } = await params;
    const isNews = category === "news";

    return (
        <>
            {!isNews && <SubMenu menus={menus} />}
            {!isNews ? <CommunityList posts={posts} /> : <NewsList />}
        </>
    )
}