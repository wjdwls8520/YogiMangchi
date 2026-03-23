import { UserIcon } from "@/components/icons";

import Image from "next/image";


interface Props {
  profileImg?: string;
  classes?: string;
}

export default function UserAvatar({ profileImg, classes="w-[40px] h-[40px]" }: Props) {

    return(
        <div className="profile">
            {
                profileImg ? 
                <Image src={profileImg} alt="프로필 이미지" /> : 
                <UserIcon className={classes} />
            }
        </div>
    )
}