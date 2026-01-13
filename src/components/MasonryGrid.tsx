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
          columns: [1, 2, 3],
          gap: [24, 24, 24],
          media: [640, 1024, 1280],
        }}
        render={(tweet) => (
          <motion.div
            key={tweet.id}
            layout // Enables the sideways shift animation
            initial={{ opacity: 0, scale: 0.8, x: -50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="mb-6 break-inside-avoid relative group"
          >
            <div className="relative bg-[#FDF5E6] p-1 rounded-sm shadow-[5px_5px_15px_rgba(0,0,0,0.5)] transition-transform duration-300 hover:scale-[1.02] hover:-rotate-1">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-50 mix-blend-multiply pointer-events-none z-10"></div>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 w-4 h-4 rounded-full bg-[#8B4513] shadow-[2px_2px_4pxrgba(0,0,0,0.5),inset-1px_-1px_2px_rgba(255,255,255,0.3)]"></div>
              <div className="relative z-0 theme-custom">
                 <Tweet id={tweet.tweet_id} />
              </div>
              <div className="mt-2 border-t-2 border-[#8B4513] border-dashed pt-2 flex justify-between items-center opacity-70">
                <span className="font-western text-[#8B4513] text-xs tracking-widest">WANTED</span>
                <span className="font-mono text-[#5D4037] text-[10px]">{new Date(tweet.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </motion.div>
        )}
      />
    </div>
  );
};

export default MasonryGrid;
