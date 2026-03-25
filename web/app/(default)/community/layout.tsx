"use client";

import { useState } from "react";
import FloatMenu from "./components/FloatMenu";
import Menu from "./components/Menu";
import Top5 from "./components/Top5";
import { Ranker } from "./types/ranker";
import WriteModal from "./components/WriteModal";

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


export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {

    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <section className="md:grid md:grid-cols-11 lg:grid-cols-15 gap-11 relative">
                <Menu />
                <div className="col-span-8">
                    {children}
                </div>
                <Top5 ranker={ranker} />
                <FloatMenu onOpenLayer={() => setIsOpen(true)} />
            </section>
            { 
                isOpen && 
                <WriteModal setIsOpen={setIsOpen} />
            }
        </>
    )
}