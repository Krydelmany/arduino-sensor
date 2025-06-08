const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const Store = require('electron-store');

const store = new Store();

let mainWindow;
let serialPort = null;
let parser = null;
let isConnecting = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 680,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  const startURL = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../dist/index.html')}`;
  mainWindow.loadURL(startURL);
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Ajuste para carregar módulos nativos no modo de produção
if (!isDev) {
  app.setPath('userData', path.join(app.getPath('userData'), 'Arduino Sensor'));
  
  // Para lidar com módulos nativos como o serialport
  if (process.platform === 'win32') {
    process.env.PATH = `${path.join(__dirname, '../native-modules')};${process.env.PATH}`;
  }
}

// Listar portas seriais disponíveis
ipcMain.handle('serial:list', async () => {
  try {
    const ports = await SerialPort.list();
    return ports;
  } catch (error) {
    console.error('Error listing serial ports:', error);
    return [];
  }
});

// Função utilitária para atrasos
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Função para forçar a liberação da porta
const forceReleasePort = async (portPath) => {
  console.log(`Tentando forçar liberação da porta ${portPath}...`);
  if (process.platform === 'win32') {
    // Estratégia 1: DTR toggle
    try {
      console.log('Tentando liberação por DTR toggle...');
      const tempPort = new SerialPort({
        path: portPath,
        baudRate: 9600,
        autoOpen: false
      });
      tempPort.on('error', () => {});
      await new Promise((resolve) => {
        tempPort.open((err) => {
          if (!err) {
            tempPort.set({ dtr: true }, () => {
              setTimeout(() => {
                tempPort.set({ dtr: false }, () => {
                  setTimeout(() => {
                    tempPort.close(() => resolve());
                  }, 100);
                });
              }, 100);
            });
          } else {
            resolve();
          }
        });
      });
      await delay(1000);
    } catch (e) {
      console.log('DTR toggle falhou (esperado):', e.message);
    }
    // Estratégia 2: Múltiplas tentativas rápidas
    for (let attempt = 1; attempt <= 5; attempt++) {
      console.log(`Tentativa ${attempt} de liberar porta...`);
      try {
        const tempPort = new SerialPort({
          path: portPath,
          baudRate: 9600,
          autoOpen: false,
        });
        tempPort.on('error', () => {});
        await new Promise((resolve) => {
          tempPort.open((err) => {
            if (!err) {
              tempPort.close(() => resolve());
            } else {
              resolve();
            }
          });
        });
        await delay(300);
      } catch (e) {}
    }
    if (global.gc) {
      console.log('Executando coleta de lixo forçada...');
      global.gc();
    }
    console.log('Aguardando liberação completa de recursos...');
    await delay(2500);
  }
  console.log('Processo de liberação forçada concluído');
};

