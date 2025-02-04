const { app, BrowserWindow, ipcMain, dialog, protocol } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
const watchedVideosFile = path.join(app.getPath('userData'), 'watched-videos.json');

// Função para carregar vídeos assistidos
function loadWatchedVideos() {
  try {
    if (fs.existsSync(watchedVideosFile)) {
      const data = fs.readFileSync(watchedVideosFile, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Erro ao carregar vídeos assistidos:', error);
  }
  return {};
}

// Função para salvar vídeos assistidos
function saveWatchedVideos(watchedVideos) {
  try {
    fs.writeFileSync(watchedVideosFile, JSON.stringify(watchedVideos, null, 2));
  } catch (error) {
    console.error('Erro ao salvar vídeos assistidos:', error);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    }
  });

  mainWindow.loadFile('src/welcome.html');
}

app.whenReady().then(() => {
  protocol.registerFileProtocol('local', (request, callback) => {
    const filePath = request.url.replace('local://', '');
    callback(decodeURI(filePath));
  });
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  if (!result.canceled) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('read-folder', async (event, folderPath) => {
  const courses = [];
  const watchedVideos = loadWatchedVideos();
  const folders = fs.readdirSync(folderPath);
  
  for (const folder of folders) {
    const coursePath = path.join(folderPath, folder);
    if (fs.statSync(coursePath).isDirectory()) {
      const videos = fs.readdirSync(coursePath)
        .filter(file => file.endsWith('.mp4') || file.endsWith('.mkv'))
        .map(file => {
          const videoPath = path.join(coursePath, file);
          return {
            name: file,
            path: videoPath,
            watched: watchedVideos[videoPath] || false
          };
        });
      
      courses.push({
        name: folder,
        videos
      });
    }
  }
  
  return courses;
});

ipcMain.handle('toggle-watched', async (event, videoPath, watched) => {
  const watchedVideos = loadWatchedVideos();
  watchedVideos[videoPath] = watched;
  saveWatchedVideos(watchedVideos);
  return true;
});