import { Masonry } from "react-plock";
import { motion } from "framer-motion";
import { Tweet } from "react-tweet";

interface MasonryGridProps {
  tweets: any[];
}

const MasonryGrid = ({ tweets }: MasonryGridProps) => {
  return (
    <div className="w-full">
      <Masonry
        items={tweets}
        config={{
          columns: [1, 2, 3, 4],
          gap: [24, 24, 24, 24],
          media: [640, 1024, 1280, 1536],
        }}
        render={(tweet, index) => (
          <motion.div
            key={tweet.id + index}
            layout
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25, delay: Math.min(index * 0.05, 0.4) }}
            className="mb-6 break-inside-avoid relative group"
          >
            <div className="relative glass-panel p-2 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_12px_40px_rgba(255,255,255,0.15)] overflow-hidden rounded-xl h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent pointer-events-none"></div>
              <div className="relative z-0 theme-dark w-full">
                 <Tweet id={tweet.tweet_id} />
              </div>
            </div>
          </motion.div>
        )}
      />
    </div>
  );
};

export default MasonryGrid;
