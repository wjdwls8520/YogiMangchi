import { ReactNode, useEffect } from "react";
import Button from "./ui/Button";
import { X } from "lucide-react";


interface ModalInfo {
    title :string;
    onClose :() => void;
    isSubmit: boolean;
    closeOnDimClick?: boolean;
}


interface ModalProps {
    props :ModalInfo;
    children :ReactNode;
}

export default function Modal({ props, children } :ModalProps) {
    // 모달 오픈 시 배경 스크롤 방지
    useEffect(() => {
        const originalStyle = window.getComputedStyle(document.body).overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = originalStyle;
        };
    }, []);

    // dim 영역 클릭 시 modal 꺼짐
    const onDimClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (
          props.closeOnDimClick !== false &&
          e.target instanceof HTMLElement &&
          e.target.id === 'layerDim'
        ) {
            props.onClose();
        }
    }

    return(
    <div id="layerDim" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/0 p-4 backdrop-blur-sm"
        onClick={onDimClick}>
      <div className="w-full max-w-xl bg-white dark:bg-zinc-900 overflow-hidden rounded-3xl shadow-2xl">
        
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{props.title}</h2>
          <button onClick={props.onClose}>
             <X strokeWidth={2} size={24} />
          </button>
        </div>

        <div className="p-6">
            { children }
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 dark:border-gray-700 px-6 py-4">
          <Button onClick={props.onClose} variant="ghost" size="sm" >
            취소
          </Button>
          {
            props.isSubmit &&
            <Button type="submit" variant="ghost" size="sm">
              게시
            </Button>          
          }
        </div>
        
      </div>
    </div>
    )
}
