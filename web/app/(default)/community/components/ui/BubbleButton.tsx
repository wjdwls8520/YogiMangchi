import { MessageCircle } from "lucide-react";
import { ReactNode } from "react";


interface Props {
    openComments?: () => void;
    children: ReactNode
}


export default function BubbleButton({ children, openComments }: Props) {

    return <>
        <button type="button" className="flex items-center gap-1" onClick={openComments}>
            <MessageCircle strokeWidth={2} size={18} />
            {children}
        </button>    
    </>
}