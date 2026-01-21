# Group Roles & Alliances - Complete Use Case Scenarios

This document outlines complete user journeys for managing group roles and alliances from a user perspective.

---

## 🎭 USER PERSONAS

### 1. **Alex (Group Owner)**
- Created "Epic Gamers" group
- Has 50 members
- Wants to organize team with roles
- Wants to partner with other groups

### 2. **Jordan (Group Admin)**
- Member of "Epic Gamers"
- Assigned "Admin" role by Alex
- Can manage members but not change group settings

### 3. **Taylor (Regular Member)**
- Joined "Epic Gamers" recently
- Has default "Member" role
- Can post on wall but limited permissions

### 4. **Sam (Another Group Owner)**
- Owns "Pro Players" group
- Wants to form alliance with "Epic Gamers"

---

## 📍 WHERE USERS ACCESS FEATURES

### **Main Group Page** (`/groups/[id]`)
**Everyone can see:**
- Group information (name, icon, cover photo, description)
- Member count
- Group games
- Group wall posts
- **Allied groups section** (shows accepted alliances)

**Members can see:**
- "Leave Group" button
- Their current role badge

**Owner sees:**
- "Configure Group" button (leads to management page)

### **Group Configuration Page** (`/groups/[id]/configure`)
**Owner-only access** - Contains tabs:
- Information
- Settings
- Social Links
- Revenue
- Payouts
- **Members** ⭐
- **Roles** ⭐
- **Alliances** ⭐
- Shout
- Wall
- Advertise Group
- Analytics
- Audit Log
- Verification

---

## 🎯 SCENARIO 1: Group Owner Creates Custom Roles

### **User Story:**
*"As Alex (group owner), I want to create different roles for my team members so I can organize my group better."*

### **Step-by-Step Journey:**

#### **Step 1: Navigate to Roles Management**
1. Alex visits their group page: `/groups/abc123`
2. Clicks **"Configure Group"** button (only visible to owner)
3. Redirected to: `/groups/abc123/configure`
4. Clicks **"Roles"** tab in the left sidebar

#### **Step 2: View Existing Roles**
Alex sees the current role structure:
```
┌─────────────────────────────────────────┐
│ ROLES                                   │
├─────────────────────────────────────────┤
│ ▶ Owner (Rank 255)                      │
│   - All permissions                     │
│   - Cannot be edited/deleted            │
│   - 1 member (Alex)                     │
│                                         │
│ ▶ Member (Rank 0)                       │
│   - Basic permissions                   │
│   - Default role for new joiners        │
│   - 49 members                          │
└─────────────────────────────────────────┘
```

#### **Step 3: Create "Admin" Role**
1. Alex clicks **"Create Role"** button
2. A modal/form appears with fields:
   ```
   Role Name: [Admin________________]
   Description: [Trusted administrators who help manage the group]
   Rank: [200____] (0-255, higher = more authority)
   
   PERMISSIONS:
   □ Manage Members (kick users)
   □ Ban Members  
   □ Manage Roles (assign roles to others)
   □ Post on Wall
   □ Delete Wall Posts
   □ Post Group Shout
   □ Manage Store Items
   □ Manage Group Games
   □ View Audit Logs
   □ Manage Alliances
   □ Manage Ads
   □ Spend Group Funds
   □ Create Invites
   ```

3. Alex checks these permissions for Admin role:
   - ✅ Manage Members
   - ✅ Delete Wall Posts
   - ✅ Post on Wall
   - ✅ Post Group Shout
   - ✅ View Audit Logs
   - ❌ Manage Roles (keeps this for himself)
   - ❌ Spend Group Funds (keeps this for himself)

4. Clicks **"Save Role"**
5. API Call: `POST /api/v1/groups/abc123/roles`
   ```json
   {
     "name": "Admin",
     "rank": 200,
     "description": "Trusted administrators who help manage the group",
     "canManageMembers": true,
     "canManageRoles": false,
     "canPostOnWall": true,
     "canDeleteWallPosts": true,
     "canPostShout": true,
     "canManageStore": false,
     "canManageGames": false,
     "canViewAuditLogs": true,
     "canManageAlliances": false,
     "canManageAds": false,
     "canSpendGroupFunds": false,
     "canCreateInvites": true,
     "canBanMembers": false
   }
   ```
