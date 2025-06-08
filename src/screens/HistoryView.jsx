import React, { useState } from 'react';
import { motion } from 'framer-motion';

const HistoryView = ({ dataHistory, formatTemp, formatHum }) => {
  const [sortOrder, setSortOrder] = useState('newest');
  const [filter, setFilter] = useState('all');
  
  // Filtrar e ordenar os dados
  const processedData = [...dataHistory]
    .filter(item => {
      if (filter === 'all') return true;
      if (filter === 'high-temp' && item.temp > 25) return true;
      if (filter === 'low-temp' && item.temp < 25) return true;
      if (filter === 'high-hum' && item.hum > 60) return true;
      if (filter === 'low-hum' && item.hum < 40) return true;
      return false;
    })
    .sort((a, b) => {
      if (sortOrder === 'newest') {
        return b.timestamp - a.timestamp;
      } else {
        return a.timestamp - b.timestamp;
      }
    });

  // Animação da tabela e linhas
  const tableVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.05
      }
    }
  };

  const rowVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="bg-white dark:bg-dark-surface-light rounded-lg shadow-md overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-wrap gap-2">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Histórico de Detecções de Movimento</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Registros salvos automaticamente quando movimento é detectado</p>
        </div>
        
        <div className="flex space-x-2">
          <select 
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-surface-lighter text-gray-700 dark:text-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="newest">Mais recentes primeiro</option>
            <option value="oldest">Mais antigos primeiro</option>
          </select>
          
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-surface-lighter text-gray-700 dark:text-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Todos os registros</option>
            <option value="high-temp">Temperatura alta ({'>'}25°C)</option>
            <option value="low-temp">Temperatura baixa (&lt;25°C)</option>
            <option value="high-hum">Umidade alta ({'>'}60%)</option>
            <option value="low-hum">Umidade baixa (&lt;40%)</option>
          </select>
        </div>
      </div>
      
      <div className="overflow-x-auto max-h-[500px]">
        <motion.table 
          className="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
          variants={tableVariants}
          initial="hidden"
          animate="visible"
        >
          <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                #
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Data/Hora da Detecção
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Temperatura
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Umidade
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-dark-surface-light divide-y divide-gray-200 dark:divide-gray-700">
            {processedData.length === 0 ? (
              <motion.tr variants={rowVariants}>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  Nenhuma detecção de movimento registrada ainda.
                </td>
              </motion.tr>
            ) : (
              processedData.map((item, index) => (
                <motion.tr 
                  key={index} 
                  className={index % 2 === 0 ? 'bg-gray-50 dark:bg-dark-surface-lighter' : 'bg-white dark:bg-dark-surface-light'}
                  variants={rowVariants}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {item.count || (dataHistory.length - index)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div>
                      <div>{item.timestamp.toLocaleTimeString()}</div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">{item.timestamp.toLocaleDateString()}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
                      item.temp > 30 ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' : 
                      item.temp > 25 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                      'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                    }`}>
                      {formatTemp(item.temp)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
                      item.hum < 30 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' : 
                      item.hum > 70 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' :
                      'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                    }`}>
                      {formatHum(item.hum)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 inline-flex items-center text-sm leading-5 font-semibold rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300">
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Movimento
                    </span>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </motion.table>
      </div>
      
      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
        Total de detecções registradas: {processedData.length}
      </div>
    </motion.div>
  );
};

export default HistoryView;
