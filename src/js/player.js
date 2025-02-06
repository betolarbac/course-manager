const { ipcRenderer } = require('electron');
    
let currentCourses = [];
let activeCourseIndex = null;

window.addEventListener('load', () => {
  const coursesData = localStorage.getItem('coursesData');
  const selectedFolder = localStorage.getItem('selectedFolder');
  
  if (!coursesData || !selectedFolder) {
    window.location.href = 'welcome.html';
    return;
  }
  
  currentCourses = JSON.parse(coursesData);
  displayCourses();
});

function displayCourses() {
  const courseList = document.getElementById('courseList');
  courseList.innerHTML = '';
  
  if (currentCourses.length === 0) {
    courseList.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-folder-open"></i>
        <p>Nenhum curso encontrado</p>
      </div>
    `;
    return;
  }
  
  currentCourses.forEach((course, index) => {
    const courseElement = document.createElement('div');
    courseElement.className = `course-item ${index === activeCourseIndex ? 'active' : ''}`;
    courseElement.innerHTML = `
      <i class="fas fa-book"></i>
      <span>${course.name}</span>
      <span class="badge">${course.videos.filter(v => v.watched).length}/${course.videos.length}</span>
    `;
    courseElement.addEventListener('click', () => {
      activeCourseIndex = index;
      displayCourses();
      displayVideos(index);
    });
    courseList.appendChild(courseElement);
  });
}

function displayVideos(courseIndex) {
  const videoList = document.getElementById('videoList');
  videoList.innerHTML = '';
  
  const videos = currentCourses[courseIndex].videos;
  
  if (videos.length === 0) {
    videoList.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-video-slash"></i>
        <p>Nenhum vídeo encontrado neste Material</p>
      </div>
    `;
    return;
  }
  
  videos.forEach((video, videoIndex) => {
    const videoElement = document.createElement('div');
    videoElement.className = `video-card ${video.watched ? 'watched' : ''}`;
    videoElement.innerHTML = `
      <p class="video-title">${video.name}</p>
      <div class="video-actions">
        <button onclick="playVideo('${video.path.replace(/\\/g, '\\\\')}')" class="btn btn-play">
          <i class="fas fa-play"></i>
          Reproduzir
        </button>
        <button onclick="toggleWatched(${courseIndex}, ${videoIndex})" class="btn btn-toggle">
          <i class="fas ${video.watched ? 'fa-eye-slash' : 'fa-eye'}"></i>
          ${video.watched ? 'Não visto' : 'Visto'}
        </button>
      </div>
    `;
    videoList.appendChild(videoElement);
  });
}

async function toggleWatched(courseIndex, videoIndex) {
  const video = currentCourses[courseIndex].videos[videoIndex];
  video.watched = !video.watched;
  
  // Salvar estado no arquivo JSON
  await ipcRenderer.invoke('toggle-watched', video.path, video.watched);
  
  // Atualizar localStorage
  localStorage.setItem('coursesData', JSON.stringify(currentCourses));
  
  displayVideos(courseIndex);
  displayCourses(); // Atualiza o contador de vídeos assistidos
}

function playVideo(videoPath) {
  const videoPlayer = document.getElementById('videoPlayer');
  videoPlayer.src = `local://${videoPath}`;
  videoPlayer.play().catch(error => {
    console.error('Erro ao reproduzir vídeo:', error);
    alert('Erro ao reproduzir o vídeo. Por favor, verifique se o arquivo existe e é suportado.');
  });
}