6. Success message: "Role 'Admin' created successfully!"

#### **Step 4: Create "Moderator" Role**
Alex repeats the process for a lower-rank role:
- Name: "Moderator"
- Rank: 100
- Permissions: Can delete wall posts, post on wall, view audit logs

#### **Step 5: Create "Game Developer" Role**
- Name: "Game Developer"
- Rank: 150
- Permissions: Can manage group games, post on wall

**Final Role Hierarchy:**
```
Rank 255: Owner (Alex)
Rank 200: Admin
Rank 150: Game Developer
Rank 100: Moderator
Rank 0:   Member (default)
```

---

## 🎯 SCENARIO 2: Assigning Roles to Members

### **User Story:**
*"As Alex (group owner), I want to promote Jordan to Admin so they can help me manage the group."*

### **Step-by-Step Journey:**

#### **Step 1: Navigate to Members Tab**
1. Alex is in `/groups/abc123/configure`
2. Clicks **"Members"** tab
3. Sees list of all 50 members

#### **Step 2: Search for Jordan**
```
┌─────────────────────────────────────────────────────┐
│ MEMBERS (50)                                        │
├─────────────────────────────────────────────────────┤
│ Search: [Jordan___________________] 🔍              │
│                                                     │
│ Filter by Role: [All Roles ▼]                      │
├─────────────────────────────────────────────────────┤
│ 👤 Alex (You)              Role: Owner      [•••]  │
│ 👤 Jordan                  Role: Member ▼   [•••]  │
│ 👤 Taylor                  Role: Member ▼   [•••]  │
│ ...                                                 │
└─────────────────────────────────────────────────────┘
```

#### **Step 3: Change Jordan's Role**
1. Alex finds Jordan in the list
2. Clicks the role dropdown next to Jordan's name
3. Dropdown shows available roles:
   ```
   [ Member        ]  ← Currently selected
   [ Moderator     ]
   [ Game Developer]
   [ Admin         ] ← Alex selects this
   ```
4. Alex selects **"Admin"**
5. Confirmation modal appears:
   ```
   ┌─────────────────────────────────────────┐
   │ Promote Jordan to Admin?                │
   ├─────────────────────────────────────────┤
   │ Jordan will gain the following          │
   │ permissions:                            │
   │                                         │
   │ ✅ Manage Members                        │
   │ ✅ Delete Wall Posts                     │
   │ ✅ Post Group Shout                      │
   │ ✅ View Audit Logs                       │
   │ ✅ Create Invites                        │
   │                                         │
   │ [Cancel]  [Confirm Promotion]           │
   └─────────────────────────────────────────┘
   ```
6. Alex clicks **"Confirm Promotion"**
7. API Call: `PATCH /api/v1/groups/abc123/members/jordan-id/role`
   ```json
   {
     "roleId": "admin-role-uuid"
   }
   ```
8. Success message: "Jordan promoted to Admin successfully!"
9. Jordan now has Admin badge on group page

#### **What Jordan Sees Now:**
- Jordan visits the group page
- Sees their new "Admin" badge next to their name
- Can now access some management features (based on permissions)
- **Cannot** access full "Configure Group" page (only owner can)
- **Can** kick members, delete wall posts, create announcements

---

## 🎯 SCENARIO 3: Creating an Alliance Between Groups

### **User Story:**
*"As Alex (Epic Gamers owner), I want to form an alliance with Sam's group (Pro Players) to cross-promote our communities."*

### **Step-by-Step Journey:**

#### **PART A: Sending Alliance Request**

##### **Step 1: Navigate to Alliances Tab**
1. Alex goes to `/groups/abc123/configure`
2. Clicks **"Alliances"** tab
3. Sees current alliance status:
   ```
   ┌─────────────────────────────────────────────────────┐
   │ ALLIANCES (0)                                       │
   ├─────────────────────────────────────────────────────┤
   │ 📋 Tabs: [Current Allies] [Pending Requests]       │
   ├─────────────────────────────────────────────────────┤
   │                                                     │
   │ You currently have no alliances.                   │
   │                                                     │
   │ [+ Send Alliance Request]                          │
   └─────────────────────────────────────────────────────┘
   ```

