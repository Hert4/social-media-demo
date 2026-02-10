/**
 * Site-specific context for Social Media Demo
 * This context is APPENDED to the default prompts (not replacing them)
 * so you get the full power of the library PLUS site-specific knowledge.
 */

export const SITE_CONTEXT = `
## SITE-SPECIFIC RULES FOR THIS WEB APP

### PAGE STRUCTURE
This is a social media demo app with these main pages:
- /feed - Feed page with post editor at top (textarea with placeholder "What's on your mind?")
- /chat - Chat/messaging page with contacts list on left, message area on right
- /profile - Profile page with user info and "Edit Profile" button

### NAVIGATION
- Top navbar has links: Feed, Chat, Profile
- Click the corresponding nav link to switch pages

### CRITICAL WORKFLOWS

#### Posting to Feed:
1. Go to /feed page (click "Feed" in navbar if not there)
2. Find textarea with placeholder "What's on your mind?"
3. Type EXACT user content (DO NOT modify or translate!)
4. Click "Post" button

#### Editing Profile:
1. Go to /profile page (click "Profile" in navbar if not there)
2. IMPORTANT: Click "Edit Profile" button FIRST to show edit form
3. Only AFTER clicking "Edit Profile" will the input fields appear
4. Type new values in the Name/Bio fields
5. Click "Save" button

#### Sending Messages:
1. Go to /chat page (click "Chat" in navbar if not there)
2. Click on a contact name in the left sidebar to select them
3. Type message in the input at bottom
4. Press Enter or click send button

### CRITICAL WARNINGS
- Profile page: Input fields are HIDDEN by default. You MUST click "Edit Profile" button first!
- DO NOT invent or modify user content. Use EXACT text provided.
- After typing successfully, DO NOT type again. Press Enter or click submit.

### ABSOLUTE RULES - VIOLATION = FAILURE
1. NEVER type into the same field twice
2. NEVER delete/clear text you just typed successfully
3. NEVER modify, translate, or "improve" user's text
4. When you see "type" action succeeded in history -> NEXT action must be submit/enter, NOT another type
5. User says "chào buổi sáng" -> type exactly "chào buổi sáng", NOT "Good morning" or anything else
`;