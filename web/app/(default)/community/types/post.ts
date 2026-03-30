export interface File {
  id: number;
  originalname: string;
  size: number;
  path: string;
  contentType: string;
  createdAt: string;
  postId: number;
  previewUrl?: string; // 글 등록 시 이미지 미리보기 url

}


export interface Post {
  id: number;
  title: string;
  content: string;
  likeCount: number;
  likedByMe: boolean;
  replyCount: number;
  reportCount: number;
  reportedByMe: boolean;
  createdAt: string;
  updatedAt: string;
  memberId: number;
  nickname: string;
  profileImg: string;
  files: File[];
};