// Conectar à porta serial com múltiplas tentativas e modos alternados
ipcMain.handle('serial:connect', async (event, portPath, baudRate) => {
  if (isConnecting) {
    return { success: false, message: 'Conexão em andamento, aguarde...' };
  }
  try {
    isConnecting = true;

    // Fechar e limpar a referência se já existir
    if (serialPort) {
      try {
        if (serialPort.isOpen) {
          console.log('Fechando porta serial existente...');
          await new Promise((resolve) => {
            serialPort.close((err) => {
              if (err) console.error('Erro ao fechar porta existente:', err);
              resolve();
            });
          });
        }
        serialPort.removeAllListeners();
        serialPort = null;
        if (parser) {
          parser.removeAllListeners();
          parser = null;
        }
      } catch (closeError) {
        console.error('Erro ao fechar porta existente:', closeError);
      }
    }

    await delay(1000);
    await forceReleasePort(portPath);
    console.log(`Tentando abrir porta ${portPath} com baud rate ${baudRate}...`);

    let lastError = null;
    // Definindo modos alternados de conexão
    const connectionModes = [
      { rtscts: false, xon: false, xoff: false },
      { rtscts: true, xon: false, xoff: false },
      { rtscts: false, xon: true, xoff: true },
    ];
    // Tentar três vezes com configurações diferentes
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`Tentativa ${attempt} de conexão...`);
        const mode = connectionModes[(attempt - 1) % connectionModes.length];
        const portConfig = {
          path: portPath,
          baudRate: parseInt(baudRate),
          autoOpen: false,
          highWaterMark: 1024 * 64,
          dataBits: 8,
          stopBits: 1,
          parity: 'none',
          ...mode,
          lock: false,
        };
        const port = new SerialPort(portConfig);
        port.on('error', (err) => {
          console.error(`Erro na tentativa ${attempt}:`, err);
          if (mainWindow) {
            mainWindow.webContents.send('serial:connection-change', false);
          }
        });
        port.on('close', () => {
          console.log('Porta serial fechada');
          if (mainWindow) {
            mainWindow.webContents.send('serial:connection-change', false);
          }
        });
        await new Promise((resolve, reject) => {
          port.open((err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        console.log(`Conexão bem-sucedida na tentativa ${attempt}!`);
        serialPort = port;
        parser = serialPort.pipe(new ReadlineParser({
          delimiter: '\n',
          includeDelimiter: false,
          encoding: 'utf8',
        }));
        parser.on('data', (data) => {
          const cleanData = data.toString().trim();
          if (cleanData && mainWindow) {
            mainWindow.webContents.send('serial:data', cleanData);
          }
        });
        store.set('serialPort', { path: portPath, baudRate });
        if (mainWindow) {
          mainWindow.webContents.send('serial:connection-change', true);
        }
        isConnecting = false;
        return { success: true, message: 'Conectado com sucesso!' };
      } catch (attemptError) {
        console.error(`Falha na tentativa ${attempt}:`, attemptError.message);
        lastError = attemptError;
        await delay(2000);
      }
    }
    isConnecting = false;
    return { success: false, message: `Erro ao conectar após múltiplas tentativas: ${lastError ? lastError.message : 'Razão desconhecida'}` };
  } catch (error) {
    isConnecting = false;
    console.error('Erro durante a configuração de conexão:', error);
    return { success: false, message: `Erro ao configurar conexão: ${error.message}` };
  }
});

// Desconectar da porta serial
ipcMain.handle('serial:disconnect', async () => {
  if (!serialPort) {
    return { success: true, message: 'Já estava desconectado.' };
  }
  try {
    if (serialPort.isOpen) {
      console.log('Iniciando desconexão da porta serial...');
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.log('Timeout na desconexão, forçando limpeza...');
          if (serialPort) serialPort.removeAllListeners();
          if (parser) parser.removeAllListeners();
          serialPort = null;
          parser = null;
          resolve({ success: true, message: 'Desconectado (forçado por timeout)' });
        }, 3000);
        try {
          serialPort.flush(() => {
            serialPort.close((err) => {
              clearTimeout(timeout);
              if (err) {
                console.error('Erro ao fechar porta serial:', err);
                if (serialPort) serialPort.removeAllListeners();
                if (parser) parser.removeAllListeners();
                serialPort = null;
                parser = null;
                resolve({ success: false, message: `Erro ao desconectar: ${err.message}` });
              } else {
                console.log('Porta serial fechada com sucesso');
                if (serialPort) serialPort.removeAllListeners();
                if (parser) parser.removeAllListeners();
                serialPort = null;
                parser = null;
                resolve({ success: true, message: 'Desconectado com sucesso!' });
              }
            });
          });
        } catch (error) {
          clearTimeout(timeout);
          console.error('Erro durante flush/close:', error);
          if (serialPort) serialPort.removeAllListeners();
          if (parser) parser.removeAllListeners();
          serialPort = null;
          parser = null;
          resolve({ success: false, message: `Erro ao desconectar: ${error.message}` });
        }
      });
    } else {
      console.log('A porta já estava fechada');
      if (serialPort) serialPort.removeAllListeners();
      if (parser) parser.removeAllListeners();
      serialPort = null;
      parser = null;
      return { success: true, message: 'Porta já estava fechada.' };
    }
  } catch (error) {
    console.error('Erro na sequência de desconexão:', error);
    if (serialPort) serialPort.removeAllListeners();
    if (parser) parser.removeAllListeners();
    serialPort = null;
    parser = null;
    return { success: false, message: `Erro no processo de desconexão: ${error.message}` };
  }
});

// Enviar dados para o Arduino
ipcMain.handle('serial:send', async (event, data) => {
  if (!serialPort || !serialPort.isOpen) {
    return { success: false, message: 'Não está conectado a nenhuma porta serial!' };
  }
  try {
    return new Promise((resolve) => {
      serialPort.write(`${data}\n`, (err) => {
        if (err) {
          console.error('Erro ao enviar dados para a porta serial:', err);
          resolve({ success: false, message: `Erro ao enviar: ${err.message}` });
        } else {
          resolve({ success: true, message: 'Comando enviado!' });
        }
      });
    });
  } catch (error) {
    console.error('Erro ao enviar dados para a porta serial:', error);
    return { success: false, message: `Erro ao enviar: ${error.message}` };
  }
});

// Reiniciar o aplicativo
ipcMain.handle('app:reset', () => {
  if (serialPort && serialPort.isOpen) {
    try { serialPort.close(); } catch (e) {}
  }
  app.relaunch();
  app.exit();
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (serialPort && serialPort.isOpen) {
      try { serialPort.close(); } catch (err) {
        console.error('Erro ao fechar a porta ao sair:', err);
      }
    }
    app.quit();
  }
});
app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
