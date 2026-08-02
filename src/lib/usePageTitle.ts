import { useEffect } from "react";

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} | JohnWeb` : "JohnWeb - Zambian ECZ Past Papers";
  }, [title]);
}
