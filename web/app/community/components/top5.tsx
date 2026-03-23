import { UserIcon } from "@/components/icons";
import { Ranker } from "../types/ranker";


interface Rankers {
  ranker: Ranker[];
}

export default function Top5({ranker} :Rankers) {


    return (
        <aside className="col-span-4 pt-6 mt-[-11px] sticky top-0 self-start">
            <h2 className="text-xl font-bold">수익금 상위 투자자 TOP5</h2>
            <small className="text-sm text-gray-500">최근 1주일 기준</small>
            <ul className="flex flex-col gap-6 pt-6.5">
                {ranker.map((user) => 
                    <li key={user.nickName} className="flex flex-auto items-center gap-3">
                        <div className="profile">
                            { user.profile ?  user.profile : <UserIcon className="w-[35px] h-[35px]" /> }
                        </div>
                        <div className="flex-auto">
                            <p className="text-lg font-semibold">{user.nickName}</p>
                            <p className="text-red-500 text-sm">+{user.Profit}원 ({user.rate}%)</p>
                        </div>
                        <button type="button" className="bg-blue-100 rounded-md text-base text-blue-700 font-semibold ml-1 py-1 px-4">팔로우</button>
                    </li>
                )}
            </ul>
        </aside>
    )
}