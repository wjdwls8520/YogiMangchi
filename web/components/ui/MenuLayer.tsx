import { cn } from "@/lib/utils/cs";
import { X } from "lucide-react";
import { ReactNode } from "react";


interface Props {
    children: ReactNode;
    isOpen: boolean;
    close: () => void;

}

export default function MenuLayer({ children, isOpen, close }: Props) {

    return <div
              className={cn(
                "fixed inset-y-0 right-0 z-[120] w-72 max-w-[85vw] border-gray-100 bg-white shadow-2xl transition-all duration-300 ease-out dark:border-zinc-800 dark:bg-zinc-900 min-[1101px]:hidden",
                isOpen ? "translate-x-0" : "translate-x-full"
              )}
            >
              <div className="flex justify-end p-4">
                <button
                  type="button"
                  className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                  onClick={close}
                >
                  <X strokeWidth={2} size={24} />
                </button>
              </div>
              <div className="px-4">
                { children }
              </div>
            </div>
}