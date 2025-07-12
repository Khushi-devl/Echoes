// Entry persistence and rendering logic

document.addEventListener('DOMContentLoaded', function() {
    renderEntries('entries', 'journalEntries');
    setupLivePreview('entries', 'journalPreview');
    renderSavedVideos();
    setupVideoPreview();
    setupNavHighlight();
    // Auth logic
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');
    if (registerForm) {
        registerForm.onsubmit = function(e) {
            e.preventDefault();
            const username = document.getElementById('registerUsername').value.trim();
            const password = document.getElementById('registerPassword').value;
            if (!username || !password) {
                showRegisterMsg('Please fill out all fields.', false);
                return;
            }
            const users = getUsers();
            if (users[username]) {
                showRegisterMsg('Username already exists.', false);
                return;
            }
            users[username] = { password };
            saveUsers(users);
            showRegisterMsg('Registration successful! You can now log in.', true);
            registerForm.reset();
        };
    }
    if (loginForm) {
        loginForm.onsubmit = function(e) {
            e.preventDefault();
            const username = document.getElementById('loginUsername').value.trim();
            const password = document.getElementById('loginPassword').value;
            if (!username || !password) {
                showLoginMsg('Please fill out all fields.', false);
                return;
            }
            const users = getUsers();
            if (!users[username] || users[username].password !== password) {
                showLoginMsg('Invalid username or password.', false);
                return;
            }
            setCurrentUser(username);
            showAppSection(username);
            loginForm.reset();
            showLoginMsg('', true);
            showRegisterMsg('', true);
            // Re-render user-specific data
            renderEntries('entries', 'journalEntries');
            renderSavedVideos();
        };
    }
    // Auto-login if user is already logged in
    const currentUser = getCurrentUser();
    if (currentUser) {
        showAppSection(currentUser);
        renderEntries('entries', 'journalEntries');
        renderSavedVideos();
    } else {
        showAuthSection();
    }
    // Auth dropdown logic
    const authToggleBtn = document.getElementById('authToggleBtn');
    const authDropdown = document.getElementById('authDropdown');
    const authBackdrop = document.getElementById('authBackdrop');
    if (authToggleBtn && authDropdown && authBackdrop) {
        authToggleBtn.onclick = function(e) {
            e.stopPropagation();
            showAuthDropdown();
        };
        authBackdrop.onclick = hideAuthDropdown;
        document.addEventListener('click', function(e) {
            if (authDropdown.classList.contains('active') && !authDropdown.contains(e.target) && e.target !== authToggleBtn) {
                hideAuthDropdown();
            }
        });
        document.addEventListener('keydown', function(e) {
            if (authDropdown.classList.contains('active') && e.key === 'Escape') {
                hideAuthDropdown();
            }
        });
    }
    const closeAuthBtn = document.querySelector('#authDropdown .close-auth');
    if (closeAuthBtn) {
        closeAuthBtn.onclick = function(e) {
            e.preventDefault();
            hideAuthDropdown();
        };
    }
    // Always set up theme toggle last so the button is present
    setupThemeToggle();
});

function getEntries(key) {
    const user = getCurrentUser();
    if (!user) return [];
    const allEntries = JSON.parse(localStorage.getItem('entries') || '{}');
    return allEntries[user] || [];
}

function saveEntries(key, entries) {
    const user = getCurrentUser();
    if (!user) return;
    const allEntries = JSON.parse(localStorage.getItem('entries') || '{}');
    allEntries[user] = entries;
    localStorage.setItem('entries', JSON.stringify(allEntries));
}

function renderEntries(type, containerId) {
    if (type !== 'entries') return; // Only handle journal entries now
    const entries = getEntries(type);
    let container = document.getElementById(containerId);
    if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        const section = document.getElementById('entries');
        section.appendChild(container);
    }
    const prevCount = container.childElementCount;
    container.innerHTML = '';
    entries.forEach((entry, idx) => {
        const article = document.createElement('article');
        article.innerHTML = `<h3>${entry.title}</h3><p>${entry.content.replace(/\n/g, '<br>')}</p><div class="mood ${entry.mood}"></div><span class="edit" data-idx="${idx}" data-type="${type}" onclick="editEntryJS(this)">✏️</span><span class="delete" data-idx="${idx}" data-type="${type}" onclick="deleteEntryJS(this)">❌</span>`;
        if (idx === entries.length - 1 && entries.length > prevCount) {
            article.classList.add('entry-animate');
            article.addEventListener('animationend', () => {
                article.classList.remove('entry-animate');
            }, { once: true });
        }
        container.appendChild(article);
    });
}

// Inline form validation and feedback
function showMessage(id, msg, isSuccess) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.style.color = isSuccess ? '#228B22' : '#b22222';
    el.style.display = 'block';
    if (msg) {
        setTimeout(() => { el.textContent = ''; el.style.display = 'none'; }, 3000);
    }
}

