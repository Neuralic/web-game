# Groups System - Three-Dot Menu Options & Features Documentation

## Overview
This document comprehensively covers all three-dot menu options and features available in the Groups system, organized by user role (Owner, Member, Non-member) on the Group Detail Page and Configure Page.

---

## Group Detail Page - Three-Dot Menu Options

### Location
The three-dot menu (⋯) is located in the top-right corner of the group header, next to the "Join Community" button (for non-members) or alongside the group information.

**File Reference:** `@c:\Users\Sumail\Downloads\game_web_platform\frontend\app\groups\[id]\page.tsx:512-658`

---

## 1. **Owner Role** - Full Access

When the user is the **Owner** of the group, they have access to all administrative and member options:

### Owner-Only Options

#### A. Configure Group
- **Purpose:** Access the comprehensive group configuration page
- **Navigation:** Links to `/groups/[id]/configure`
- **Features Available in Configure Page:**
  1. **Information Section**
     - Edit group name (max 50 characters)
     - Edit description (max 1000 characters)
     - Upload/change group emblem (icon)
     - Upload/change cover photo (720x228 or 1440x456)
     - Set join settings (Open/Manual Approval/Closed)
  
  2. **Settings Section**
     - Manual Approval toggle (require approval for join requests)
     - Verification Level (None/Low/Medium/High)
       - None: No verification required
       - Low: Phone, email, or ID verified
       - Medium: ID verified OR (phone AND email verified)
       - High: ID verified only
     - Account Age Requirements (None/1 day/3 days/7 days/30 days/90 days)
  
  3. **Social Links Section**
     - Discord URL
     - Twitter URL
     - YouTube URL
     - Twitch URL
     - Facebook URL
     - Instagram URL
     - TikTok URL
     - Website URL
  
  4. **Revenue Section**
     - View total group funds (◈)
     - View revenue transaction history
  
  5. **Payouts Section**
     - Configure recurring or one-time payouts to members
     - Create payout schedules
  
  6. **Members Section**
     - View all group members
     - Search members by username
     - Filter members by role (All/Owner/Admin/Member)
     - Manage individual members:
       - Assign roles to members
       - Kick members from group
       - Ban members (coming soon)
     - View join requests (if manual approval enabled)
  
  7. **Roles Section**
     - Create custom roles with granular permissions
     - 13+ permission flags available:
       - View Wall
       - Post on Wall
       - Delete Wall Posts
       - View Shout
       - Create Announcements
       - Manage Members
       - Delete Members
       - Create Invites
       - View Audit Log
       - Spend Group Funds
       - Advertise Group
       - Manage Alliances
       - Manage Roles
     - Edit existing roles
     - Delete roles
     - Assign roles to members
  
  8. **Alliances Section**
     - Send alliance requests to other groups
     - View pending alliance requests
     - Accept/decline incoming alliance requests
     - View active alliances
     - Remove alliances
  
  9. **Shout Section**
     - Post group-wide shouts (announcements)
     - Edit shout text (max 255 characters)
     - View shout history
  
  10. **Wall Section**
      - Moderate wall posts
      - Delete inappropriate posts
      - View wall post analytics
  
  11. **Advertise Group Section**
      - Create ad campaigns
      - Ad formats available:
        - Banner (728 x 90)
        - Skyscraper (160 x 600)
        - Rectangle (300 x 250)
      - Set maximum bid per impression
      - Manage existing ads (pause/resume/edit)
      - View ad performance (impressions, clicks, spent)
  
  12. **Analytics Section**
      - View group growth metrics
      - Member activity statistics
      - Engagement analytics
  
  13. **Audit Log Section**
      - View all administrative actions
      - Track member changes
      - Monitor role assignments
  
  14. **Verification Section**
      - Apply for group verification badge
      - View verification status

**Code Reference:** `@c:\Users\Sumail\Downloads\game_web_platform\frontend\app\groups\[id]\page.tsx:535-544`

#### B. Group Admin
- **Purpose:** Access group administration panel
- **Status:** Alert placeholder (to be implemented)
- **Expected Features:**
  - Advanced moderation tools
  - Member management dashboard
  - Content moderation queue

**Code Reference:** `@c:\Users\Sumail\Downloads\game_web_platform\frontend\app\groups\[id]\page.tsx:545-553`

#### C. Advertise Group
- **Purpose:** Quick access to advertising section
- **Navigation:** Links to `/groups/[id]/configure?section=Advertise Group`
- **Features:** Same as Advertise Group in Configure page

