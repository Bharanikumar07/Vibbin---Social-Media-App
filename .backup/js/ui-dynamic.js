// Dynamic UI Updates for Real-Time User Data
class DynamicUI {
    constructor() {
        this.currentUser = null;
    }

    init() {
        // Require authentication
        if (!authSystem.requireAuth()) {
            return;
        }

        this.currentUser = authSystem.getCurrentUser();
        this.updateUserProfile();
        this.updateFriendRequests();
        this.loadFeed();
        this.attachEventListeners();
    }

    // Update all user profile elements on the page
    updateUserProfile() {
        if (!this.currentUser) return;

        // Update profile name
        const profileNames = document.querySelectorAll('.profile-name, .post-username');
        profileNames.forEach(el => {
            if (el.closest('.post-card') && !el.closest('.post-card').dataset.userId) {
                // This is the current user's post
                el.textContent = this.currentUser.fullname;
            }
        });

        // Update username
        const usernames = document.querySelectorAll('.profile-username');
        usernames.forEach(el => el.textContent = this.currentUser.username);

        // Update bio
        const bios = document.querySelectorAll('.profile-bio');
        bios.forEach(el => el.textContent = this.currentUser.bio);

        // Update avatar images
        const avatars = document.querySelectorAll('.profile-avatar');
        avatars.forEach(el => el.src = this.currentUser.avatar);

        // Update cover images
        const covers = document.querySelectorAll('.cover-image');
        covers.forEach(el => el.src = this.currentUser.cover);

        // Update stats
        this.updateStats();

        // Update sidebar user name if exists
        const sidebarUserName = document.querySelector('.sidebar-user-name');
        if (sidebarUserName) {
            sidebarUserName.textContent = this.currentUser.fullname;
        }
    }

