function renderJournal(viewMode = 'all') {
    const container = document.getElementById('journalEntries');
    const user = db.currentUser();
    const entries = db.getEntries();
    
    container.innerHTML = '';

    // Create a header for the current view
    const viewHeader = document.createElement('div');
    viewHeader.className = 'view-status-bar';
    
    let filtered;
    if (viewMode === 'all') {
        // Social Feed: Show everyone's public posts + my own private ones
        filtered = entries.filter(e => e.privacy === 'public' || e.author === user);
        viewHeader.innerHTML = "✨ Global Musings Feed";
    } else {
        // Profile View: Show only this specific person's public posts
        filtered = entries.filter(e => e.author === viewMode && (e.privacy === 'public' || e.author === user));
        viewHeader.innerHTML = `🌸 Browsing ${viewMode}'s Diary <button onclick="renderJournal('all')" class="btn-mini">Back to Feed</button>`;
    }
    
    container.appendChild(viewHeader);

    filtered.reverse().forEach((e) => {
        const card = document.createElement('article');
        card.className = 'scrapbook-entry';
        card.innerHTML = `
            <div class="entry-header">
                <span class="author-link" onclick="renderJournal('${e.author}')">@${e.author}</span>
                <span class="entry-date">${e.date}</span>
            </div>
            <h3>${e.title}</h3>
            <p>${e.content}</p>
            <div class="entry-footer">
                <span class="mood-tag">${e.mood}</span>
                ${e.author === user ? `<span class="privacy-icon">${e.privacy === 'public' ? '🌍' : '🔒'}</span>` : ''}
            </div>
        `;
        container.appendChild(card);
    });
}
