'use client';

import { type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';

type ChartTransitionProps = {
  children: ReactNode;
  /** Unique key that changes when chart data updates (e.g. date range) */
  transitionKey: string;
  className?: string;
};

/**
 * Wraps a chart with a smooth fade + slide transition
 * that triggers whenever the transitionKey changes.
 */
export function ChartTransition({ children, transitionKey, className }: ChartTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={transitionKey}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

type StaggerContainerProps = {
  children: ReactNode;
  className?: string;
  transitionKey?: string;
};

/**
 * Container that staggers children's entry animations.
 */
export function StaggerContainer({ children, className, transitionKey }: StaggerContainerProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={transitionKey}
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={{
          visible: {
            transition: { staggerChildren: 0.06 },
          },
          hidden: {},
        }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

type StaggerItemProps = {
  children: ReactNode;
  className?: string;
};

export function StaggerItem({ children, className }: StaggerItemProps) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
