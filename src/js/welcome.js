const { ipcRenderer } = require('electron');
    
document.getElementById('selectFolder').addEventListener('click', async () => {
  const folderPath = await ipcRenderer.invoke('select-folder');
  if (folderPath) {
    document.getElementById('loading').style.display = 'block';
    const courses = await ipcRenderer.invoke('read-folder', folderPath);
    
    // Salvar os dados e redirecionar
    localStorage.setItem('coursesData', JSON.stringify(courses));
    localStorage.setItem('selectedFolder', folderPath);
    window.location.href = 'player.html';
  }
});