##### **Step 2: Send Alliance Request**
1. Alex clicks **"+ Send Alliance Request"** button
2. A modal appears:
   ```
   ┌─────────────────────────────────────────┐
   │ Send Alliance Request                   │
   ├─────────────────────────────────────────┤
   │ Search for a group:                     │
   │ [Pro Players_______________] 🔍         │
   │                                         │
   │ Results:                                │
   │ 👥 Pro Players                          │
   │    150 members • Verified ✓            │
   │    [Send Request]                       │
   │                                         │
   │ 👥 Pro Gaming Squad                     │
   │    45 members                           │
   │    [Send Request]                       │
   └─────────────────────────────────────────┘
   ```

3. Alex finds "Pro Players" and clicks **"Send Request"**
4. API Call: `POST /api/v1/groups/abc123/alliances`
   ```json
   {
     "alliedGroupId": "def456"
   }
   ```
5. Success message: "Alliance request sent to Pro Players!"
6. Status changes to "Pending":
   ```
   ┌─────────────────────────────────────────────────────┐
   │ SENT REQUESTS (1)                                   │
   ├─────────────────────────────────────────────────────┤
   │ 👥 Pro Players                                      │
   │    150 members • Verified ✓                        │
   │    Status: ⏳ Pending (Sent 2 minutes ago)         │
   │    [Cancel Request]                                │
   └─────────────────────────────────────────────────────┘
   ```

#### **PART B: Receiving and Accepting Alliance Request**

##### **Step 1: Sam Gets Notification**
1. Sam (owner of Pro Players) logs into AdventureBlox
2. Sees notification: "Epic Gamers sent you an alliance request"
3. Clicks notification or goes to their group's configure page

##### **Step 2: Sam Reviews the Request**
1. Sam navigates to `/groups/def456/configure`
2. Clicks **"Alliances"** tab
3. Clicks **"Pending Requests"** sub-tab
4. Sees incoming request:
   ```
   ┌─────────────────────────────────────────────────────┐
   │ INCOMING ALLIANCE REQUESTS (1)                      │
   ├─────────────────────────────────────────────────────┤
   │ 👥 Epic Gamers                                      │
   │    50 members                                       │
   │    Requested 5 minutes ago                          │
   │                                                     │
   │    [View Group]  [Accept]  [Decline]               │
   └─────────────────────────────────────────────────────┘
   ```

##### **Step 3: Sam Accepts the Alliance**
1. Sam clicks **"View Group"** to check out Epic Gamers (opens in new tab)
2. Likes what they see, returns to alliance request
3. Clicks **"Accept"** button
4. Confirmation modal:
   ```
   ┌─────────────────────────────────────────┐
   │ Accept Alliance with Epic Gamers?       │
   ├─────────────────────────────────────────┤
   │ Both groups will:                       │
   │ • Be listed on each other's group page  │
   │ • Have cross-promotion benefits         │
   │ • Be able to see alliance in public     │
   │                                         │
   │ [Cancel]  [Accept Alliance]             │
   └─────────────────────────────────────────┘
   ```
5. Sam clicks **"Accept Alliance"**
6. API Call: `PATCH /api/v1/groups/def456/alliances/xyz789`
   ```json
   {
     "action": "accept"
   }
   ```
7. Success message: "Alliance with Epic Gamers accepted!"

##### **Step 4: Both Groups See the Alliance**

**Alex's View (Epic Gamers):**
```
┌─────────────────────────────────────────────────────┐
│ CURRENT ALLIES (1)                                  │
├─────────────────────────────────────────────────────┤
│ 👥 Pro Players                                      │
│    150 members • Verified ✓                        │
│    Allied since: Today                              │
│                                                     │
│    [Visit Group]  [Remove Alliance]                │
└─────────────────────────────────────────────────────┘
```

