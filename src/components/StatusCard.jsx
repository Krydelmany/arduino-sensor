import React from 'react';
import { motion } from 'framer-motion';

const StatusCard = ({ title, value, icon, status = 'default' }) => {
  // Definir cores baseadas no status
  const getStatusColors = () => {
    switch (status) {
      case 'success':
        return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700';
      case 'warning':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700';
      case 'error':
        return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700';
      case 'info':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
  };

  return (
    <motion.div 
      className={`flex items-center p-3 rounded-lg border ${getStatusColors()} transition-colors duration-200`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {icon && <div className="mr-3">{icon}</div>}
      <div>
        <div className="text-xs font-medium opacity-80">{title}</div>
        <div className="text-sm font-semibold">{value}</div>
      </div>
    </motion.div>
  );
};

export default StatusCard;
