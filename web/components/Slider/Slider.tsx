import { cn } from "@/lib/utils/cs";
import { useEffect, useRef } from "react";

type SliderProps = {
  children: React.ReactNode;
  className?: string;
  useWheel?: boolean;
  useDrag?: boolean;
  snap?: boolean;
};


export default function Slider({
  children,
  className,
  useWheel = true,
  useDrag = true,
  snap = true,
}: SliderProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);

    const isDraggingRef = useRef(false);

    const isDownRef = useRef(false);
    const startXRef = useRef(0);
    const scrollLeftRef = useRef(0);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;


        // a태그 기본 드래그 동작 차단
        const onDragStart = (e: DragEvent) => e.preventDefault();
        
        const onWheel = (e: WheelEvent) => {

            if (!useWheel) return;
            if (e.deltaY === 0) return;

            e.preventDefault(); // 기본 스크롤 막기
            e.stopPropagation(); // 부모로 이벤트 전파 막기

            // Firefox는 deltaMode === 1 (라인 단위)이라 픽셀로 환산
            const delta = e.deltaMode === 1 ? e.deltaY * 30 : e.deltaY * 1

            // scroll : 절대 위치에서 이동, scrollBy : 상대 위치에서 이동
            el.scrollBy({
                left: delta,
                behavior: "smooth"
            });
        };


        // pointer down (마우스, 터치)
        const onPointerDown = (e: PointerEvent) => {
            if (!useDrag) return;

            isDownRef.current = true;
            isDraggingRef.current = false;

            startXRef.current = e.clientX;
            scrollLeftRef.current = el.scrollLeft;
        };

        const onPointerUp = () => {
            if (!useDrag) return;

            isDownRef.current = false;

            // 추가: 슬라이더 밖에서 손을 떼도 isDraggingRef 초기화
            setTimeout(() => {
                isDraggingRef.current = false;
            }, 0);
        };

        const onPointerMove = (e: PointerEvent) => {
            if (!useDrag || !isDownRef.current) return;

            const walk = e.clientX - startXRef.current;

            // 짧은 드래그는 스크롤 작동 안하게 함
            if (Math.abs(walk) > 10) {
                isDraggingRef.current = true;
            }

            el.scrollLeft = scrollLeftRef.current - walk;
        };        

        const onPointerCancel = (e: PointerEvent) => {
            isDownRef.current = false;
            isDraggingRef.current = false;
        };        

        if (useWheel) {
            el.addEventListener("wheel", onWheel, { passive: false });
        }

        if (useDrag) {
            el.addEventListener("dragstart", onDragStart);
            el.addEventListener("pointerdown", onPointerDown);

            // el → window로 변경
            window.addEventListener("pointermove", onPointerMove);
            window.addEventListener("pointerup", onPointerUp);
            window.addEventListener("pointercancel", onPointerCancel);

        }

        return () => {
            el.removeEventListener("dragstart", onDragStart); // 추가

            el.removeEventListener("wheel", onWheel);
            
            el.removeEventListener("pointerdown", onPointerDown);

            window.removeEventListener("pointermove", onPointerMove);
            window.removeEventListener("pointerup", onPointerUp);
            window.removeEventListener("pointercancel", onPointerCancel); 
        };
    }, [useWheel, useDrag]);


    return (
        <div
        ref={containerRef}
        className={cn(
            "overflow-x-auto flex snap-x snap-mandatory scrollbar-custom select-none",
            className
        )}
        onClickCapture={(e) => {
            if (isDraggingRef.current) {
            e.preventDefault();
            e.stopPropagation();
            }

            // 클릭 막은 후 초기화
            isDraggingRef.current = false;
        }}        
        >
        {children}
        </div>
    );
}