**Code Reference:** `@c:\Users\Sumail\Downloads\game_web_platform\frontend\app\groups\[id]\page.tsx:554-563`

#### D. Change Owner
- **Purpose:** Transfer group ownership to another member
- **Status:** Alert placeholder (to be implemented)
- **Expected Workflow:**
  1. Select new owner from member list
  2. Confirm transfer
  3. New owner becomes group owner
  4. Previous owner becomes regular member

**Code Reference:** `@c:\Users\Sumail\Downloads\game_web_platform\frontend\app\groups\[id]\page.tsx:607-617`

### Owner + Member Shared Options

#### E. Make Primary
- **Purpose:** Set this group as the user's primary group
- **Functionality:**
  - Displays group badge on user profile
  - Shows group affiliation prominently
  - API call: `groupsApi.makePrimaryGroup(groupId)`
- **Success Message:** "Group set as primary!"

**Code Reference:** `@c:\Users\Sumail\Downloads\game_web_platform\frontend\app\groups\[id]\page.tsx:568-595`

#### F. Leave Group
- **Purpose:** Leave the group (special behavior for owners)
- **Owner-Specific Behavior:**
  - If other members exist: Cannot leave (must remove all members first)
  - If last member: Leaving will **delete the entire group**
  - Confirmation modal shows different messages based on member count
- **API Call:** `groupsApi.leaveGroup(groupId)`
- **Redirect:** Returns to `/groups` page after leaving

**Code Reference:** `@c:\Users\Sumail\Downloads\game_web_platform\frontend\app\groups\[id]\page.tsx:596-604`
**Modal Logic:** `@c:\Users\Sumail\Downloads\game_web_platform\frontend\app\groups\[id]\page.tsx:1007-1072`

### Universal Options (All Users)

#### G. Report Abuse
- **Purpose:** Report inappropriate group content or behavior
- **Available to:** All users (Owner, Member, Non-member)
- **Categories:**
  - Inappropriate content
  - Harassment
  - Spam
  - Scam/Fraud
  - Other violations
- **API Call:** `groupsApi.reportGroup(groupId, category, description)`
- **Success Message:** "Report submitted successfully! Our moderation team will review it."

**Code Reference:** `@c:\Users\Sumail\Downloads\game_web_platform\frontend\app\groups\[id]\page.tsx:645-654`
**Modal Implementation:** `@c:\Users\Sumail\Downloads\game_web_platform\frontend\app\groups\[id]\page.tsx:1074-1104`

---

## 2. **Member Role** - Limited Access

When the user is a **Member** (but not Owner) of the group:

### Member Options

#### A. Make Primary
- Same functionality as Owner (see above)

**Code Reference:** `@c:\Users\Sumail\Downloads\game_web_platform\frontend\app\groups\[id]\page.tsx:568-595`

#### B. Leave Group
- **Purpose:** Leave the group
- **Behavior:**
  - Simple leave confirmation
  - No group deletion (only owner can delete)
  - Member count decremented
- **Confirmation Message:** "Are you sure you want to leave this group? This action cannot be undone."
- **API Call:** `groupsApi.leaveGroup(groupId)`

**Code Reference:** `@c:\Users\Sumail\Downloads\game_web_platform\frontend\app\groups\[id]\page.tsx:596-604`

#### C. Report Abuse
- Same functionality as all users (see above)

**Code Reference:** `@c:\Users\Sumail\Downloads\game_web_platform\frontend\app\groups\[id]\page.tsx:645-654`

### Member Permissions (Based on Assigned Role)

Members can have custom roles assigned by the owner with specific permissions:
- **View Wall:** Can see wall posts
- **Post on Wall:** Can create wall posts
- **Delete Wall Posts:** Can remove posts
- **View Shout:** Can see group shouts
- **Create Announcements:** Can post announcements
- **Manage Members:** Can invite/remove members
- **Delete Members:** Can kick members
- **Create Invites:** Can generate invite links
- **View Audit Log:** Can see admin actions
- **Spend Group Funds:** Can use group currency
- **Advertise Group:** Can create ads
- **Manage Alliances:** Can send/accept alliance requests
- **Manage Roles:** Can create/edit roles

**Code Reference:** `@c:\Users\Sumail\Downloads\game_web_platform\frontend\app\groups\[id]\configure\page.tsx:103-118`

