"use client";

import { useState } from "react";
import CommunityList from "./CommunityList";
import WriteModal from "./WriteModal";
import { useModalStore } from "@/stores/useModalStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { Post } from "../types/post";


interface ContainerProps {
    initialPosts: Post[];
}

export default function CommunityContainer({ initialPosts }:ContainerProps) {
    const [allPosts, setAllPosts] = useState(initialPosts);

    const user = useAuthStore((state) => state.user);   
    const { isOpen, close } = useModalStore();

  return (
    <>
      <CommunityList allPosts={allPosts} setAllPosts={setAllPosts} />
        { 
            isOpen && 
            <WriteModal setIsOpen={close} myInfo={user} setAllPosts={setAllPosts} />
        }
    </>
  );
}