    updateStats() {
        if (!this.currentUser) return;

        // Update posts count
        const postsCount = document.querySelectorAll('[data-stat="posts"]');
        postsCount.forEach(el => el.textContent = this.currentUser.posts);

        // Update followers count
        const followersCount = document.querySelectorAll('[data-stat="followers"]');
        followersCount.forEach(el => el.textContent = this.formatNumber(this.currentUser.followers));

        // Update following count
        const followingCount = document.querySelectorAll('[data-stat="following"]');
        followingCount.forEach(el => el.textContent = this.formatNumber(this.currentUser.following));

        // Update friend requests badge
        const requestsCount = this.currentUser.friendRequests.length;
        const badges = document.querySelectorAll('.friend-requests-badge');
        badges.forEach(badge => {
            if (requestsCount > 0) {
                badge.textContent = requestsCount;
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
        });
    }

    formatNumber(num) {
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    // Load friend requests
    updateFriendRequests() {
        if (!this.currentUser) return;

        const requests = authSystem.getFriendRequests(this.currentUser.id);
        const requestsContainer = document.getElementById('friend-requests-container');

        if (!requestsContainer) return;

        if (requests.length === 0) {
            requestsContainer.innerHTML = '<p class="no-requests">No pending friend requests</p>';
            return;
        }

        requestsContainer.innerHTML = requests.map(user => `
            <div class="friend-request-card" data-user-id="${user.id}">
                <img src="${user.avatar}" alt="${user.fullname}" class="request-avatar">
                <div class="request-info">
                    <h4 class="request-name">${user.fullname}</h4>
                    <p class="request-username">${user.username}</p>
                </div>
                <div class="request-actions">
                    <button class="btn btn-primary btn-sm accept-request" data-user-id="${user.id}">Accept</button>
                    <button class="btn btn-outline btn-sm reject-request" data-user-id="${user.id}">Reject</button>
                </div>
            </div>
        `).join('');

        // Attach event listeners
        this.attachRequestListeners();
    }

    attachRequestListeners() {
        // Accept request buttons
        document.querySelectorAll('.accept-request').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.target.dataset.userId;
                const result = authSystem.acceptFriendRequest(this.currentUser.id, userId);

                if (result.success) {
                    this.showNotification('Friend request accepted!', 'success');
                    this.updateFriendRequests();
                    this.updateStats();
                }
            });
        });

        // Reject request buttons
        document.querySelectorAll('.reject-request').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.target.dataset.userId;
                const result = authSystem.rejectFriendRequest(this.currentUser.id, userId);

                if (result.success) {
                    this.showNotification('Friend request rejected', 'info');
                    this.updateFriendRequests();
                }
            });
        });
    }

    // Load feed with real posts
    loadFeed() {
        const feedContainer = document.getElementById('feed-container');
        if (!feedContainer) return;

        const posts = postsSystem.getFeedPosts(this.currentUser.id);

        if (posts.length === 0) {
            feedContainer.innerHTML = `
                <div class="empty-feed">
                    <h3>Your feed is empty</h3>
                    <p>Start by adding friends or creating your first post!</p>
                </div>
            `;
            return;
        }

        feedContainer.innerHTML = posts.map(post => this.renderPost(post)).join('');
        this.attachPostListeners();
    }

    renderPost(post) {
        const author = authSystem.getUserById(post.userId);
        if (!author) return '';

        const isLiked = post.likedBy.includes(this.currentUser.id);
        const timeAgo = postsSystem.getTimeAgo(post.createdAt);

        return `
            <article class="post-card" data-post-id="${post.id}">
                <div class="post-header">
                    <img src="${author.avatar}" alt="${author.fullname}" class="avatar">
                    <div class="post-user-info">
                        <h4 class="post-username">${author.fullname}</h4>
                        <span class="post-time">${timeAgo}</span>
                    </div>
                    <div class="post-menu-container">
                        ${post.userId === this.currentUser.id ? `
                            <button class="icon-btn post-menu-btn delete-post" data-post-id="${post.id}" title="Delete Post">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M6 2l1-1h6l1 1h4v2H2V2h4zM3 6h14l-1 12H4L3 6z" />
                                </svg>
                            </button>
                        ` : `
                            <button class="icon-btn post-menu-btn" aria-label="Post menu">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                    <circle cx="10" cy="4" r="1.5" />
                                    <circle cx="10" cy="10" r="1.5" />
                                    <circle cx="10" cy="16" r="1.5" />
                                </svg>
                            </button>
                        `}
                    </div>
                </div>

                <div class="post-content">
                    <p>${post.content}</p>
                </div>

                ${post.image ? `
                    <div class="post-image">
                        <img src="${post.image}" alt="Post image">
                    </div>
                ` : ''}

                <div class="post-actions">
                    <button class="action-btn like-btn ${isLiked ? 'liked' : ''}" data-post-id="${post.id}">
                        <svg width="22" height="22" viewBox="0 0 22 22" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor">
                            <path d="M11 19.5L2.75 11.25C1.25 9.75 1.25 7.25 2.75 5.75C4.25 4.25 6.75 4.25 8.25 5.75L11 8.5L13.75 5.75C15.25 4.25 17.75 4.25 19.25 5.75C20.75 7.25 20.75 9.75 19.25 11.25L11 19.5Z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                        <span class="like-count">${post.likes}</span>
                    </button>
                    <button class="action-btn comment-btn">
                        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor">
                            <path d="M19 13C19 13.5304 18.7893 14.0391 18.4142 14.4142C18.0391 14.7893 17.5304 15 17 15H7L3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H17C17.5304 3 18.4142 3.58579C18.7893 3.96086 19 4.46957 19 5V13Z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                        <span>${post.comments}</span>
                    </button>
                    <button class="action-btn share-btn">
                        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor">
                            <circle cx="16" cy="5" r="3" stroke-width="2" />
                            <circle cx="6" cy="11" r="3" stroke-width="2" />
                            <circle cx="16" cy="17" r="3" stroke-width="2" />
                            <path d="M8.5 12.5L13.5 15.5M13.5 6.5L8.5 9.5" stroke-width="2" />
                        </svg>
                        <span>Share</span>
                    </button>
                </div>
            </article>
        `;
    }

    attachPostListeners() {
        // Like buttons
        document.querySelectorAll('.like-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const button = e.currentTarget;
                const postId = button.dataset.postId;
                const result = postsSystem.toggleLike(postId, this.currentUser.id);

                if (result.success) {
                    button.classList.toggle('liked', result.liked);
                    const likeCount = button.querySelector('.like-count');
                    likeCount.textContent = result.likes;

                    // Update SVG fill
                    const svg = button.querySelector('svg path');
                    svg.setAttribute('fill', result.liked ? 'currentColor' : 'none');
                }
            });
        });

        // Delete post buttons
        document.querySelectorAll('.delete-post').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const postId = e.currentTarget.dataset.postId;
                if (confirm('Are you sure you want to delete this post?')) {
                    const result = postsSystem.deletePost(postId, this.currentUser.id);

                    if (result.success) {
                        this.showNotification('Post deleted', 'success');
                        this.loadFeed();
                        this.updateStats();
                    }
                }
            });
        });
    }

    attachEventListeners() {
        // Logout button
        const logoutBtns = document.querySelectorAll('[data-action="logout"]');
        logoutBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm('Are you sure you want to logout?')) {
                    authSystem.signOut();
                }
            });
        });

        // Create post button
        const createPostBtn = document.getElementById('create-post-btn');
        if (createPostBtn) {
            createPostBtn.addEventListener('click', () => {
                this.showCreatePostModal();
            });
        }
    }

    showCreatePostModal() {
        const content = prompt('What\'s on your mind?');
        if (content && content.trim()) {
            const result = postsSystem.createPost(this.currentUser.id, content.trim());

            if (result.success) {
                this.showNotification('Post created!', 'success');
                this.loadFeed();
                this.updateStats();
            }
        }
    }

    showNotification(message, type = 'info') {
        // Simple notification - you can enhance this
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.dynamicUI = new DynamicUI();
        window.dynamicUI.init();
    });
} else {
    window.dynamicUI = new DynamicUI();
    window.dynamicUI.init();
}
