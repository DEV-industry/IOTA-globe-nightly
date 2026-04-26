import { motion } from 'framer-motion';
import { IotaLogo } from './IotaLogo';

export function GlobalLoader() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0a0f]"
    >
      <div className="animate-pulse scale-150">
        <IotaLogo />
      </div>
    </motion.div>
  );
}
