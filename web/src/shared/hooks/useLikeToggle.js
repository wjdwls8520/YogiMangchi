import { useState, useCallback } from 'react';

export const useLikeToggle = (initialCount = 0, initialLiked = false) => {
    const [isLiked, setIsLiked] = useState(initialLiked);
    const [likeCount, setLikeCount] = useState(initialCount);

    const toggleLike = useCallback((e) => {
        if (e && e.stopPropagation) {
            e.stopPropagation();
        }

        setIsLiked(prev => {
            const newState = !prev;
            setLikeCount(count => newState ? count + 1 : count - 1);
            return newState;
        });

        // Here you would typically trigger an API call
        // api.toggleLike(id, ...).catch(() => revertState());
    }, []);

    return { isLiked, likeCount, toggleLike };
};
