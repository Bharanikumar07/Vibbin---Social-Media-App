# Auto-Delete Feature for Posts and Stories

## Overview
The Vibbin app now includes an **automatic cleanup system** that deletes posts and stories that are older than 24 hours. This keeps the content fresh and mimics popular social media features like Instagram Stories.

## How It Works

### Cleanup Schedule
- **Frequency**: Runs automatically every hour
- **Cron Expression**: `0 * * * *` (at the start of every hour)
- **Service**: `server/src/utils/cleanup.ts`

### What Gets Deleted
1. **Posts**: Any post created more than 24 hours ago
2. **Stories**: Any story created more than 24 hours ago

### Technical Implementation

#### Dependencies
- **node-cron**: Schedules periodic cleanup tasks
- **@prisma/client**: Database operations for deletion

#### Cleanup Logic
```typescript
const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

// Delete posts older than 24 hours
await prisma.post.deleteMany({
    where: {
        createdAt: {
            lt: twentyFourHoursAgo
        }
    }
});

// Delete stories older than 24 hours
await prisma.story.deleteMany({
    where: {
        createdAt: {
            lt: twentyFourHoursAgo
        }
    }
});
```

### Server Integration
The cleanup service starts automatically when the server launches:

```typescript
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    startCleanupJobs(); // ✅ Auto-cleanup activated
});
```

### Console Logging
When the cleanup runs, you'll see logs like:
```
🗑️  Cleanup completed at 2026-01-13T11:00:00.000Z
   - Deleted 5 posts older than 24 hours
   - Deleted 12 stories older than 24 hours
```

## Benefits

1. **Fresh Content**: Keeps the feed current and relevant
2. **Storage Optimization**: Prevents database bloat
3. **Privacy**: Temporary content is truly temporary
4. **Performance**: Reduces query load on older data

## Configuration

To modify the cleanup interval or age threshold:

### Change Cleanup Frequency
Edit the cron expression in `cleanup.ts`:
- Every hour: `'0 * * * *'`
- Every 6 hours: `'0 */6 * * *'`
- Daily at midnight: `'0 0 * * *'`

### Change Age Threshold
Modify the time calculation:
- 24 hours: `24 * 60 * 60 * 1000`
- 12 hours: `12 * 60 * 60 * 1000`
- 48 hours: `48 * 60 * 60 * 1000`

## Files Modified

1. **`server/src/utils/cleanup.ts`** - Cleanup service (NEW)
2. **`server/src/index.ts`** - Server integration
3. **`server/package.json`** - Added dependencies

## Future Enhancements

Potential improvements:
- [ ] Soft delete (mark as deleted but keep in DB)
- [ ] User-configurable post lifetime
- [ ] Archive feature before deletion
- [ ] Email notification before auto-delete
- [ ] Exclude pinned posts from auto-deletion

---

**Note**: The cleanup runs silently in the background. No user action is required!
