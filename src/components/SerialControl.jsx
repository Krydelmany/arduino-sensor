import React, { useState, useEffect } from 'react';

const SerialControl = ({ onConnectionSuccess }) => {
  const [ports, setPorts] = useState([]);
  const [selectedPort, setSelectedPort] = useState('');
  const [baudRate, setBaudRate] = useState('9600');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [message, setMessage] = useState('');
  const [receivedData, setReceivedData] = useState([]);
  const [sendText, setSendText] = useState('');
  
  const baudRates = [
    '9600', '14400', '19200', '38400', '57600', '115200'
  ];

  // Definir hasPersistentError a partir da mensagem
  const hasPersistentError = message.includes('Unknown error code 31');

  // Listar portas disponíveis
  const refreshPorts = async () => {
    try {
      setMessage('Buscando portas disponíveis...');
      const availablePorts = await window.electronAPI.listPorts();
      setPorts(availablePorts);
      
      if (availablePorts.length > 0 && !selectedPort) {
        setSelectedPort(availablePorts[0].path);
      }
      
      if (availablePorts.length === 0) {
        setMessage('Nenhuma porta serial encontrada. Verifique se o dispositivo está conectado.');
      } else {
        setMessage(`${availablePorts.length} porta(s) encontrada(s).`);
      }
    } catch (error) {
      setMessage(`Erro ao buscar portas: ${error.message}`);
    }
  };

  // Modifique o método toggleConnection para incluir mais tratamentos de erro
  const toggleConnection = async (forceReconnect = false) => {
    if (isConnecting) return; // Evitar múltiplos cliques

    try {
      setIsConnecting(true);
      
      if (isConnected && !forceReconnect) {
        setMessage('Desconectando...');
        const result = await window.electronAPI.disconnect();
        setMessage(result.message);
        
        // Mesmo após desconectar, aguardar um tempo para garantir
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        if (!selectedPort) {
          setMessage('Selecione uma porta serial primeiro.');
          setIsConnecting(false);
          return;
        }
        
        // Se já estiver conectado e forceReconnect for true, desconecte primeiro
        if (isConnected && forceReconnect) {
          setMessage('Reconectando (isto pode levar alguns segundos)...');
          await window.electronAPI.disconnect();
          // Aguardar mais tempo para garantir liberação da porta
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
        setMessage(`Iniciando conexão com ${selectedPort}...`);
        const result = await window.electronAPI.connect(selectedPort, baudRate);
        
        if (!result.success && result.message.includes('Unknown error code 31')) {
          setMessage('Erro de porta ocupada, tentando método alternativo...');
          // Tenta novamente após esperar mais tempo
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          const secondResult = await window.electronAPI.connect(selectedPort, baudRate);
          setMessage(secondResult.message);
        } else {
          setMessage(result.message);
        }
      }
    } catch (error) {
      setMessage(`Erro: ${error.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  // Adicione um método para fechar e reiniciar o aplicativo - útil em casos de erro persistente
  const resetApplication = () => {
    if (window.confirm('Isso irá fechar e reiniciar o aplicativo. Continuar?')) {
      window.electronAPI.resetApp?.() || window.location.reload();
    }
  };

  // Adicionar função para reset do Arduino
  const resetArduino = async () => {
    try {
      setMessage('Fazendo reset do Arduino...');
      const result = await window.electronAPI.resetArduino();
      setMessage(result.message);
    } catch (error) {
      setMessage(`Erro no reset: ${error.message}`);
    }
  };

  // Enviar dados para o Arduino
  const sendData = async () => {
    if (!sendText.trim() || !isConnected) return;
    
    try {
      setMessage('Enviando comando...');
      const result = await window.electronAPI.send(sendText);
      setMessage(result.message);
      
      if (result.success) {
        setSendText('');
      }
    } catch (error) {
      setMessage(`Erro ao enviar: ${error.message}`);
    }
  };

  // Limpar dados recebidos
  const clearData = () => {
    setReceivedData([]);
    setMessage('Dados limpos.');
  };

  // Efeito para configurar os listeners quando o componente monta
  useEffect(() => {
    refreshPorts();

    // Ouvir dados recebidos
    const removeDataListener = window.electronAPI.onReceive((data) => {
      setReceivedData(prev => [...prev, { time: new Date().toLocaleTimeString(), data }]);
    });

    // Ouvir mudanças de estado da conexão
    const removeConnectionListener = window.electronAPI.onConnectionChange((connected) => {
      setIsConnected(connected);
      setIsConnecting(false);
    });

    return () => {
      removeDataListener();
      removeConnectionListener();
    };
  }, []);

  // Função para prosseguir para o dashboard
  const handleContinue = () => {
    if (isConnected && onConnectionSuccess) {
      onConnectionSuccess({
        port: selectedPort,
        baudRate: baudRate
      });
    }
  };

  // Adicione um botão de reconexão forçada quando houver erro
  const renderConnectionButton = () => {
    const hasError = message.includes('Erro');
    
    return (
      <div className="flex flex-wrap mb-4 gap-2">
        <button
          onClick={() => toggleConnection(false)}
          disabled={isConnecting}
          className={`flex-grow px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
            isConnected 
              ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
              : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50`}
        >
          {isConnecting 
            ? 'Processando...' 
            : isConnected 
              ? 'Desconectar' 
              : 'Conectar'
          }
        </button>
        
        {isConnected && onConnectionSuccess && (
          <button
            onClick={handleContinue}
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:ring-green-500 focus:outline-none focus:ring-2 focus:ring-offset-2"
          >
            Continuar →
          </button>
        )}
        
        {isConnected && (
          <button
            onClick={resetArduino}
            disabled={isConnecting}
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50"
          >
            Reset Arduino
          </button>
        )}
        
        {hasError && (
          <button
            onClick={() => toggleConnection(true)}
            disabled={isConnecting}
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50"
          >
            Forçar Reconexão
          </button>
        )}
        
        {hasPersistentError && (
          <button
            onClick={resetApplication}
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:ring-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2"
          >
            Reiniciar App
          </button>
        )}
      </div>
    );
  };

  // Componente de status de conexão
  const ConnectionStatus = () => {
    if (isConnecting) {
      return (
        <div className="flex items-center text-yellow-600 dark:text-yellow-400">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Conectando...</span>
        </div>
      );
    }
    
    if (isConnected) {
      return (
        <div className="flex items-center text-green-600 dark:text-green-400">
          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Conectado</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center text-gray-500 dark:text-gray-400">
        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m-3.536-3.536a3 3 0 010-5.656" />
        </svg>
        <span>Desconectado</span>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-dark-surface-light rounded-lg shadow-md transition-colors duration-200 border border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Conexão Serial</h2>
        <ConnectionStatus />
      </div>
      
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <div className="flex items-center">
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Porta Serial
              </div>
            </label>
            <div className="flex">
              <select
                className="w-3/4 px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-surface-lighter text-gray-700 dark:text-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                value={selectedPort}
                onChange={(e) => setSelectedPort(e.target.value)}
                disabled={isConnected || isConnecting}
              >
                {ports.length === 0 && <option value="">Nenhuma porta disponível</option>}
                {ports.map((port) => (
                  <option key={port.path} value={port.path}>
                    {port.path} - {port.manufacturer || 'Dispositivo Desconhecido'}
                  </option>
                ))}
              </select>
              <button
                onClick={refreshPorts}
                disabled={isConnected || isConnecting}
                className="inline-flex items-center ml-2 px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 dark:focus:ring-offset-dark-surface transition-colors duration-200"
              >
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Atualizar
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Baud Rate
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-surface-lighter text-gray-700 dark:text-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
              value={baudRate}
              onChange={(e) => setBaudRate(e.target.value)}
              disabled={isConnected || isConnecting}
            >
              {baudRates.map((rate) => (
                <option key={rate} value={rate}>{rate}</option>
              ))}
            </select>
          </div>
        </div>

        {renderConnectionButton()}

        {message && (
          <div className={`mb-4 p-3 rounded-md text-sm ${
            message.includes('Erro') 
              ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' 
              : message.includes('sucesso') 
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
          }`}>
            {message}
          </div>
        )}

        {isConnected && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Enviar Comando</label>
              <div className="flex">
                <input
                  type="text"
                  value={sendText}
                  onChange={(e) => setSendText(e.target.value)}
                  className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Digite um comando..."
                  onKeyPress={(e) => e.key === 'Enter' && sendData()}
                />
                <button
                  onClick={sendData}
                  disabled={!sendText.trim()}
                  className="ml-0 px-4 py-2 border border-transparent text-sm font-medium rounded-r-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  Enviar
                </button>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">Dados Recebidos</label>
                <button
                  onClick={clearData}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Limpar
                </button>
              </div>
              <div className="border border-gray-300 rounded-md p-3 bg-gray-50 h-48 overflow-y-auto">
                {receivedData.length === 0 ? (
                  <p className="text-gray-500 text-sm">Nenhum dado recebido ainda...</p>
                ) : (
                  receivedData.map((item, index) => (
                    <div key={index} className="mb-1 text-sm">
                      <span className="text-gray-500">[{item.time}]</span>{' '}
                      <span className="font-mono">{item.data}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {hasPersistentError && (
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 text-sm rounded-md">
            <p className="font-medium">Dica para problemas de conexão persistentes:</p>
            <ul className="list-disc pl-5 mt-1">
              <li>Se o erro persistir, tente desconectar fisicamente o cabo USB e reconectar</li>
              <li>Alguns computadores têm portas USB mais estáveis que outras</li>
              <li>Verifique se não há outros programas usando a porta serial</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default SerialControl;
