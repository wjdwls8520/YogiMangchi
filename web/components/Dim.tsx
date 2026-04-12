
interface DimProps {
  onClickDim?: () => void;
  isVisible?: boolean;
}

export default function Dim({ onClickDim, isVisible = false }: DimProps) {
  return (
    <div
      className={`fixed inset-0 z-[110] min-[1101px]:hidden bg-gray-950/50 backdrop-blur-sm transition-opacity duration-300 ease-out ${
        isVisible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      onClick={onClickDim}
    />
  );
}