**Sam's View (Pro Players):**
```
┌─────────────────────────────────────────────────────┐
│ CURRENT ALLIES (1)                                  │
├─────────────────────────────────────────────────────┤
│ 👥 Epic Gamers                                      │
│    50 members                                       │
│    Allied since: Today                              │
│                                                     │
│    [Visit Group]  [Remove Alliance]                │
└─────────────────────────────────────────────────────┘
```

##### **Step 5: Public Display**

**On Epic Gamers Main Page** (`/groups/abc123`):
```
┌─────────────────────────────────────────────────────┐
│ About Epic Gamers                                   │
│ ...                                                 │
├─────────────────────────────────────────────────────┤
│ 🤝 ALLIED GROUPS (1)                                │
├─────────────────────────────────────────────────────┤
│ 👥 Pro Players                    [Visit] →         │
│    150 members • Verified ✓                        │
└─────────────────────────────────────────────────────┘
```

**On Pro Players Main Page** (`/groups/def456`):
```
┌─────────────────────────────────────────────────────┐
│ About Pro Players                                   │
│ ...                                                 │
├─────────────────────────────────────────────────────┤
│ 🤝 ALLIED GROUPS (1)                                │
├─────────────────────────────────────────────────────┤
│ 👥 Epic Gamers                    [Visit] →         │
│    50 members                                       │
└─────────────────────────────────────────────────────┘
```

---

## 🎯 SCENARIO 4: Removing an Alliance

### **User Story:**
*"As Sam, I want to end the alliance with Epic Gamers because we're going in different directions."*

### **Step-by-Step Journey:**

#### **Step 1: Navigate to Alliances**
1. Sam goes to `/groups/def456/configure`
2. Clicks **"Alliances"** tab
3. Sees "Current Allies" tab

#### **Step 2: Remove Alliance**
1. Sam finds Epic Gamers in the alliance list
2. Clicks **"Remove Alliance"** button
3. Confirmation modal:
   ```
   ┌─────────────────────────────────────────┐
   │ Remove Alliance with Epic Gamers?       │
   ├─────────────────────────────────────────┤
   │ ⚠️ This action will:                     │
   │ • Remove alliance from both groups      │
   │ • Stop cross-promotion                  │
   │ • Be visible in audit logs              │
   │                                         │
   │ This cannot be undone.                  │
   │                                         │
   │ [Cancel]  [Remove Alliance]             │
   └─────────────────────────────────────────┘
   ```
4. Sam clicks **"Remove Alliance"**
5. API Call: `DELETE /api/v1/groups/def456/alliances/xyz789`
6. Success message: "Alliance removed successfully"
7. Alliance disappears from both groups immediately

---

## 🎯 SCENARIO 5: Regular Member Using Roles

### **User Story:**
*"As Taylor (regular member), I want to understand what I can and cannot do in the group."*

### **What Taylor Sees:**

#### **On Group Main Page:**
```
┌─────────────────────────────────────────────────────┐
│ EPIC GAMERS                                         │
│ 👤 You are a Member                                 │
├─────────────────────────────────────────────────────┤
│ [Post on Wall]  [View Games]  [Leave Group]        │
└─────────────────────────────────────────────────────┘
```

#### **Permissions Taylor Has (Member role):**
- ✅ Post on group wall
- ✅ View group wall posts
- ✅ View group games
- ✅ View allied groups
- ✅ Leave group
- ❌ Delete others' wall posts
- ❌ Kick members
- ❌ Post group shout
- ❌ Manage anything

#### **What Happens if Taylor Tries Restricted Action:**
1. Taylor tries to kick another member (if they somehow access the UI)
2. API returns error: `403 Forbidden - "You don't have permission to manage members"`
3. Frontend shows: "You need the 'Manage Members' permission to do this"

---

## 🎯 SCENARIO 6: Declining an Alliance Request

### **User Story:**
*"As Sam, I received an alliance request from a group I don't want to ally with."*

### **Step-by-Step Journey:**

#### **Step 1: View Request**
1. Sam sees alliance request from "Toxic Trolls" group
2. Navigates to alliances → Pending Requests tab

