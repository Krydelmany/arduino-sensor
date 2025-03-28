import React, { useState } from 'react'
import ConnectionScreen from './screens/ConnectionScreen'
import SensorDashboard from './screens/SensorDashboard'
import { ThemeProvider } from './contexts/ThemeContext'
import ThemeToggle from './components/ThemeToggle'

function App() {
  const [currentScreen, setCurrentScreen] = useState('connection');
  const [connectionInfo, setConnectionInfo] = useState(null);

  // Alternar para a tela do painel de sensores quando conectado
  const handleContinue = (info) => {
    setConnectionInfo(info);
    setCurrentScreen('dashboard');
  };

  // Voltar para a tela de conexão
  const handleBackToConnection = () => {
    setCurrentScreen('connection');
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-100 dark:bg-dark-surface transition-colors duration-300">
        <div className="absolute top-4 right-4 z-10">
          <ThemeToggle />
        </div>
        
        {currentScreen === 'connection' ? (
          <ConnectionScreen onContinue={handleContinue} />
        ) : (
          <SensorDashboard 
            connectionInfo={connectionInfo} 
            onBackToConnection={handleBackToConnection} 
          />
        )}
        
        <div className="text-center p-4 text-sm text-gray-500 dark:text-gray-400">
          Desenvolvido com Electron, React e SerialPort
        </div>
      </div>
    </ThemeProvider>
  )
}

export default App
