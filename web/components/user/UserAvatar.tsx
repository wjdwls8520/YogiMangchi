import { useSyncExternalStore } from "react";

interface Props {
  profileImg?: string;
  classes?: string;
}

const subscribe = () => () => {};

export default function UserAvatar({
  profileImg,
  classes = "h-10 w-10",
}: Props) {
  const isHydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

  const imageSrc =
    isHydrated && profileImg ? profileImg : "/user_default.png";

  return (
    <div className={`profile overflow-hidden rounded-full ${classes}`}>
      <img
        key={imageSrc}
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
