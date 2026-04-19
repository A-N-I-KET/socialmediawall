import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Trophy, Gift, MessageSquare, Rocket } from 'lucide-react';

const navItems = [
  { id: 'hero-section', icon: Sparkles, label: 'Home' },
  { id: 'prizes-section', icon: Trophy, label: 'Prizes' },
  { id: 'offerings-section', icon: Gift, label: 'Offerings' },
  { id: 'projects-section', icon: Rocket, label: 'Projects' },
  { id: 'social-wall-section', icon: MessageSquare, label: 'Live Feed' },
];

export const FloatingNav = () => {
  const [activeSection, setActiveSection] = useState('hero-section');

  useEffect(() => {
    const handleScroll = () => {
      const sections = navItems.map((item) => document.getElementById(item.id));
      const scrollPosition = window.scrollY + window.innerHeight / 3;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(navItems[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 40,
        behavior: 'smooth',
      });
    }
  };

  return (
    <motion.nav
      className="fixed z-[150] flex 
                 md:flex-col flex-row 
                 md:top-40 md:left-6 md:right-auto md:bottom-auto
                 bottom-6 left-0 right-0 mx-auto w-max
                 bg-white/70 backdrop-blur-xl border-2 border-black/5 
                 rounded-full p-2 gap-3 md:gap-4 shadow-[0_8px_32px_rgba(0,0,0,0.06)]"
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.5 }}
    >
      {navItems.map((item) => {
        const isActive = activeSection === item.id;
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            onClick={() => scrollToSection(item.id)}
            className="group relative flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full transition-all duration-300"
            aria-label={item.label}
          >
            {/* Background pill for active state */}
            {isActive && (
              <motion.div
                layoutId="activeNavIndicator"
                className="absolute inset-0 bg-black/5 rounded-full"
                initial={false}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}

            {/* Icon */}
            <Icon
              strokeWidth={isActive ? 2.5 : 1.5}
              className={`relative z-10 w-5 h-5 md:w-6 md:h-6 transition-colors duration-300 ${
                isActive ? 'text-black' : 'text-black/40 group-hover:text-black/70'
              }`}
            />

            {/* Tooltip (Desktop only) */}
            <div className="absolute left-full ml-4 px-3 py-1.5 bg-black text-white text-xs font-semibold rounded-md opacity-0 -translate-x-2 pointer-events-none transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 hidden md:block whitespace-nowrap shadow-lg">
              {item.label}
              {/* Tooltip Arrow */}
              <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-black rotate-45" />
            </div>
          </button>
        );
      })}
    </motion.nav>
  );
};
