const fs = require('fs-extra');
const path = require('path');

// Caminho para os módulos nativos no node_modules
const sourcePath = path.join(__dirname, '../node_modules/serialport/build/Release');
// Caminho para onde os módulos nativos devem ser copiados no aplicativo empacotado
const destPath = path.join(__dirname, '../dist/native-modules');

// Função para copiar os módulos nativos
async function copyNativeModules() {
  try {
    if (fs.existsSync(sourcePath)) {
      // Garantir que o diretório de destino exista
      await fs.ensureDir(destPath);
      
      // Copiar os módulos nativos
      await fs.copy(sourcePath, destPath);
      console.log('Módulos nativos copiados com sucesso!');
    } else {
      console.log('Diretório de módulos nativos não encontrado');
    }
  } catch (err) {
    console.error('Erro ao copiar módulos nativos:', err);
  }
}

// Executar a função
copyNativeModules();