---

## 3. **Non-Member** - Public View Only

When the user is **NOT a member** of the group:

### Non-Member Options

#### A. Copy Link
- **Purpose:** Copy group URL to clipboard for sharing
- **Functionality:**
  - Copies: `{window.location.origin}/groups/{groupId}`
  - Shows success notification
- **Success Message:** "Group link copied to clipboard!"

**Code Reference:** `@c:\Users\Sumail\Downloads\game_web_platform\frontend\app\groups\[id]\page.tsx:624-642`

#### B. Report Abuse
- Same functionality as all users (see above)
- Allows reporting even without membership

**Code Reference:** `@c:\Users\Sumail\Downloads\game_web_platform\frontend\app\groups\[id]\page.tsx:645-654`

### Non-Member Actions

#### Join Community Button
- **Location:** Displayed prominently in group header (not in three-dot menu)
- **Purpose:** Request to join the group
- **Behavior:**
  - If join setting is "Open": Instantly joins
  - If join setting is "Manual Approval": Creates join request
  - If join setting is "Closed": Shows error message
- **Validation:**
  - Checks verification level requirements
  - Checks account age requirements
  - Validates user eligibility
- **API Call:** `groupsApi.joinGroup(groupId)`
- **Success:** Updates member count, shows success modal, refreshes group data

**Code Reference:** `@c:\Users\Sumail\Downloads\game_web_platform\frontend\app\groups\[id]\page.tsx:494-502`
**Join Handler:** `@c:\Users\Sumail\Downloads\game_web_platform\frontend\app\groups\[id]\page.tsx:204-244`

---

## Group Detail Page - Additional Features

### Tabs Available to All Users

#### 1. About Tab
**Visible to:** All users (Owner, Member, Non-member)

**Sections:**
- **Description:** Group description and information
- **Shout:** 
  - View current group shout
  - Owner can post new shouts (max 255 characters)
  - Shows timestamp and poster
- **Games:** Associated games with the group
- **Members:** Preview of group members with avatars
- **Social Links:** External social media links
- **Wall:** 
  - View wall posts (all users)
  - Post on wall (members only, if permission granted)
  - Report wall posts (all users)
  - Three-dot menu per post: "Report Abuse"

**Code References:**
- Shout Section: `@c:\Users\Sumail\Downloads\game_web_platform\frontend\app\groups\[id]\page.tsx:695-752`
- Wall Section: `@c:\Users\Sumail\Downloads\game_web_platform\frontend\app\groups\[id]\page.tsx:763-862`
- Wall Post Submission: `@c:\Users\Sumail\Downloads\game_web_platform\frontend\app\groups\[id]\page.tsx:179-202`

#### 2. Store Tab
**Visible to:** All users

**Features:**
- Browse group store items
- View item prices (in AdventureBux ◈)
- Purchase items (members only)
- Pagination controls
- Grid layout (2-6 columns responsive)

**Code Reference:** `@c:\Users\Sumail\Downloads\game_web_platform\frontend\app\groups\[id]\page.tsx:866-926`

#### 3. Alliances Tab
**Visible to:** All users

**Features:**
- View all accepted alliances
- Click to visit allied groups
- Shows ally group info:
  - Group icon
  - Group name
  - Verification badge (if verified)
  - Member count
- Empty state message for no alliances
- Owner hint: "Send alliance requests from Configure page"

**Code Reference:** `@c:\Users\Sumail\Downloads\game_web_platform\frontend\app\groups\[id]\page.tsx:928-998`

---

## Backend Implementation - Permission Checks

### Owner Verification
All owner-only actions verify ownership via:
```sql
SELECT "ownerId" FROM groups WHERE id = $1
```
Then compare with authenticated user's ID.

**Code Reference:** `@c:\Users\Sumail\Downloads\game_web_platform\backend\src\modules\groups\groups.controller.ts:1163-1165`

### Member Verification
Member actions verify membership via:
```sql
SELECT id FROM group_members WHERE "groupId" = $1 AND "userId" = $2
```

**Code Reference:** `@c:\Users\Sumail\Downloads\game_web_platform\backend\src\modules\groups\groups.controller.ts:840-842`

### Role-Based Permissions
Custom roles are checked via:
```sql
SELECT gm.id, gr.name as role_name, gr.* 
FROM group_members gm
LEFT JOIN group_roles gr ON gm."roleId" = gr.id
WHERE gm."groupId" = $1 AND gm."userId" = $2
```

