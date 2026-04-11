import { memo } from "react";
import { Masonry } from "react-plock";
import { motion, Variants } from "framer-motion";
import { Tweet } from "react-tweet";

export interface SocialTweet {
  id: string;
  tweet_id: string;
  tweet_url?: string;
  created_at?: string;
}

interface MasonryGridProps {
  tweets: SocialTweet[];
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.92, filter: 'blur(4px)' },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      type: 'spring',
      stiffness: 150,
      damping: 20,
      mass: 0.7,
      delay: Math.min(i * 0.06, 0.5),
    },
  }),
};

const MasonryGrid = memo(({ tweets }: MasonryGridProps) => {
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
            custom={index}
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="mb-6 break-inside-avoid relative group gpu-layer"
          >
            <motion.div
              className="relative p-2 overflow-hidden rounded-2xl h-full"
              style={{
                background: 'rgba(255, 255, 255, 0.8)',
                border: '2px solid rgba(0, 0, 0, 0.06)',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
              }}
              whileHover={{
                y: -6,
                boxShadow: '0 12px 40px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.06)',
                borderColor: 'rgba(0, 0, 0, 0.1)',
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              {/* Subtle gradient overlay */}
              <div
                className="absolute inset-0 pointer-events-none rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(245,196,0,0.03) 0%, transparent 50%, rgba(163,230,53,0.03) 100%)',
                }}
              />
              {/* Tweet embed – light theme */}
              <div className="relative z-0 w-full" data-theme="light">
                <Tweet id={tweet.tweet_id} />
              </div>
            </motion.div>
          </motion.div>
        )}
      />
    </div>
  );
});

export default MasonryGrid;
