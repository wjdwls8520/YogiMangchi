interface Props {
  profileImg?: string;
  classes?: string;
}

export default function UserAvatar({
  profileImg,
  classes = "w-[40px] h-[40px]",
}: Props) {
  // 커뮤니티 API가 localhost:8080 프로필 이미지를 직접 내려주기 때문에,
  // 개발 환경에서는 next/image 대신 img + fallback 조합이 더 안정적입니다.
  const imageSrc = profileImg || "/user_default.png";

  return (
    <div className={`profile rounded-full overflow-hidden ${classes} object-cover`}>
      <img
        src={imageSrc}
        alt="프로필 이미지"
        className="h-full w-full object-cover"
        onError={(event) => {
          event.currentTarget.src = "/user_default.png";
        }}
      />
    </div>
  );
}
