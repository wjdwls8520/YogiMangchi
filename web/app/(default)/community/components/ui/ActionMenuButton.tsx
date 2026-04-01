import { BsThreeDots } from "react-icons/bs";

interface Props {
    toggleMenu: (e: React.MouseEvent) => void;
}

export default function ActionMenuButton ({ toggleMenu }: Props) {

    return <button type="button" className="p-1.5" onClick={toggleMenu}>
        <BsThreeDots className="justify-self-end-safe text-gray-500" />
    </button>
}