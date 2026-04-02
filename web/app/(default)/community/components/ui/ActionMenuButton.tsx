import { Ellipsis } from "lucide-react";


interface Props {
    toggleMenu: (e: React.MouseEvent) => void;
}

export default function ActionMenuButton ({ toggleMenu }: Props) {

    return <button type="button" className="p-1.5" onClick={toggleMenu}>
        <Ellipsis strokeWidth={1.5} className="justify-self-end-safe text-gray-500" />
    </button>
}