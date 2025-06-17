
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface WelcomeAnimationProps {
  onComplete: () => void;
}

const WelcomeAnimation = ({ onComplete }: WelcomeAnimationProps) => {
  const [showAnimation, setShowAnimation] = useState(true);

  useEffect(() => {
    // Check if we've shown the animation before in this session
    const hasSeenAnimation = sessionStorage.getItem("hasSeenWelcomeAnimation");
    
    if (hasSeenAnimation) {
      setShowAnimation(false);
      onComplete();
    } else {
      // Set timeout to auto-dismiss after 4 seconds
      const timer = setTimeout(() => {
        setShowAnimation(false);
        onComplete();
        sessionStorage.setItem("hasSeenWelcomeAnimation", "true");
      }, 4000);
      
      return () => clearTimeout(timer);
    }
  }, [onComplete]);

  if (!showAnimation) return null;

  return (
    <AnimatePresence>
      {showAnimation && (
        <motion.div 
          className="fixed inset-0 z-50 bg-persian-navy flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="text-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            transition={{ 
              duration: 0.8,
              type: "spring",
              stiffness: 100
            }}
          >
            <motion.img 
              src="/lovable-uploads/5ea03860-8007-4752-8192-07b57fb57e63.png" 
              alt="Samarkand Logo" 
              className="h-32 w-32 mx-auto mb-4"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            />
            
            <motion.h1 
              className="text-4xl font-bold text-persian-gold mb-2 font-playfair"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              Welcome to Samarkand
            </motion.h1>
            
            <motion.p 
              className="text-xl text-gray-200 font-spectral italic"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              A journey through exquisite flavors of Central Asia
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WelcomeAnimation;
