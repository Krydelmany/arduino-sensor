const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Lista portas seriais disponíveis
  listPorts: () => ipcRenderer.invoke('serial:list'),
  
  // Conectar a uma porta
  connect: (port, baudRate) => ipcRenderer.invoke('serial:connect', port, baudRate),
  
  // Desconectar
  disconnect: () => ipcRenderer.invoke('serial:disconnect'),
  
  // Enviar dados para o Arduino
  send: (data) => ipcRenderer.invoke('serial:send', data),
  
  // Reiniciar o aplicativo
  resetApp: () => ipcRenderer.invoke('app:reset'),
  
  // Reset do Arduino (via DTR toggle)
  resetArduino: () => ipcRenderer.invoke('serial:reset'),
  
  // Ouvir dados recebidos do Arduino
  onReceive: (callback) => {
    ipcRenderer.on('serial:data', (event, data) => callback(data));
    return () => {
      ipcRenderer.removeAllListeners('serial:data');
    };
  },
  
  // Ouvir mudanças de estado da conexão
  onConnectionChange: (callback) => {
    ipcRenderer.on('serial:connection-change', (event, connected) => callback(connected));
    return () => {
      ipcRenderer.removeAllListeners('serial:connection-change');
    };
  }
});