#### **Step 2: Decline Request**
1. Clicks **"Decline"** next to the request
2. Confirmation modal:
   ```
   ┌─────────────────────────────────────────┐
   │ Decline Alliance with Toxic Trolls?     │
   ├─────────────────────────────────────────┤
   │ The other group will not be notified   │
   │ why you declined.                       │
   │                                         │
   │ [Cancel]  [Decline]                     │
   └─────────────────────────────────────────┘
   ```
3. Sam clicks **"Decline"**
4. API Call: `PATCH /api/v1/groups/def456/alliances/abc999`
   ```json
   {
     "action": "decline"
   }
   ```
5. Request removed from list
6. "Toxic Trolls" sees their request status changed to "Declined"

---

## 📱 COMPLETE UI FLOW DIAGRAM

```
GROUP PAGE (/groups/:id)
│
├─ Public View
│  ├─ Group Info
│  ├─ Wall Posts
│  ├─ Games
│  └─ 🤝 Allied Groups (visible to all)
│
└─ [Configure Group] (Owner only) → /groups/:id/configure
   │
   ├─ Members Tab
   │  ├─ Search members
   │  ├─ Filter by role
   │  ├─ View member list
   │  └─ Change member roles ⚡
   │     └─ API: PATCH /groups/:id/members/:userId/role
   │
   ├─ Roles Tab ⭐
   │  ├─ View all roles
   │  ├─ [Create Role] button
   │  │  └─ API: POST /groups/:id/roles
   │  ├─ Edit role
   │  │  └─ API: PATCH /groups/:id/roles/:roleId
   │  └─ Delete role
   │     └─ API: DELETE /groups/:id/roles/:roleId
   │
   └─ Alliances Tab ⭐
      ├─ Current Allies sub-tab
      │  ├─ View accepted alliances
      │  │  └─ API: GET /groups/:id/alliances
      │  ├─ [Visit Group] button
      │  └─ [Remove Alliance] button
      │     └─ API: DELETE /groups/:id/alliances/:allianceId
      │
      └─ Pending Requests sub-tab
         ├─ Outgoing requests (you sent)
         │  └─ [Cancel Request]
         │
         ├─ Incoming requests (you received)
         │  └─ API: GET /groups/:id/alliances/requests
         │
         ├─ [+ Send Alliance Request] button
         │  └─ API: POST /groups/:id/alliances
         │
         └─ [Accept] / [Decline] buttons
            └─ API: PATCH /groups/:id/alliances/:allianceId
```

---

## 🔐 PERMISSION MATRIX

| Action | Member | Moderator | Game Dev | Admin | Owner |
|--------|--------|-----------|----------|-------|-------|
| View group | ✅ | ✅ | ✅ | ✅ | ✅ |
| Post on wall | ✅ | ✅ | ✅ | ✅ | ✅ |
| Delete wall posts | ❌ | ✅ | ❌ | ✅ | ✅ |
| Kick members | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manage roles | ❌ | ❌ | ❌ | ❌ | ✅ |
| Create roles | ❌ | ❌ | ❌ | ❌ | ✅ |
| Manage games | ❌ | ❌ | ✅ | ❌ | ✅ |
| Send alliance request | ❌ | ❌ | ❌ | ❌ | ✅ |
| Accept alliance | ❌ | ❌ | ❌ | ❌ | ✅ |
| View audit logs | ❌ | ✅ | ❌ | ✅ | ✅ |
| Spend group funds | ❌ | ❌ | ❌ | ❌ | ✅ |
| Post shout | ❌ | ❌ | ❌ | ✅ | ✅ |
| Transfer ownership | ❌ | ❌ | ❌ | ❌ | ✅ |
| Delete group | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 🎨 VISUAL MOCKUP DESCRIPTION

### **Alliances Tab Layout:**

