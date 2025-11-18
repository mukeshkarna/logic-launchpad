# Super Admin Features Documentation

## Overview

The BlogHub platform includes a comprehensive Super Admin panel for managing users, content, and platform settings. This document outlines all admin features and how to use them.

## Table of Contents

- [Access & Authentication](#access--authentication)
- [Dashboard Overview](#dashboard-overview)
- [User Management](#user-management)
- [Content Moderation](#content-moderation)
- [Leaderboards](#leaderboards)
- [Platform Settings](#platform-settings)
- [Reports & Moderation](#reports--moderation)
- [Audit Logs](#audit-logs)
- [API Reference](#api-reference)

## Access & Authentication

### Creating the Super Admin

Run the seed script to create the default super admin user:

```bash
# From the backend directory
cd backend
npm run prisma:seed
```

**Default Credentials:**
- Email: `admin@bloghub.com`
- Username: `superadmin`
- Password: `admin123456` (change immediately after first login!)

### User Roles

The platform supports three role levels:

1. **USER** - Regular platform users
2. **MODERATOR** - Can manage content and users, cannot change roles
3. **SUPER_ADMIN** - Full platform access, can manage everything

## Dashboard Overview

**URL:** `/admin`

The admin dashboard provides real-time platform statistics:

### Key Metrics

- **Total Users**: Current user count with growth percentage
- **Published Blogs**: Total published blogs vs drafts
- **Total Views**: Aggregate views across all content
- **Total Engagement**: Combined likes and comments
- **Active Users**: Activity over last 7 and 30 days

### Trend Analytics

- **Registration Trend**: User sign-ups over time (7/30/90 days)
- **Publication Trend**: Blog publications over time
- **Engagement Trend**: Views, likes, and comments tracking

### Quick Actions

Direct links to:
- User Management
- Content Moderation
- Leaderboards
- Platform Settings

## User Management

**URL:** `/admin/users`

### Features

#### User List View
- **Search**: Find users by name, username, or email
- **Filter by Role**: USER, MODERATOR, SUPER_ADMIN
- **Filter by Status**: ACTIVE, SUSPENDED, BANNED
- **Sort**: By join date, activity, blog count
- **Pagination**: 20 users per page

#### User Details
Each user card shows:
- Full name, username, email
- Current role and status
- Total blogs published
- Join date
- Quick action buttons

#### User Actions

**Suspend User**
```
Action: Temporarily disable account
Required: Reason for suspension
Effect: User cannot log in, content remains visible
Who can do it: MODERATOR, SUPER_ADMIN
```

**Ban User**
```
Action: Permanently disable account
Required: Reason for ban
Effect: User cannot log in, content hidden
Who can do it: SUPER_ADMIN only
```

**Reinstate User**
```
Action: Restore suspended/banned account
Effect: User regains full access
Who can do it: MODERATOR, SUPER_ADMIN
```

**Change User Role**
```
Action: Promote/demote user
Options: USER → MODERATOR → SUPER_ADMIN
Who can do it: SUPER_ADMIN only
```

**Delete User**
```
Action: Permanently delete user and all content
Warning: IRREVERSIBLE
Who can do it: SUPER_ADMIN only
```

### User Statistics Page

**URL:** `/admin/users/[userId]`

Detailed user analytics:
- Total blogs (published/draft)
- Total views, likes, comments received
- Average views per blog
- Engagement rate
- Publishing frequency
- Account timeline
- Recent activity
- Moderation notes
- Action history

## Content Moderation

**URL:** `/admin/content` (implementation placeholder)

### Blog Management

#### Filters
- Search by title or content
- Filter by status (DRAFT, PUBLISHED, ARCHIVED)
- Filter by author
- Show only reported content
- Show only featured content

#### Blog Actions

**Edit Content**
- Full Tip Tap editor access
- Modify title, content, excerpt
- Change tags/categories
- Add moderation notes

**Feature/Unfeature**
- Mark blogs for homepage display
- Featured blogs get priority placement

**Unpublish**
- Change status to DRAFT
- Removes from public view
- Author retains access

**Delete**
- Permanently remove blog
- Cannot be undone

**Bulk Operations**
- Select multiple blogs
- Bulk delete
- Bulk unpublish
- Bulk feature/unfeature

### Moderation Notes

Add internal notes visible only to admins:
- Target: User or Blog
- Persistent history
- Track moderation decisions
- Include moderator attribution

## Leaderboards

**URL:** `/admin/leaderboards`

### Top Bloggers

Metrics available:
- **Most Views**: Total views across all blogs
- **Most Likes**: Total likes received
- **Most Comments**: Total comments received
- **Highest Engagement**: Engagement rate (likes+comments/views)

### Top Blogs

Metrics available:
- **Most Views**: Individual blog views
- **Most Likes**: Individual blog likes
- **Most Comments**: Individual blog comments
- **Trending**: Recent high-engagement content

### Rising Stars

New users (joined within 30 days) with exceptional performance:
- Minimum 100 total views
- Ranked by average views per blog
- Shows join date and stats

### Time Filters

- All time
- Last 7 days
- Last 30 days
- Last 90 days

### Export Options (Future Enhancement)

- CSV export
- PDF reports
- Email scheduled summaries

## Platform Settings

**URL:** `/admin/settings` (implementation placeholder)

### Available Settings

```typescript
{
  site_name: string,              // Platform display name
  site_description: string,       // SEO description
  registration_enabled: boolean,  // Allow new sign-ups
  email_verification_required: boolean,
  comment_moderation: string,     // 'auto_approve' | 'review_all' | 'review_first'
  max_upload_size: number,        // Bytes
  featured_blogs_count: number,   // Homepage featured blogs
  trending_algorithm: string      // 'views' | 'engagement' | 'recent'
}
```

### Modifying Settings

**API Call:**
```typescript
PUT /api/admin/settings
{
  key: 'site_name',
  value: 'My Blog Platform',
  description: 'Optional description'
}
```

## Reports & Moderation

### Report Types

- **SPAM**: Automated or irrelevant content
- **INAPPROPRIATE**: Violates community standards
- **HARASSMENT**: Abusive or threatening content
- **COPYRIGHT**: Copyright infringement
- **OTHER**: Custom reason

### Report Workflow

1. **User submits report** (any authenticated user)
2. **Report appears in admin queue** with PENDING status
3. **Admin reviews** content and context
4. **Admin takes action**:
   - Resolve: Fix issue, mark resolved
   - Dismiss: No action needed
   - Edit content: Fix the problem
   - Unpublish: Remove from view
   - Ban user: Severe violations

5. **Add resolution note** explaining decision

### Report Statistics

- Total reports received
- Pending vs resolved
- Average resolution time
- Most common report types

## Audit Logs

**URL:** `/admin/audit-log` (via API)

Every admin action is logged with:
- **Action type**: USER_SUSPENDED, BLOG_DELETED, etc.
- **Admin who performed it**: Username and role
- **Target**: What was affected (user, blog, setting)
- **Details**: Additional context
- **Timestamp**: When it occurred
- **IP address**: Where action originated

### Tracked Actions

```
USER_ROLE_UPDATED
USER_SUSPENDED
USER_BANNED
USER_REINSTATED
USER_DELETED
BLOG_UPDATED
BLOG_DELETED
BLOG_FEATURED
BLOG_UNFEATURED
REPORT_RESOLVED
REPORT_DISMISSED
MODERATION_NOTE_ADDED
SETTINGS_UPDATED
SETTING_DELETED
BULK_BLOG_DELETE
BULK_BLOG_UNPUBLISH
BULK_BLOG_FEATURE
```

### Querying Audit Logs

```typescript
GET /api/admin/audit-log?page=1&limit=50&action=USER_SUSPENDED&adminId=xyz
```

## API Reference

### Authentication

All admin endpoints require:
1. Valid JWT token
2. Role of MODERATOR or SUPER_ADMIN

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

### Endpoints

#### Dashboard
```
GET  /api/admin/dashboard/stats
GET  /api/admin/dashboard/registration-trend?days=30
GET  /api/admin/dashboard/publication-trend?days=30
GET  /api/admin/dashboard/engagement-trend?days=30
```

#### Leaderboards
```
GET  /api/admin/leaderboard/top-bloggers?metric=views&limit=10&days=30
GET  /api/admin/leaderboard/top-blogs?metric=trending&limit=10
GET  /api/admin/leaderboard/rising-stars?limit=10
```

#### User Management
```
GET    /api/admin/users?page=1&search=john&role=USER&status=ACTIVE
GET    /api/admin/users/:userId
PUT    /api/admin/users/:userId/role                (SUPER_ADMIN only)
POST   /api/admin/users/:userId/suspend
POST   /api/admin/users/:userId/ban                 (SUPER_ADMIN only)
POST   /api/admin/users/:userId/reinstate
DELETE /api/admin/users/:userId                     (SUPER_ADMIN only)
```

#### Content Moderation
```
GET    /api/admin/blogs?page=1&status=PUBLISHED&isReported=true
PUT    /api/admin/blogs/:blogId
DELETE /api/admin/blogs/:blogId
POST   /api/admin/blogs/:blogId/toggle-feature
POST   /api/admin/blogs/bulk-delete
POST   /api/admin/blogs/bulk-unpublish
POST   /api/admin/blogs/bulk-feature
```

#### Reports
```
GET  /api/admin/reports?status=PENDING
POST /api/admin/reports
POST /api/admin/reports/:reportId/resolve
POST /api/admin/reports/:reportId/dismiss
```

#### Moderation Notes
```
GET  /api/admin/notes/:targetType/:targetId
POST /api/admin/notes
```

#### Platform Settings
```
GET    /api/admin/settings
PUT    /api/admin/settings                          (SUPER_ADMIN only)
DELETE /api/admin/settings/:key                     (SUPER_ADMIN only)
```

#### Audit Log
```
GET /api/admin/audit-log?page=1&action=USER_SUSPENDED
```

## Security Considerations

### Access Control
- All routes protected by RBAC middleware
- Role verification on every request
- Suspended/banned users cannot access admin panel

### Action Logging
- Every admin action logged automatically
- Immutable audit trail
- Includes IP address for accountability

### Rate Limiting
- Recommended: Implement rate limiting on admin endpoints
- Protect against abuse

### Two-Factor Authentication (Future Enhancement)
- Require 2FA for SUPER_ADMIN accounts
- SMS or authenticator app verification

## Best Practices

1. **Change Default Password**: Immediately after setup
2. **Regular Audits**: Review audit logs weekly
3. **Moderate Reports**: Address reports within 24-48 hours
4. **Document Decisions**: Always add moderation notes
5. **Backup Data**: Before bulk operations
6. **Monitor Trends**: Watch for unusual patterns
7. **Clear Communication**: Explain suspensions/bans to users
8. **Progressive Discipline**: Warnings before bans

## Troubleshooting

### "Access Denied" Error
- Verify user role is MODERATOR or SUPER_ADMIN
- Check JWT token is valid and not expired
- Ensure user status is ACTIVE

### Analytics Not Loading
- Check database connection
- Verify sufficient data exists
- Check browser console for errors

### Bulk Operations Failing
- Verify all target IDs are valid UUIDs
- Check for permission errors
- Review server logs

## Future Enhancements

- Real-time notifications for new reports
- Advanced search with Elasticsearch
- Export dashboards as PDF
- Email digest for admins
- Content recommendation algorithm tuning
- A/B testing for homepage layout
- Advanced fraud detection
- IP-based access restrictions
- Scheduled content publishing
- Content approval workflows

---

For technical support or feature requests, please open an issue on the GitHub repository.
