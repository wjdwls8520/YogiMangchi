
interface DimProps {
  onClickDim?: () => void;
}

export default function Dim({ onClickDim }: DimProps) {
    return (
        <div className="dim fixed left-0 top-0 z-49 bg-gray-950 opacity-50 w-full h-full md:hidden block backdrop-blur-sm" onClick={onClickDim}></div>
    )
}