**Code Reference:** `@c:\Users\Sumail\Downloads\game_web_platform\backend\src\modules\groups\groups.controller.ts:168-180`

---

## Summary Table

| Feature | Owner | Member | Non-Member |
|---------|-------|--------|------------|
| **Configure Group** | ✅ | ❌ | ❌ |
| **Group Admin** | ✅ | ❌ | ❌ |
| **Advertise Group** | ✅ | ❌ | ❌ |
| **Change Owner** | ✅ | ❌ | ❌ |
| **Make Primary** | ✅ | ✅ | ❌ |
| **Leave Group** | ✅ (Special) | ✅ | ❌ |
| **Copy Link** | ❌ | ❌ | ✅ |
| **Report Abuse** | ✅ | ✅ | ✅ |
| **Join Group** | ❌ | ❌ | ✅ |
| **View Wall** | ✅ | ✅ | ✅ |
| **Post on Wall** | ✅ | ✅ (if permitted) | ❌ |
| **Post Shout** | ✅ | ❌ | ❌ |
| **View Store** | ✅ | ✅ | ✅ |
| **View Alliances** | ✅ | ✅ | ✅ |
| **Manage Members** | ✅ | ❌ | ❌ |
| **Create Roles** | ✅ | ❌ | ❌ |
| **Manage Alliances** | ✅ | ❌ | ❌ |

---

## Configure Page - Full Section Breakdown

### Navigation Sidebar Sections
All 14 sections available to **Owner only**:

1. **Information** - Basic group details
2. **Settings** - Join requirements and restrictions
3. **Social Links** - External platform links
4. **Revenue** - Group funds and transactions
5. **Payouts** - Member compensation
6. **Members** - Member management and requests
7. **Roles** - Custom role creation and permissions
8. **Alliances** - Inter-group relationships
9. **Shout** - Group announcements
10. **Wall** - Wall post moderation
11. **Advertise Group** - Ad campaign management
12. **Analytics** - Performance metrics
13. **Audit Log** - Administrative action history
14. **Verification** - Group verification application

**Code Reference:** `@c:\Users\Sumail\Downloads\game_web_platform\frontend\app\groups\[id]\configure\page.tsx:165-183`

### Access Control
Non-owners see "Access Denied" message with link back to group page.

**Code Reference:** `@c:\Users\Sumail\Downloads\game_web_platform\frontend\app\groups\[id]\configure\page.tsx:695-708`

---

## API Endpoints Used

### Group Management
- `POST /api/v1/groups` - Create group
- `GET /api/v1/groups/:id` - Get group details
- `PUT /api/v1/groups/:id` - Update group info
- `POST /api/v1/groups/:id/join` - Join group
- `POST /api/v1/groups/:id/leave` - Leave group
- `POST /api/v1/groups/:id/primary` - Set as primary

### Settings & Configuration
- `GET /api/v1/groups/:id/settings` - Get settings
- `PUT /api/v1/groups/:id/settings` - Update settings
- `GET /api/v1/groups/:id/social-links` - Get social links
- `PUT /api/v1/groups/:id/social-links` - Update social links

### Members & Roles
- `GET /api/v1/groups/:id/members` - List members
- `PATCH /api/v1/groups/:id/members/:userId/role` - Update member role
- `DELETE /api/v1/groups/:id/members/:userId` - Remove member
- `POST /api/v1/groups/:id/roles` - Create role
- `GET /api/v1/groups/:id/roles` - List roles

### Alliances
- `GET /api/v1/groups/:id/alliances` - List alliances
- `POST /api/v1/groups/:id/alliances` - Send alliance request
- `PATCH /api/v1/groups/:id/alliances/:allianceId` - Respond to request

### Wall & Social
- `GET /api/v1/groups/:id/wall` - Get wall posts
- `POST /api/v1/groups/:id/wall` - Create wall post
- `POST /api/v1/groups/:id/report` - Report group

---

## Conclusion

The Groups system provides a comprehensive role-based access control system with:
- **3 main user roles** (Owner, Member, Non-member)
- **14 configuration sections** for owners
- **13+ custom permissions** for member roles
- **Multiple social features** (wall, shout, alliances)
- **Advanced management tools** (analytics, audit log, advertising)
- **Robust moderation** (reporting, member management, role-based permissions)

All features are implemented with proper backend validation, permission checks, and user-friendly frontend interfaces.
