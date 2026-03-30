"use client";

import { useEffect, useState } from "react";
import CommunityList from "./CommunityList";
import { Post } from "../types/post";
import { usePostStore } from "@/stores/usePostStore";


interface Props {
    initialPosts: Post[];
}

export default function CommunityContainer({ initialPosts }:Props) {
    const setPosts = usePostStore((state) => state.setPosts);

    useEffect(() => {
      setPosts(initialPosts);
    }, [initialPosts, setPosts]);

  return (
    <>
      <CommunityList />
    </>
  );
}