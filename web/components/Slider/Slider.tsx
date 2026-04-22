import { cn } from "@/lib/utils/cs";
import { useEffect, useRef } from "react";

type SliderProps = {
  children: React.ReactNode;
  className?: string;
  useWheel?: boolean;
  useDrag?: boolean;
  snap?: "mandatory" | "proximity" | false;
};


export default function Slider({
  children,
  className,
  useWheel = true,
  useDrag = true,
  snap = "mandatory",
}: SliderProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);

    const isDraggingRef = useRef(false);
    const momentumAnimationRef = useRef<number | null>(null);
    const momentumVelocityRef = useRef(0);
    const momentumLastFrameTimeRef = useRef(0);

    const isDownRef = useRef(false);
    const startXRef = useRef(0);
    const scrollLeftRef = useRef(0);
    const lastPointerXRef = useRef(0);
    const lastPointerTimeRef = useRef(0);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const stopMomentum = () => {
            if (momentumAnimationRef.current !== null) {
                window.cancelAnimationFrame(momentumAnimationRef.current);
                momentumAnimationRef.current = null;
            }
        };

        const startMomentum = () => {
            if (Math.abs(momentumVelocityRef.current) < 0.05) {
                momentumVelocityRef.current = 0;
                return;
            }

            stopMomentum();
            momentumLastFrameTimeRef.current = performance.now();

            const animate = (timestamp: number) => {
                const frameDuration = timestamp - momentumLastFrameTimeRef.current;
                momentumLastFrameTimeRef.current = timestamp;

                el.scrollLeft += momentumVelocityRef.current * frameDuration;
                momentumVelocityRef.current *= Math.pow(0.5, frameDuration / 16.67);//멈춤속도 조절

                if (Math.abs(momentumVelocityRef.current) < 0.02) {
                    momentumVelocityRef.current = 0;
                    momentumAnimationRef.current = null;
                    return;
                }

                momentumAnimationRef.current = window.requestAnimationFrame(animate);
            };

            momentumAnimationRef.current = window.requestAnimationFrame(animate);
        };

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
            if (e.pointerType === "mouse" && e.button !== 0) return;

            stopMomentum();
            isDownRef.current = true;
            isDraggingRef.current = false;
            momentumVelocityRef.current = 0;

            startXRef.current = e.clientX;
            scrollLeftRef.current = el.scrollLeft;
            lastPointerXRef.current = e.clientX;
            lastPointerTimeRef.current = performance.now();

            el.style.cursor = "grabbing";
            el.setPointerCapture?.(e.pointerId);
            e.preventDefault();
        };

        const onPointerUp = (e: PointerEvent) => {
            if (!useDrag) return;

            isDownRef.current = false;
            el.style.cursor = "grab";
            el.releasePointerCapture?.(e.pointerId);
            startMomentum();

            // 추가: 슬라이더 밖에서 손을 떼도 isDraggingRef 초기화
            setTimeout(() => {
                isDraggingRef.current = false;
            }, 0);
        };

        const onPointerMove = (e: PointerEvent) => {
            if (!useDrag || !isDownRef.current) return;

            const walk = e.clientX - startXRef.current;
            const currentTime = performance.now();
            const pointerDelta = e.clientX - lastPointerXRef.current;
            const timeDelta = Math.max(currentTime - lastPointerTimeRef.current, 1);

            // 짧은 드래그는 스크롤 작동 안하게 함
            if (Math.abs(walk) > 10) {
                isDraggingRef.current = true;
            }

            el.scrollLeft = scrollLeftRef.current - walk;
            momentumVelocityRef.current = (-pointerDelta / timeDelta) * 3; //넘어가는 속도 조절
            lastPointerXRef.current = e.clientX;
            lastPointerTimeRef.current = currentTime;
            e.preventDefault();
        };        

        const onPointerCancel = (e: PointerEvent) => {
            isDownRef.current = false;
            isDraggingRef.current = false;
            el.style.cursor = "grab";
            el.releasePointerCapture?.(e.pointerId);
            startMomentum();
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
            stopMomentum();
            el.removeEventListener("dragstart", onDragStart); // 추가

            el.removeEventListener("wheel", onWheel);
            
            el.removeEventListener("pointerdown", onPointerDown);
            el.style.cursor = "";

            window.removeEventListener("pointermove", onPointerMove);
            window.removeEventListener("pointerup", onPointerUp);
            window.removeEventListener("pointercancel", onPointerCancel); 
        };
    }, [useWheel, useDrag]);


    return (
        <div
        ref={containerRef}
        className={cn(
            "flex overflow-x-auto scrollbar-custom select-none touch-pan-x cursor-grab",
            snap === "mandatory" && "snap-x snap-mandatory",
            snap === "proximity" && "snap-x snap-proximity",
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
