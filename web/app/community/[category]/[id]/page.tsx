import CommunityItem from "../../components/CommunityItem";
import { Post } from "../../types/post";

interface PageProps {
  params: {
    category: string;
    id: string;
  };
}


export default async function CategoryDetailPage({ params }: PageProps) {

    // const post = await getPost(params.id);
    const post = {
        id: '1',
        nickname: '김철수',
        profileImg: '',
        title: '안녕하세요 코인왕 김철수입니다',
        content: 'ㅎㅎㅎㅎ 안녕하세요~~ 다들 잘 지내셨나요? ㅎㅎㅎㅎ 안녕하세요~~ 다들 잘 지내셨나요? ㅎㅎㅎㅎ 안녕하세요~~ 다들 잘 지내셨나요? ㅎㅎㅎㅎ 안녕하세요~~ 다들 잘 지내셨나요? ',
        images: [],
        likeCount: 3,
        unlikeCount: 1,
        replyCount: 4,  
        reportCount: 0,
        createAt: '20260324',
        updateAt: '20260324',
    };

    return <CommunityItem post={post} variant="detail" />;
}