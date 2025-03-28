import React from 'react';
import SerialControl from '../components/SerialControl';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
// import logoLight from '../assets/images.png'; // logos do projeto
// import logoDark from '../assets/imagesdark.png';

const ConnectionScreen = ({ onContinue }) => {
  const { darkMode } = useTheme();
  
  // Animação para os elementos entrarem na tela
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 min-h-screen">
      <motion.div 
        className="bg-white dark:bg-dark-surface-light p-8 rounded-lg shadow-lg w-full max-w-4xl"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Cabeçalho */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row items-center justify-between mb-8">
          <div className="mb-4 md:mb-0">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              Monitor de Sensores Arduino
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Interface para visualização de dados de temperatura e umidade
            </p>
          </div>
          
          {/* <img 
            src={darkMode ? logoDark : logoLight} 
            alt="Arduino Sensor Logo" 
            className="h-16 w-auto" 
          /> */}
        </motion.div>
        
        {/* Instruções */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md border-l-4 border-blue-500">
            <h2 className="text-lg font-semibold text-blue-700 dark:text-blue-300 mb-2">
              Instruções de Conexão
            </h2>
            <ul className="list-disc pl-5 text-blue-600 dark:text-blue-200 text-sm space-y-1">
              <li>Conecte seu Arduino via cabo USB ao computador</li>
              <li>Certifique-se de que o programa de leitura de sensores esteja carregado no Arduino</li>
              <li>Selecione a porta serial correspondente ao seu dispositivo</li>
              <li>Clique em "Conectar" e aguarde o estabelecimento da conexão</li>
              <li>Uma vez conectado, clique em "Continuar" para visualizar os dados</li>
            </ul>
          </div>
        </motion.div>
        
        {/* Controle de Conexão */}
        <motion.div variants={itemVariants}>
          <SerialControl onConnectionSuccess={onContinue} />
        </motion.div>
        
        {/* Rodapé */}
        <motion.div variants={itemVariants} className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400 flex justify-between items-center">
          <span>
            Versão {import.meta.env.VITE_APP_VERSION || '0.1.0'}
          </span>
          <a 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              window.open('https://github.com/krydelmany/arduino-sensor', '_blank');
            }}
            className="text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Documentação
          </a>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ConnectionScreen;
