# 🧪 Video Call Feature Testing Checklist

Use this checklist to verify the 1-to-1 video call functionality.

## 📋 Prerequisites
1. Ensure the backend server is running (`npm run dev` in server)
2. Ensure the frontend client is running (`npm run dev` in client)
3. Ensure you have two different browsers (or one Incognito window) to simulate two users.
4. **Log in as User A** in Browser 1.
5. **Log in as User B** in Browser 2.
6. **Ensure User A and User B are friends** (Send/Accept friend request if needed).

---

## 🔹 Phase 1: Call Initiation
- [ ] **User A**: Navigate to "Messages" page.
- [ ] **User A**: Select conversation with **User B**.
- [ ] **User A**: Click the 📹 **Video Call icon** in the chat header.
- [ ] **Verify**:
    - [ ] **User A**: Sees "Calling..." status with a spinner.
    - [ ] **User B**: Sees an **Incoming Call Modal** with User A's name and avatar.
    - [ ] **User B**: Hears a ringtone (if implemented) or sees the visual pulse animation.

## 🔹 Phase 2: Call Acceptance & Connection
- [ ] **User B**: Click **Accept** button.
- [ ] **Verify**:
    - [ ] **User A**: "Calling..." changes to "Connected" or timer starts (00:00).
    - [ ] **User B**: Incoming modal disappears, video call screen opens.
    - [ ] **Both**: Browser asks for **Camera/Microphone permissions**. (Allow them!)
    - [ ] **Both**: Local video (self-view) appears in the bottom-right corner.
    - [ ] **Both**: Remote video (other person) appears in the main view.
    - [ ] **Both**: Audio is clear and video is moving (wave to camera).

## 🔹 Phase 3: Call Controls
- [ ] **Mute Audio**:
    - [ ] **User A**: Click 🎤 **Mute** button.
    - [ ] **Verify**: User A's microphone is muted (User B cannot hear A). Icon changes state.
    - [ ] **User A**: Click **Unmute**. Audio resumes.
- [ ] **Toggle Camera**:
    - [ ] **User B**: Click 📹 **Turn Off Camera** button.
    - [ ] **Verify**: User B's video goes black/placeholder. User A sees a placeholder avatar for User B.
    - [ ] **User B**: Click **Turn On Camera**. Video resumes.

## 🔹 Phase 4: Call Termination
- [ ] **User A**: Click 📞 **End Call** button.
- [ ] **Verify**:
    - [ ] **User A**: Call screen closes immediately.
    - [ ] **User B**: Sees "Call Ended" overlay/message, then call screen closes.
- [ ] **Check Logs** (Optional):
    - [ ] Check Server Console: Should show "Call ended: User A <-> User B".

## 🔹 Phase 5: Call Rejection
- [ ] **User A**: Call **User B** again.
- [ ] **User B**: Click ❌ **Decline** button.
- [ ] **Verify**:
    - [ ] **User B**: Incoming modal closes.
    - [ ] **User A**: Call screen closes or shows "Call Rejected" message.

## 🔹 Phase 6: Edge Cases
- [ ] **Not Friends**: Try to call a user who is not a friend (should show error).
- [ ] **Offline User**: Try to call a user who is offline (should show error or "User is offline").
- [ ] **Timeout**: Start a call and wait 30 seconds without answering.
    - [ ] **Verify**: Call automatically ends for both sides.
- [ ] **Page Navigation**:
    - [ ] Start a call.
    - [ ] **User A**: Navigate to "Feed" or "Profile" while in call.
    - [ ] **Verify**: Call overlay remains visible and active (Global context works).

## 🔹 Phase 7: Mobile Responsiveness
- [ ] Open Chrome DevTools -> Toggle Device Toolbar (Mobile view).
- [ ] Verify the video call layout looks good on mobile (controls at bottom, local video pip positioned correctly).

---

## 🐞 Troubleshooting
- **No Video?** Check if browser permissions were denied. Reset permissions in URL bar.
- **Connection Failed?** Check server console for ICE candidate errors. Ensure both users are connected to the socket server.
- **Camera Error?** Ensure no other app (Zoom, Teams) is using the camera.
