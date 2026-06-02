import { Video } from "@/types";
import VideoCard from "./VideoCard";

export default function VideoGrid({ videos, title, subtitle }: { videos: Video[]; title?: string; subtitle?: string }) {
  return (
    <section>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h2 className="text-xl font-bold text-gray-800">{title}</h2>}
          {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {videos.map((v, i) => (
          <VideoCard key={v.id} video={v} index={i} />
        ))}
      </div>
    </section>
  );
}
