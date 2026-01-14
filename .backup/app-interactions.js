// ===================================
// VIBBIN APP INTERACTIONS
// ===================================

document.addEventListener('DOMContentLoaded', function () {

    // ===================================
    // MOBILE MENU TOGGLE
    // ===================================
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const sidebar = document.getElementById('sidebar');

    if (hamburgerBtn && sidebar) {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        overlay.id = 'sidebar-overlay';
        document.body.appendChild(overlay);

        hamburgerBtn.addEventListener('click', function () {
            hamburgerBtn.classList.toggle('active');
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        });

        // Close sidebar when clicking overlay
        overlay.addEventListener('click', function () {
            hamburgerBtn.classList.remove('active');
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        });
    }

    // ===================================
    // POST LIKE BUTTON
    // ===================================
    const likeBtns = document.querySelectorAll('.like-btn');

    likeBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            this.classList.toggle('liked');
            const countSpan = this.querySelector('span');
            let count = parseInt(countSpan.textContent);

            if (this.classList.contains('liked')) {
                count++;
            } else {
                count--;
            }

            countSpan.textContent = count;
        });
    });

    // ===================================
    // CREATE POST BUTTON
    // ===================================
    const createPostBtn = document.getElementById('create-post-btn');

    if (createPostBtn) {
        createPostBtn.addEventListener('click', function () {
            alert('Create Post feature coming soon!');
            // In production, this would open a create post modal
        });
    }

    // ===================================
    // CREATE STORY BUTTON
    // ===================================
    const createStoryBtn = document.getElementById('create-story');

    if (createStoryBtn) {
        createStoryBtn.addEventListener('click', function () {
            alert('Create Story feature coming soon!');
            // In production, this would open a create story modal
        });
    }

    // ===================================
    // STORY CARDS CLICK
    // ===================================
    const storyCards = document.querySelectorAll('.story-card:not(.create-story)');

    storyCards.forEach(card => {
        card.addEventListener('click', function () {
            const username = this.querySelector('.story-username').textContent;
            console.log(`Viewing story from: ${username}`);
            // In production, this would open story viewer
        });
    });

    // ===================================
    // COMMENT BUTTON
    // ===================================
    const commentBtns = document.querySelectorAll('.comment-btn');

    commentBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            console.log('Comment button clicked');
            // In production, this would open comment section
        });
    });

    // ===================================
    // SHARE BUTTON
    // ===================================
    const shareBtns = document.querySelectorAll('.share-btn');

    shareBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            console.log('Share button clicked');
            // In production, this would open share modal
        });
    });

    // ===================================
    // POST MENU BUTTON
    // ===================================
    const postMenuBtns = document.querySelectorAll('.post-menu-btn');

    postMenuBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            console.log('Post menu clicked');
            // In production, this would open a dropdown menu
        });
    });

    // ===================================
    // SMOOTH SCROLL FOR STORIES
    // ===================================
    const storiesScroll = document.querySelector('.stories-scroll');

    if (storiesScroll) {
        let isDown = false;
        let startX;
        let scrollLeft;

        storiesScroll.addEventListener('mousedown', (e) => {
            isDown = true;
            storiesScroll.style.cursor = 'grabbing';
            startX = e.pageX - storiesScroll.offsetLeft;
            scrollLeft = storiesScroll.scrollLeft;
        });

        storiesScroll.addEventListener('mouseleave', () => {
            isDown = false;
            storiesScroll.style.cursor = 'grab';
        });

        storiesScroll.addEventListener('mouseup', () => {
            isDown = false;
            storiesScroll.style.cursor = 'grab';
        });

        storiesScroll.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - storiesScroll.offsetLeft;
            const walk = (x - startX) * 2;
            storiesScroll.scrollLeft = scrollLeft - walk;
        });
    }

    // ===================================
    // NAVIGATION ACTIVE STATE
    // ===================================
    const navItems = document.querySelectorAll('.nav-item');
    const currentPage = window.location.pathname.split('/').pop() || 'feed.html';

    navItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href && href.includes(currentPage)) {
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
        }
    });

    // ===================================
    // FOLLOW/UNFOLLOW BUTTON (for Discover & Connections pages)
    // ===================================
    const followBtns = document.querySelectorAll('.follow-btn');

    followBtns.forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();

            if (this.classList.contains('following')) {
                this.classList.remove('following');
                this.classList.remove('btn-secondary');
                this.classList.add('btn-primary');
                this.textContent = 'Follow';
            } else {
                this.classList.add('following');
                this.classList.remove('btn-primary');
                this.classList.add('btn-secondary');
                this.textContent = 'Following';
            }
        });
    });

    // ===================================
    // SEARCH FUNCTIONALITY
    // ===================================
    const searchInput = document.getElementById('search-input');

    if (searchInput) {
        searchInput.addEventListener('input', function () {
            const query = this.value.toLowerCase();
            console.log('Searching for:', query);
            // In production, this would filter results
        });
    }

    // ===================================
    // FILTER TABS (for Connections page)
    // ===================================
    const filterTabs = document.querySelectorAll('.filter-tab');

    filterTabs.forEach(tab => {
        tab.addEventListener('click', function () {
            filterTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            const filter = this.getAttribute('data-filter');
            console.log('Filter:', filter);
            // In production, this would filter the connection cards
        });
    });

    // ===================================
    // VIEW PROFILE BUTTON
    // ===================================
    const viewProfileBtns = document.querySelectorAll('.view-profile-btn');

    viewProfileBtns.forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            console.log('View profile clicked');
            // In production, this would navigate to profile page
            window.location.href = 'profile.html';
        });
    });

    // ===================================
    // MESSAGE BUTTON
    // ===================================
    const messageBtns = document.querySelectorAll('.message-btn');

    messageBtns.forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            console.log('Message button clicked');
            // In production, this would open message composer
            window.location.href = 'messages.html';
        });
    });

    // ===================================
    // AUTO CLOSE MOBILE MENU ON NAVIGATION
    // ===================================
    if (sidebar && overlay) {
        navItems.forEach(item => {
            item.addEventListener('click', function () {
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('active');
                    overlay.classList.remove('active');
                    if (hamburgerBtn) {
                        hamburgerBtn.classList.remove('active');
                    }
                }
            });
        });
    }
});