window.addEntry = function(formId, sectionId) {
    if (formId !== 'entries') return;
    var form = document.getElementById(formId);
    var title = form.querySelector('input[name="entryTitle"]');
    var content = form.querySelector('textarea[name="entryContent"]');
    var mood = form.querySelector('input[name="mood"]:checked');
    var msgId = 'journalMsg';
    title.style.border = content.style.border = '';
    form.querySelectorAll('input[name="mood"]').forEach(r => r.parentElement.style.fontWeight = '');
    let valid = true;
    if (!title.value) { title.style.border = '2px solid #b22222'; valid = false; }
    if (!content.value) { content.style.border = '2px solid #b22222'; valid = false; }
    if (!mood) {
        form.querySelectorAll('input[name="mood"]').forEach(r => r.parentElement.style.fontWeight = 'bold');
        valid = false;
    }
    if (!valid) {
        showMessage(msgId, 'Please fill out all fields and select a mood.', false);
        return;
    }
    const entries = getEntries('entries');
    entries.push({ title: title.value, content: content.value, mood: mood.value });
    saveEntries('entries', entries);
    renderEntries('entries', 'journalEntries');
    form.reset();
    showMessage(msgId, 'Entry added successfully!', true);
}

window.editEntryJS = function(element) {
    const idx = element.getAttribute('data-idx');
    const entries = getEntries('entries');
    const entry = entries[idx];
    var title = prompt("Edit Title:", entry.title);
    var content = prompt("Edit Content:", entry.content);
    var mood = prompt("Edit Mood (happy, neutral, sad):", entry.mood);
    if (title && content && mood) {
        entries[idx] = { title, content, mood };
        saveEntries('entries', entries);
        renderEntries('entries', 'journalEntries');
    } else {
        alert("Please fill out all fields and provide a valid mood.");
    }
}

window.deleteEntryJS = function(element) {
    const idx = element.getAttribute('data-idx');
    if (confirm("Are you sure you want to delete this entry?")) {
        const entries = getEntries('entries');
        entries.splice(idx, 1);
        saveEntries('entries', entries);
        renderEntries('entries', 'journalEntries');
    }
}

// Video persistence logic

function getSavedVideos() {
    const user = getCurrentUser();
    if (!user) return [];
    const allVideos = JSON.parse(localStorage.getItem('videos') || '{}');
    return allVideos[user] || [];
}

function saveVideos(videos) {
    const user = getCurrentUser();
    if (!user) return;
    const allVideos = JSON.parse(localStorage.getItem('videos') || '{}');
    allVideos[user] = videos;
    localStorage.setItem('videos', JSON.stringify(allVideos));
}

function renderSavedVideos() {
    const videoContainer = document.getElementById('videoContainer');
    videoContainer.innerHTML = '';
    const videos = getSavedVideos();
    videos.forEach(src => {
        const video = document.createElement('video');
        video.src = src;
        video.controls = true;
        video.style.maxWidth = '300px';
        videoContainer.appendChild(video);
    });
}

function uploadVideo() {
    const videoInput = document.getElementById('videoUpload');
    const previewContainer = document.getElementById('videoPreviewContainer');
    const msg = document.getElementById('videoMsg');
    if (videoInput.files && videoInput.files.length > 0) {
        const files = Array.from(videoInput.files);
        let loaded = 0;
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const src = e.target.result;
                const videos = getSavedVideos();
                videos.push(src);
                saveVideos(videos);
                loaded++;
                if (loaded === files.length) {
                    renderSavedVideos();
                    videoInput.value = '';
                    previewContainer.innerHTML = '';
                    showMessage('videoMsg', 'Video(s) uploaded successfully!', true);
                }
            };
            reader.readAsDataURL(file);
        });
    } else {
        showMessage('videoMsg', 'No video selected.', false);
    }
}

// Clear messages on input
['entries'].forEach(formId => {
    const form = document.getElementById(formId);
    if (form) {
        form.addEventListener('input', () => {
            showMessage('journalMsg', '', false);
            form.querySelectorAll('input, textarea').forEach(f => f.style.border = '');
            form.querySelectorAll('input[name="mood"]').forEach(r => r.parentElement.style.fontWeight = '');
        });
    }
});

// Live preview logic
function setupLivePreview(formId, previewId) {
    if (formId !== 'entries') return;
    const form = document.getElementById(formId);
    const preview = document.getElementById(previewId);
    if (!form || !preview) return;
    function updatePreview() {
        const title = form.querySelector('input[name="entryTitle"]').value;
        const content = form.querySelector('textarea[name="entryContent"]').value;
        const moodInput = form.querySelector('input[name="mood"]:checked');
        const mood = moodInput ? moodInput.value : '';
        if (title || content || mood) {
            preview.style.display = 'block';
            preview.innerHTML =
                `<strong>Preview:</strong><br>` +
                (title ? `<h3>${title}</h3>` : '') +
                (content ? `<p>${content.replace(/\n/g, '<br>')}</p>` : '') +
                (mood ? `<div class="mood ${mood}"></div> <span>${mood.charAt(0).toUpperCase() + mood.slice(1)}</span>` : '');
        } else {
            preview.style.display = 'none';
            preview.innerHTML = '';
        }
    }
    form.addEventListener('input', updatePreview);
    form.addEventListener('change', updatePreview);
}

