"use client";
import { cn } from "@/utils/cs";
import { RankProps } from "../types/user";
import { UserIcon } from "@/components/icons";

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
                        { profile ?  profile : <UserIcon className="w-[60px] h-[60px]" /> }
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