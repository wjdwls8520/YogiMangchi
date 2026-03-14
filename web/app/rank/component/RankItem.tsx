"use client";
import { cn } from "@/utils/cs";
import { RankProps } from "../types/user";

const medalColor = [
                    "bg-[linear-gradient(139deg,rgba(255,215,0,1)_0%,rgba(255,215,0,1)_60%,rgba(223,117,0,1)_100%)]", 
                    "bg-[linear-gradient(139deg,#E5E7EB_0%,#D1D5DB_60%,#9CA3AF_100%)]", 
                    "bg-[linear-gradient(139deg,#CD7F32_0%,#B45309_60%,#92400E_100%)]"
                ];

export default function RankItem({ rank, profile, nickName, title, rate, follower }: RankProps) {

    const isRanker: boolean = rank <= 3;

    return (
        <li className="relative border-gray-200 border-1 p-[25px] rounded-2xl text-center">
            <p className={cn("flex items-center justify-center absolute top-[15px] left-[15px] w-9 h-9 rounded-full bg-gray-300 font-bold", 
                            isRanker && `text-white ${medalColor[rank - 1]}`
                        )}>{rank}</p>
            <article>
                <header>
                    <div className="flex justify-center mb-4">
                        {
                            profile ? 
                                profile : 
                                <svg xmlns="http://www.w3.org/2000/svg" height="80px" viewBox="0 -960 960 960" width="80px" fill="#1C1C1C">
                                    <path xmlns="http://www.w3.org/2000/svg" d="M222-255q63-44 125-67.5T480-346q71 0 133.5 23.5T739-255q44-54 62.5-109T820-480q0-145-97.5-242.5T480-820q-145 0-242.5 97.5T140-480q0 61 19 116t63 109Zm160.5-234.5Q343-529 343-587t39.5-97.5Q422-724 480-724t97.5 39.5Q617-645 617-587t-39.5 97.5Q538-450 480-450t-97.5-39.5ZM480-80q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-83 31.5-155.5t86-127Q252-817 325-848.5T480-880q83 0 155.5 31.5t127 86q54.5 54.5 86 127T880-480q0 82-31.5 155t-86 127.5q-54.5 54.5-127 86T480-80Zm107.5-76Q640-172 691-212q-51-36-104-55t-107-19q-54 0-107 19t-104 55q51 40 103.5 56T480-140q55 0 107.5-16Zm-52-375.5Q557-553 557-587t-21.5-55.5Q514-664 480-664t-55.5 21.5Q403-621 403-587t21.5 55.5Q446-510 480-510t55.5-21.5ZM480-587Zm0 374Z"/>
                                </svg>
                        }
                    </div>
                    <h3 className="font-bold text-xl">{nickName}</h3>
                    <p className="text-gray-500 pt-1 text-lg">{title}</p>
                </header>

                <dl className="flex justify-center gap-6 bg-sky-50 rounded-xl mt-5 py-4">
                    <div className="">
                        <dt className="text-gray-400 pb-2">수익률</dt>
                        <dd className="text-xl font-bold text-red-600">{rate}%</dd>
                    </div>
                    <div className="">
                        <dt className="text-gray-400 pb-2">팔로워</dt>
                        <dd className="text-xl font-bold">{follower}</dd>
                    </div>
                </dl>
                <button type="button" className="w-full cursor-pointer border-1 border-gray-200 rounded-xl leading-11 font-semibold mt-5">팔로우</button>
            </article>
        </li>
    )
}