```
┌────────────────────────────────────────────────────────────┐
│ ALLIANCES                                                  │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ [Current Allies (3)] [Pending Requests (1)]              │
│ ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔                                        │
│                                                            │
│ ┌────────────────────────────────────────────────────┐   │
│ │ 👥 Pro Players                           [Visit] → │   │
│ │    150 members • Verified ✓                        │   │
│ │    Allied since: Jan 15, 2026                      │   │
│ │    [Remove Alliance]                                │   │
│ └────────────────────────────────────────────────────┘   │
│                                                            │
│ ┌────────────────────────────────────────────────────┐   │
│ │ 👥 Adventure Squad                       [Visit] → │   │
│ │    89 members                                       │   │
│ │    Allied since: Jan 10, 2026                      │   │
│ │    [Remove Alliance]                                │   │
│ └────────────────────────────────────────────────────┘   │
│                                                            │
│ [+ Send New Alliance Request]                            │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### **Roles Tab Layout:**

```
┌────────────────────────────────────────────────────────────┐
│ ROLES                                                      │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Left Panel:          │ Right Panel:                        │
│ ┌──────────────┐    │ ┌─────────────────────────────┐   │
│ │ Owner ⭐      │    │ │ Role: Admin                 │   │
│ ├──────────────┤    │ │ Rank: 200                   │   │
│ │ Admin        │◄───│ │                             │   │
│ ├──────────────┤    │ │ Description:                │   │
│ │ Game Dev     │    │ │ [Trusted administrators...] │   │
│ ├──────────────┤    │ │                             │   │
│ │ Moderator    │    │ │ PERMISSIONS:                │   │
│ ├──────────────┤    │ │ ☑ Manage Members            │   │
│ │ Member       │    │ │ ☐ Manage Roles              │   │
│ └──────────────┘    │ │ ☑ Post on Wall              │   │
│ [+ Create Role]     │ │ ☑ Delete Wall Posts         │   │
│                     │ │ ☑ Post Shout                │   │
│                     │ │ ☑ View Audit Logs           │   │
│                     │ │                             │   │
│                     │ │ [Save Changes] [Delete Role]│   │
│                     │ └─────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```

---

## 🚀 IMPLEMENTATION CHECKLIST

To make these scenarios work, you need:

**Backend (✅ Already Done):**
- [x] Roles API endpoints
- [x] Alliances API endpoints
- [x] Permission checking in controllers
- [x] Database migrations

**Frontend (Needs Implementation):**
- [ ] Alliances tab UI in configure page
- [ ] Alliance request modal/form
- [ ] Accept/decline alliance buttons
- [ ] Allied groups display on main group page
- [ ] Role creation/editing UI improvements
- [ ] Role assignment dropdown in members list
- [ ] Permission checkboxes in role editor

**Testing:**
- [ ] Create multiple test groups
- [ ] Test role creation and assignment
- [ ] Test alliance request flow
- [ ] Test permission enforcement
- [ ] Test edge cases (self-alliance, duplicate requests)

---

## 📚 QUICK REFERENCE

### **API Endpoints Summary:**

**Roles:**
- `GET /api/v1/groups/:id/roles` - Get all roles
- `POST /api/v1/groups/:id/roles` - Create role
- `PATCH /api/v1/groups/:id/roles/:roleId` - Update role
- `DELETE /api/v1/groups/:id/roles/:roleId` - Delete role
- `PATCH /api/v1/groups/:id/members/:userId/role` - Assign role

**Alliances:**
- `GET /api/v1/groups/:id/alliances` - Get accepted alliances (public)
- `GET /api/v1/groups/:id/alliances/requests` - Get pending requests (owner)
- `POST /api/v1/groups/:id/alliances` - Send alliance request (owner)
- `PATCH /api/v1/groups/:id/alliances/:allianceId` - Accept/decline (owner)
- `DELETE /api/v1/groups/:id/alliances/:allianceId` - Remove alliance (owner)

### **Frontend API Calls:**
```typescript
// Roles
groupsApi.getGroupRoles(groupId)
groupsApi.createGroupRole(groupId, roleData)
groupsApi.updateGroupRole(groupId, roleId, updates)
groupsApi.deleteGroupRole(groupId, roleId)
groupsApi.updateMemberRole(groupId, userId, roleId)

// Alliances
groupsApi.getGroupAlliances(groupId)
groupsApi.getAllianceRequests(groupId)
groupsApi.sendAllianceRequest(groupId, alliedGroupId)
groupsApi.respondToAllianceRequest(groupId, allianceId, "accept"|"decline")
groupsApi.removeAlliance(groupId, allianceId)
```

---

This document provides complete user journeys from a real user's perspective. Use this as a guide when building the frontend UI!
