// Posts Management System
class PostsSystem {
    constructor() {
        this.init();
    }

    init() {
        if (!localStorage.getItem('pingup_posts')) {
            this.initializeDefaultPosts();
        }
    }

    initializeDefaultPosts() {
        const defaultPosts = [
            {
                id: 'post_001',
                userId: 'user_001',
                content: 'Just finished building an amazing feature! Excited to share it with everyone soon! 🚀',
                image: 'https://picsum.photos/seed/post1/800/600',
                likes: 42,
                likedBy: [],
                comments: 8,
                shares: 3,
                createdAt: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
            },
            {
                id: 'post_002',
                userId: 'user_002',
                content: 'Beautiful sunset today! Nature never fails to amaze me 🌅',
                image: 'https://picsum.photos/seed/post2/800/600',
                likes: 87,
                likedBy: ['user_001'],
                comments: 15,
                shares: 5,
                createdAt: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
            },
            {
                id: 'post_003',
                userId: 'user_003',
                content: 'Coffee and code - the perfect combination ☕💻',
                image: null,
                likes: 23,
                likedBy: [],
                comments: 4,
                shares: 1,
                createdAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
            }
        ];

        localStorage.setItem('pingup_posts', JSON.stringify(defaultPosts));
    }

    getAllPosts() {
        const posts = localStorage.getItem('pingup_posts');
        return posts ? JSON.parse(posts) : [];
    }

    savePosts(posts) {
        localStorage.setItem('pingup_posts', JSON.stringify(posts));
    }

    getPostById(postId) {
        const posts = this.getAllPosts();
        return posts.find(post => post.id === postId);
    }

    getUserPosts(userId) {
        const posts = this.getAllPosts();
        return posts.filter(post => post.userId === userId)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    getFeedPosts(userId) {
        const user = window.authSystem.getUserById(userId);
        if (!user) return [];

        const posts = this.getAllPosts();

        // Get posts from user's friends and the user themselves
        const relevantUserIds = [...user.friends, userId];

        return posts
            .filter(post => relevantUserIds.includes(post.userId))
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    createPost(userId, content, image = null) {
        const posts = this.getAllPosts();

        const newPost = {
            id: 'post_' + Date.now(),
            userId: userId,
            content: content,
            image: image,
            likes: 0,
            likedBy: [],
            comments: 0,
            shares: 0,
            createdAt: new Date().toISOString()
        };

        posts.unshift(newPost);
        this.savePosts(posts);

        // Update user's post count
        const users = window.authSystem.getAllUsers();
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            users[userIndex].posts++;
            window.authSystem.saveUsers(users);
        }

        return { success: true, post: newPost };
    }

    toggleLike(postId, userId) {
        const posts = this.getAllPosts();
        const post = posts.find(p => p.id === postId);

        if (!post) {
            return { success: false, message: 'Post not found' };
        }

        const likedIndex = post.likedBy.indexOf(userId);

        if (likedIndex > -1) {
            // Unlike
            post.likedBy.splice(likedIndex, 1);
            post.likes--;
        } else {
            // Like
            post.likedBy.push(userId);
            post.likes++;
        }

        this.savePosts(posts);

        return { success: true, liked: likedIndex === -1, likes: post.likes };
    }

    deletePost(postId, userId) {
        const posts = this.getAllPosts();
        const post = posts.find(p => p.id === postId);

        if (!post) {
            return { success: false, message: 'Post not found' };
        }

        // Only allow user to delete their own posts
        if (post.userId !== userId) {
            return { success: false, message: 'Unauthorized' };
        }

        const filteredPosts = posts.filter(p => p.id !== postId);
        this.savePosts(filteredPosts);

        // Update user's post count
        const users = window.authSystem.getAllUsers();
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            users[userIndex].posts--;
            window.authSystem.saveUsers(users);
        }

        return { success: true, message: 'Post deleted' };
    }

    getTimeAgo(dateString) {
        const now = new Date();
        const past = new Date(dateString);
        const diffMs = now - past;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

        return past.toLocaleDateString();
    }
}

// Create global posts instance
window.postsSystem = new PostsSystem();