// Dynamic navigation highlight

function setupNavHighlight() {
    const sections = [
        { id: 'home', nav: 'Home' },
        { id: 'about', nav: 'About Me' },
        { id: 'entries', nav: 'Journal Entries' },
        { id: 'gratitude', nav: 'Gratitude Journal' },
        { id: 'contact', nav: 'Contact' }
    ];
    const navLinks = Array.from(document.querySelectorAll('nav ul li a'));
    function onScroll() {
        let currentSection = sections[0].id;
        for (const section of sections) {
            const el = document.getElementById(section.id);
            if (el && window.scrollY + 100 >= el.offsetTop) {
                currentSection = section.id;
            }
        }
        navLinks.forEach(link => {
            link.classList.remove('active-nav');
            if (link.getAttribute('href') === '#' + currentSection) {
                link.classList.add('active-nav');
            }
        });
    }
    window.addEventListener('scroll', onScroll);
    onScroll(); // Initial highlight
}

// Video preview before upload and multi-upload support

function setupVideoPreview() {
    const videoInput = document.getElementById('videoUpload');
    const previewContainer = document.getElementById('videoPreviewContainer');
    if (!videoInput || !previewContainer) return;
    videoInput.addEventListener('change', function() {
        previewContainer.innerHTML = '';
        const files = Array.from(videoInput.files);
        files.forEach(file => {
            if (file.type.startsWith('video/')) {
                const url = URL.createObjectURL(file);
                const video = document.createElement('video');
                video.src = url;
                video.controls = true;
                video.style.maxWidth = '120px';
                video.style.maxHeight = '90px';
                previewContainer.appendChild(video);
            }
        });
    });
}

// Theme toggle logic

function setupThemeToggle() {
    const btn = document.getElementById('themeToggleBtn');
    const body = document.body;
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
        btn.textContent = '☀️ Light Mode';
    }
    btn.addEventListener('click', function() {
        body.classList.toggle('dark-mode');
        const isDark = body.classList.contains('dark-mode');
        btn.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
}

// User authentication logic
function getUsers() {
    return JSON.parse(localStorage.getItem('users') || '{}');
}
function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
}
function setCurrentUser(username) {
    localStorage.setItem('currentUser', username);
}
function getCurrentUser() {
    return localStorage.getItem('currentUser');
}
function logoutUser() {
    localStorage.removeItem('currentUser');
    showAuthSection();
}
function showAuthSection() {
    hideAuthDropdown();
    document.getElementById('appContent').style.display = 'none';
    document.getElementById('userInfo').style.display = 'none';
}
function showAuthDropdown() {
    const dropdown = document.getElementById('authDropdown');
    const backdrop = document.getElementById('authBackdrop');
    dropdown.classList.add('active');
    backdrop.classList.add('active');
    document.getElementById('appContent').style.display = 'none';
    document.getElementById('userInfo').style.display = 'none';
    // Focus trap
    trapFocus(dropdown);
}
function hideAuthDropdown() {
    const dropdown = document.getElementById('authDropdown');
    const backdrop = document.getElementById('authBackdrop');
    dropdown.classList.remove('active');
    backdrop.classList.remove('active');
    releaseFocusTrap();
}
function showAppSection(username) {
    hideAuthDropdown();
    document.getElementById('appContent').style.display = '';
    const userInfo = document.getElementById('userInfo');
    userInfo.style.display = '';
    userInfo.innerHTML = `Logged in as <strong>${username}</strong> <button id="logoutBtn">Logout</button>`;
    document.getElementById('logoutBtn').onclick = logoutUser;
}
function showRegisterMsg(msg, isSuccess) {
    const el = document.getElementById('registerMsg');
    el.textContent = msg;
    el.style.color = isSuccess ? '#228B22' : '#b22222';
}
function showLoginMsg(msg, isSuccess) {
    const el = document.getElementById('loginMsg');
    el.textContent = msg;
    el.style.color = isSuccess ? '#228B22' : '#b22222';
}

// Focus trap logic
let lastFocusedElement = null;
function trapFocus(modal) {
    lastFocusedElement = document.activeElement;
    const focusable = modal.querySelectorAll('input, button, [tabindex]:not([tabindex="-1"])');
    if (focusable.length) focusable[0].focus();
    function handleTrap(e) {
        if (e.key !== 'Tab') return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
            if (document.activeElement === first) {
                e.preventDefault();
                last.focus();
            }
        } else {
            if (document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    }
    modal.addEventListener('keydown', handleTrap);
    modal._trapHandler = handleTrap;
}
function releaseFocusTrap() {
    const modal = document.getElementById('authDropdown');
    if (modal && modal._trapHandler) {
        modal.removeEventListener('keydown', modal._trapHandler);
        modal._trapHandler = null;
    }
    if (lastFocusedElement) lastFocusedElement.focus();
}
