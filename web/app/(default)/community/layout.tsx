import FloatMenu from "./components/FloatMenu";
import ReportModal from "./components/ReportModal";
import WriteModalWrapper from "./components/WriteModalWrapper";
import Top5Wrapper from "./components/Top5Wrapper";

export default async function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <section className="relative mx-auto max-w-5xl lg:flex lg:items-start lg:gap-14">
        <div className="w-full min-w-0 lg:flex-1">
          {children}
        </div>
        <div className="hidden lg:block lg:w-90 lg:shrink-0">
          <Top5Wrapper />
        </div>
        <FloatMenu />
        <WriteModalWrapper />
        <ReportModal />
      </section>
    </>
  );
}
