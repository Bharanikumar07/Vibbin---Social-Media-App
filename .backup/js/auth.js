// Authentication and User Management System
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // Initialize default users if database is empty
        if (!localStorage.getItem('pingup_users')) {
            this.initializeDefaultUsers();
        }

        // Check if user is already logged in
        const sessionUser = sessionStorage.getItem('pingup_current_user');
        if (sessionUser) {
            this.currentUser = JSON.parse(sessionUser);
        }
    }

    initializeDefaultUsers() {
        const defaultUsers = [
            {
                id: 'user_001',
                fullname: 'Bharani Kumar GV',
                email: 'bharani@example.com',
                password: 'password123', // In production, hash this!
                username: '@bharanikumar',
                bio: 'Software Developer | Tech Enthusiast | Building amazing things',
                avatar: 'https://i.pravatar.cc/120?img=60',
                cover: 'https://picsum.photos/seed/cover1/1200/300',
                friends: ['user_002', 'user_003'],
                friendRequests: [],
                pendingRequests: ['user_004'],
                posts: 15,
                followers: 342,
                following: 187,
                createdAt: new Date().toISOString()
            },
            {
                id: 'user_002',
                fullname: 'Sarah Johnson',
                email: 'sarah@example.com',
                password: 'password123',
                username: '@sarahjohnson',
                bio: 'Designer | Creative | Love aesthetics',
                avatar: 'https://i.pravatar.cc/120?img=5',
                cover: 'https://picsum.photos/seed/cover2/1200/300',
                friends: ['user_001'],
                friendRequests: [],
                pendingRequests: [],
                posts: 28,
                followers: 892,
                following: 234,
                createdAt: new Date().toISOString()
            },
            {
                id: 'user_003',
                fullname: 'Mike Chen',
                email: 'mike@example.com',
                password: 'password123',
                username: '@mikechen',
                bio: 'Product Manager | Coffee lover ☕',
                avatar: 'https://i.pravatar.cc/120?img=12',
                cover: 'https://picsum.photos/seed/cover3/1200/300',
                friends: ['user_001'],
                friendRequests: [],
                pendingRequests: [],
                posts: 42,
                followers: 567,
                following: 301,
                createdAt: new Date().toISOString()
            },
            {
                id: 'user_004',
                fullname: 'Emma Wilson',
                email: 'emma@example.com',
                password: 'password123',
                username: '@emmawilson',
                bio: 'Marketing Expert | Digital Nomad 🌍',
                avatar: 'https://i.pravatar.cc/120?img=9',
                cover: 'https://picsum.photos/seed/cover4/1200/300',
                friends: [],
                friendRequests: ['user_001'],
                pendingRequests: [],
                posts: 33,
                followers: 723,
                following: 456,
                createdAt: new Date().toISOString()
            }
        ];

        localStorage.setItem('pingup_users', JSON.stringify(defaultUsers));
    }

    getAllUsers() {
        const users = localStorage.getItem('pingup_users');
        return users ? JSON.parse(users) : [];
    }

    saveUsers(users) {
        localStorage.setItem('pingup_users', JSON.stringify(users));
    }

    getUserByEmail(email) {
        const users = this.getAllUsers();
        return users.find(user => user.email.toLowerCase() === email.toLowerCase());
    }

    getUserById(userId) {
        const users = this.getAllUsers();
        return users.find(user => user.id === userId);
    }

    // Sign Up
    signUp(fullname, email, password) {
        const users = this.getAllUsers();

        // Check if email already exists
        if (this.getUserByEmail(email)) {
            return { success: false, message: 'Email already registered' };
        }

        // Create new user
        const newUser = {
            id: 'user_' + Date.now(),
            fullname: fullname,
            email: email,
            password: password, // In production, hash this!
            username: '@' + fullname.toLowerCase().replace(/\s+/g, ''),
            bio: 'New to pingup! 👋',
            avatar: `https://i.pravatar.cc/120?img=${Math.floor(Math.random() * 70)}`,
            cover: `https://picsum.photos/seed/cover${Date.now()}/1200/300`,
            friends: [],
            friendRequests: [],
            pendingRequests: [],
            posts: 0,
            followers: 0,
            following: 0,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        this.saveUsers(users);

        return { success: true, message: 'Account created successfully', user: newUser };
    }

    // Sign In
    signIn(email, password) {
        const user = this.getUserByEmail(email);

        if (!user) {
            return { success: false, message: 'User not found' };
        }

        if (user.password !== password) {
            return { success: false, message: 'Incorrect password' };
        }

        // Set current user session
        this.currentUser = user;
        sessionStorage.setItem('pingup_current_user', JSON.stringify(user));

        return { success: true, message: 'Login successful', user: user };
    }

    // Sign Out
    signOut() {
        this.currentUser = null;
        sessionStorage.removeItem('pingup_current_user');
        window.location.href = 'index.html';
    }

    // Get current logged-in user
    getCurrentUser() {
        if (!this.currentUser) {
            const sessionUser = sessionStorage.getItem('pingup_current_user');
            if (sessionUser) {
                this.currentUser = JSON.parse(sessionUser);
            }
        }
        return this.currentUser;
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.getCurrentUser() !== null;
    }

    // Protect pages (redirect to login if not authenticated)
    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = 'index.html';
            return false;
        }
        return true;
    }

    // Update user profile
    updateUserProfile(userId, updates) {
        const users = this.getAllUsers();
        const userIndex = users.findIndex(u => u.id === userId);

        if (userIndex === -1) {
            return { success: false, message: 'User not found' };
        }

        users[userIndex] = { ...users[userIndex], ...updates };
        this.saveUsers(users);

        // Update current user if it's the same user
        if (this.currentUser && this.currentUser.id === userId) {
            this.currentUser = users[userIndex];
            sessionStorage.setItem('pingup_current_user', JSON.stringify(this.currentUser));
        }

        return { success: true, user: users[userIndex] };
    }

    // Send friend request
    sendFriendRequest(fromUserId, toUserId) {
        const users = this.getAllUsers();
        const fromUser = users.find(u => u.id === fromUserId);
        const toUser = users.find(u => u.id === toUserId);

        if (!fromUser || !toUser) {
            return { success: false, message: 'User not found' };
        }

        // Check if already friends
        if (fromUser.friends.includes(toUserId)) {
            return { success: false, message: 'Already friends' };
        }

        // Check if request already sent
        if (toUser.friendRequests.includes(fromUserId)) {
            return { success: false, message: 'Request already sent' };
        }

        // Add to pending requests
        toUser.friendRequests.push(fromUserId);
        fromUser.pendingRequests.push(toUserId);

        this.saveUsers(users);

        return { success: true, message: 'Friend request sent' };
    }

    // Accept friend request
    acceptFriendRequest(userId, requesterId) {
        const users = this.getAllUsers();
        const user = users.find(u => u.id === userId);
        const requester = users.find(u => u.id === requesterId);

        if (!user || !requester) {
            return { success: false, message: 'User not found' };
        }

        // Remove from friend requests
        user.friendRequests = user.friendRequests.filter(id => id !== requesterId);
        requester.pendingRequests = requester.pendingRequests.filter(id => id !== userId);

        // Add to friends
        user.friends.push(requesterId);
        requester.friends.push(userId);

        // Update followers/following counts
        user.followers++;
        requester.following++;

        this.saveUsers(users);

        // Update current user session
        if (this.currentUser && this.currentUser.id === userId) {
            this.currentUser = user;
            sessionStorage.setItem('pingup_current_user', JSON.stringify(user));
        }

        return { success: true, message: 'Friend request accepted' };
    }

    // Reject friend request
    rejectFriendRequest(userId, requesterId) {
        const users = this.getAllUsers();
        const user = users.find(u => u.id === userId);
        const requester = users.find(u => u.id === requesterId);

        if (!user || !requester) {
            return { success: false, message: 'User not found' };
        }

        // Remove from friend requests
        user.friendRequests = user.friendRequests.filter(id => id !== requesterId);
        requester.pendingRequests = requester.pendingRequests.filter(id => id !== userId);

        this.saveUsers(users);

        // Update current user session
        if (this.currentUser && this.currentUser.id === userId) {
            this.currentUser = user;
            sessionStorage.setItem('pingup_current_user', JSON.stringify(user));
        }

        return { success: true, message: 'Friend request rejected' };
    }

    // Remove friend
    removeFriend(userId, friendId) {
        const users = this.getAllUsers();
        const user = users.find(u => u.id === userId);
        const friend = users.find(u => u.id === friendId);

        if (!user || !friend) {
            return { success: false, message: 'User not found' };
        }

        // Remove from friends
        user.friends = user.friends.filter(id => id !== friendId);
        friend.friends = friend.friends.filter(id => id !== userId);

        // Update followers/following counts
        user.followers--;
        friend.following--;

        this.saveUsers(users);

        return { success: true, message: 'Friend removed' };
    }

    // Get friend requests for user
    getFriendRequests(userId) {
        const user = this.getUserById(userId);
        if (!user) return [];

        return user.friendRequests.map(requesterId => this.getUserById(requesterId));
    }

    // Get friends for user
    getFriends(userId) {
        const user = this.getUserById(userId);
        if (!user) return [];

        return user.friends.map(friendId => this.getUserById(friendId));
    }
}

// Create global auth instance
window.authSystem = new AuthSystem();
