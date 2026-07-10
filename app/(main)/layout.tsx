import { TopNav } from "@/components/layout/TopNav";
import { SearchShortcut } from "@/components/layout/SearchShortcut";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SearchShortcut />
      <TopNav />
      <div className="flex flex-1 flex-col">{children}</div>
    </>
  );
}
