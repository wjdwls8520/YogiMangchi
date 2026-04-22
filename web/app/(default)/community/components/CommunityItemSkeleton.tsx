export default function CommunityItemSkeleton() {
  return (
    <div className="card animate-pulse">
      
      {/* header */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-gray-200" />
        <div className="flex flex-col gap-2">
          <div className="w-24 h-3 bg-gray-200 rounded" />
          <div className="w-16 h-3 bg-gray-200 rounded" />
        </div>
      </div>

      {/* title */}
      <div className="w-1/2 h-5 bg-gray-200 rounded mt-4" />

      {/* content */}
      <div className="space-y-2 mt-3">
        <div className="w-full h-3 bg-gray-200 rounded" />
        <div className="w-full h-3 bg-gray-200 rounded" />
        <div className="w-2/3 h-3 bg-gray-200 rounded" />
      </div>

      {/* image */}
      <div className="flex gap-2 mt-4">
        <div className="w-[40%] h-[120px] bg-gray-200 rounded-xl" />
        <div className="w-[40%] h-[120px] bg-gray-200 rounded-xl" />
      </div>

      {/* footer */}
      <div className="flex gap-4 mt-4">
        <div className="w-10 h-3 bg-gray-200 rounded" />
        <div className="w-10 h-3 bg-gray-200 rounded" />
        <div className="w-10 h-3 bg-gray-200 rounded" />
      </div>

    </div>
  );
}
