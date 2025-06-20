import React, { useState, useEffect, useRef } from 'react';
import HistoryView from './HistoryView';
import { motion } from 'framer-motion';

const SensorDashboard = ({ connectionInfo, onBackToConnection }) => {
  const [sensorData, setSensorData] = useState({ temp: 25, hum: 50, count: 0, presc: 0 });
  const [dataHistory, setDataHistory] = useState([]);
  const [isConnected, setIsConnected] = useState(true);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [motionStats, setMotionStats] = useState({ totalDetections: 0, lastDetection: null });
  const maxHistoryLength = 100;

  // Para desmontar os listeners quando o componente for desmontado
  const dataListenerRef = useRef(null);
  const connectionListenerRef = useRef(null);

  useEffect(() => {
    // Configurar ouvintes para receber dados e mudanças de conexão
    dataListenerRef.current = window.electronAPI.onReceive((data) => {
      try {
        // Tentar analisar os dados como JSON
        let parsedData;
        try {
          parsedData = JSON.parse(data);
        } catch (e) {
          // Se não for JSON, verificar se é um formato legível com regex
          const tempMatch = data.match(/Temperatura:\s*(\d+\.?\d*)/);
          const humMatch = data.match(/Umidade:\s*(\d+\.?\d*)/);
          const countMatch = data.match(/Leitura n°:\s*(\d+)/);
          const prescMatch = data.match(/Presenca:\s*(\d+)/);
          
          if (tempMatch && humMatch) {
            parsedData = {
              temp: parseFloat(tempMatch[1]),
              hum: parseFloat(humMatch[1]),
              count: countMatch ? parseInt(countMatch[1]) : 0,
              presc: prescMatch ? parseInt(prescMatch[1]) : 0
            };
          } else {
            console.log("Dados recebidos (não parseable):", data);
            return;
          }
        }
        
        // Atualizar o estado apenas quando houver movimento detectado
        if (parsedData.presc === 1) {
          // Atualizar todos os dados quando movimento é detectado
          setSensorData(parsedData);
          
          // Salvar no histórico
          const newEntry = { ...parsedData, timestamp: new Date() };
          setDataHistory(prev => {
            const newHistory = [...prev, newEntry];
            return newHistory.slice(-maxHistoryLength);
          });
          
          // Atualizar estatísticas de movimento
          setMotionStats(prev => ({
            totalDetections: prev.totalDetections + 1,
            lastDetection: new Date()
          }));
        } else {
          // Quando não há movimento, atualizar apenas o status de presença e contador
          setSensorData(prev => ({
            ...prev,
            presc: parsedData.presc,
            count: parsedData.count
          }));
        }
        
        // Limpar qualquer erro anterior
        setError(null);
      } catch (err) {
        console.error("Erro ao processar dados:", err, "Dados recebidos:", data);
        setError("Erro ao processar dados do sensor");
      }
    });

    connectionListenerRef.current = window.electronAPI.onConnectionChange((connected) => {
      setIsConnected(connected);
      if (!connected) {
        setError("Conexão com o Arduino perdida");
      } else {
        setError(null);
      }
    });

    // Cleanup dos listeners ao desmontar
    return () => {
      if (dataListenerRef.current) dataListenerRef.current();
      if (connectionListenerRef.current) connectionListenerRef.current();
    };
  }, []);

  // Determina a cor do indicador baseado na temperatura
  const getTempColorClass = (temp) => {
    if (temp < 10) return "from-blue-500 to-blue-300";
    if (temp < 20) return "from-green-500 to-green-300";
    if (temp < 30) return "from-yellow-500 to-yellow-300";
    return "from-red-500 to-red-300";
  };

  // Determina a cor do indicador baseado na umidade
  const getHumColorClass = (hum) => {
    if (hum < 30) return "from-yellow-500 to-amber-300"; // seco
    if (hum < 60) return "from-green-500 to-emerald-300"; // ideal
    return "from-blue-500 to-cyan-300"; // úmido
  };

  // Formatar os valores para exibição
  const formatTemp = (temp) => {
    return typeof temp === 'number' ? `${temp.toFixed(1)}°C` : temp;
  };
  
  const formatHum = (hum) => {
    return typeof hum === 'number' ? `${hum.toFixed(1)}%` : hum;
  };

  const renderDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
      {/* Card da Temperatura */}
      <motion.div 
        className="bg-white dark:bg-dark-surface-light rounded-xl shadow-lg overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className={`h-3 bg-gradient-to-r ${getTempColorClass(sensorData.temp)}`}></div>
        <div className="p-6">
          <div className="flex items-center mb-6">
            <div className="relative">
              <motion.div 
                className="w-20 h-20 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <svg className="w-10 h-10 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </motion.div>
              
              <motion.div 
                className="absolute -inset-1 rounded-full border-2 border-red-200 dark:border-red-800 opacity-75"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              ></motion.div>
            </div>
            
            <div className="ml-6">
              <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300">Temperatura</h3>
              <div className="flex items-baseline">
                <motion.span 
                  className="text-5xl font-bold text-gray-800 dark:text-white" 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key={sensorData.temp}
                >
                  {formatTemp(sensorData.temp)}
                </motion.span>
              </div>
            </div>
          </div>
          
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div 
              className={`h-full bg-gradient-to-r ${getTempColorClass(sensorData.temp)}`} 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(Math.max(sensorData.temp, 0), 50) * 2}%` }}
              transition={{ duration: 1 }}
            ></motion.div>
          </div>
          
          <div className="mt-2 flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>0°C</span>
            <span>25°C</span>
            <span>50°C</span>
          </div>
        </div>
      </motion.div>

      {/* Card da Umidade */}
      <motion.div 
        className="bg-white dark:bg-dark-surface-light rounded-xl shadow-lg overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className={`h-3 bg-gradient-to-r ${getHumColorClass(sensorData.hum)}`}></div>
        <div className="p-6">
          <div className="flex items-center mb-6">
            <div className="relative">
              <motion.div 
                className="w-20 h-20 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 5, repeat: Infinity }}
              >
                <svg className="w-10 h-10 text-blue-500 dark:text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3.571c3.658 5.437 6 9.223 6 12.503 0 3.268-2.691 5.926-6 5.926s-6-2.658-6-5.925c0-3.281 2.342-7.066 6-12.504zm0-3.571c-4.87 7.197-8 11.699-8 16.075 0 4.378 3.579 7.925 8 7.925s8-3.547 8-7.925c0-4.376-3.13-8.878-8-16.075z"/>
                </svg>
              </motion.div>
              
              <motion.div 
                className="absolute -top-1 right-0 w-3 h-3 rounded-full bg-blue-300 dark:bg-blue-500"
                animate={{ 
                  y: [0, 15, 30],
                  opacity: [1, 0.8, 0],
                  scale: [1, 0.8, 0.6]
                }}
                transition={{ duration: 2, repeat: Infinity, repeatType: "loop" }}
              ></motion.div>
              <motion.div 
                className="absolute -top-2 left-2 w-2 h-2 rounded-full bg-blue-300 dark:bg-blue-500"
                animate={{ 
                  y: [0, 10, 20],
                  opacity: [1, 0.8, 0],
                  scale: [1, 0.8, 0.6]
                }}
                transition={{ duration: 1.5, repeat: Infinity, repeatType: "loop", delay: 0.5 }}
              ></motion.div>
            </div>
            
            <div className="ml-6">
              <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300">Umidade</h3>
              <div className="flex items-baseline">
                <motion.span 
                  className="text-5xl font-bold text-gray-800 dark:text-white" 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key={sensorData.hum}
                >
                  {formatHum(sensorData.hum)}
                </motion.span>
              </div>
            </div>
          </div>
          
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div 
              className={`h-full bg-gradient-to-r ${getHumColorClass(sensorData.hum)}`} 
              initial={{ width: 0 }}
              animate={{ width: `${sensorData.hum}%` }}
              transition={{ duration: 1 }}
            ></motion.div>
          </div>
          
          <div className="mt-2 flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
      </motion.div>

      {/* Card do Detector de Movimento */}
      <motion.div 
        className="bg-white dark:bg-dark-surface-light rounded-xl shadow-lg overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <div className={`h-3 bg-gradient-to-r ${sensorData.presc === 1 ? 'from-orange-500 to-red-500' : 'from-gray-400 to-gray-300'}`}></div>
        <div className="p-6">
          <div className="flex items-center mb-6">
            <div className="relative">
              <motion.div 
                className={`w-20 h-20 flex items-center justify-center rounded-full ${
                  sensorData.presc === 1 
                    ? 'bg-orange-100 dark:bg-orange-900/20' 
                    : 'bg-gray-100 dark:bg-gray-900/20'
                }`}
                animate={sensorData.presc === 1 ? { 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                } : { scale: 1 }}
                transition={{ duration: 0.5, repeat: sensorData.presc === 1 ? Infinity : 0 }}
              >
                <svg className={`w-10 h-10 ${
                  sensorData.presc === 1 
                    ? 'text-orange-500 dark:text-orange-400' 
                    : 'text-gray-400 dark:text-gray-500'
                }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </motion.div>
              
              {sensorData.presc === 1 && (
                <motion.div 
                  className="absolute -inset-2 rounded-full border-2 border-orange-300 dark:border-orange-600"
                  animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                ></motion.div>
              )}
            </div>
            
            <div className="ml-6">
              <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300">Movimento</h3>
              <div className="flex items-baseline">
                <motion.span 
                  className={`text-3xl font-bold ${
                    sensorData.presc === 1 
                      ? 'text-orange-600 dark:text-orange-400' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key={sensorData.presc}
                >
                  {sensorData.presc === 1 ? 'DETECTADO' : 'NÃO DETECTADO'}
                </motion.span>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
              <span>Total de detecções:</span>
              <span className="font-semibold">{motionStats.totalDetections}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
              <span>Última detecção:</span>
              <span className="font-semibold">
                {motionStats.lastDetection 
                  ? motionStats.lastDetection.toLocaleTimeString() 
                  : 'Nenhuma'
                }
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Informações Gerais */}
      <motion.div 
        className="md:col-span-3 bg-white dark:bg-dark-surface-light p-4 rounded-lg shadow-md text-center text-gray-500 dark:text-gray-400 text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <div className="flex justify-center items-center space-x-6">
          <div>
            Última leitura: {new Date().toLocaleTimeString()}
            <span className="ml-2 inline-block w-2 h-2 rounded-full bg-green-500"></span>
          </div>
          <div>
            Registros salvos: {dataHistory.length}
          </div>
          <div>
            Status: {sensorData.presc === 1 ? 'Monitorando movimento' : 'Aguardando movimento'}
          </div>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            {activeView === 'dashboard' ? 'Monitor com Detector de Movimento' : 'Histórico de Detecções'}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Os dados são salvos automaticamente quando movimento é detectado
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveView('dashboard')}
            className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
              activeView === 'dashboard' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveView('history')}
            className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
              activeView === 'history' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200'
            }`}
          >
            Histórico ({dataHistory.length})
          </button>
          <button
            onClick={onBackToConnection}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>

      {error && (
        <motion.div 
          className="bg-red-100 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 mb-6" 
          role="alert"
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
        >
          <p>{error}</p>
          {!isConnected && (
            <button 
              onClick={onBackToConnection}
              className="mt-2 px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600"
            >
              Reconectar
            </button>
          )}
        </motion.div>
      )}

      {activeView === 'dashboard' ? (
        renderDashboard()
      ) : (
        <HistoryView dataHistory={dataHistory} formatTemp={formatTemp} formatHum={formatHum} />
      )}
    </div>
  );
};

export default SensorDashboard;
