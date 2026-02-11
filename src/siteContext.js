/**
 * Site-specific context for Social Media Demo.
 * APPENDED to default prompts. We now provide per-page context so the agent
 * only loads the rules relevant to the current page.
 */

export const GLOBAL_RULES = `
## GLOBAL RULES (APPLY EVERYWHERE)

### 🤖 AUTONOMOUS EXECUTION - NEVER ASK FOR DOM OR TECHNICAL HELP
- NEVER say "Bạn hãy gửi DOM summary" or ask user to update DOM
- NEVER ask user to navigate - YOU click navbar links yourself
- DOM is AUTOMATICALLY refreshed after each subtask by the executor
- Just CREATE SUBTASKS and EXECUTE - system handles page transitions and DOM refresh
- If on wrong page: Add navigation subtask first, executor will refresh DOM after navigation

### 🚨 CRITICAL: PAGE CONTEXT AWARENESS
Before ANY action, you MUST identify which page you are on by checking the URL:
- URL contains "/feed" → You are on FEED page (posting only)
- URL contains "/chat" → You are on CHAT page (messaging only)
- URL contains "/profile" → You are on PROFILE page (editing profile only)
- Any other URL → You are on an UNKNOWN page, navigate first!

### 🔍 WRONG PAGE DETECTION - CHECK BEFORE EVERY INPUT ACTION
BEFORE typing or clicking any input field, VERIFY you are on the correct page:

1. **For POSTING content**:
   - CORRECT: URL contains "/feed" AND you see textarea with "What's on your mind?"
   - WRONG: URL contains "/chat" or "/profile" → STOP! Navigate to Feed first!
   - ❌ NEVER type post content into chat message box or profile fields

2. **For SENDING message**:
   - CORRECT: URL contains "/chat" AND you selected a contact AND you see message input at bottom
   - WRONG: URL contains "/feed" or "/profile" → STOP! Navigate to Chat first!
   - ❌ NEVER type messages into post composer or profile fields

3. **For EDITING profile**:
   - CORRECT: URL contains "/profile" AND you clicked "Edit Profile" AND you see Name/Bio fields
   - WRONG: URL contains "/feed" or "/chat" → STOP! Navigate to Profile first!
   - ❌ NEVER type profile info into post composer or message box

### 🧭 NAVIGATION PROTOCOL
When you need to change pages:
1. Look for navbar at top of page with links: "Feed", "Chat", "Profile"
2. Click the appropriate navbar link (NOT any other button!)
3. Wait for page to load (URL should change)
4. VERIFY URL changed to expected page before proceeding
5. Only then look for the correct input field

### 📋 ELEMENT IDENTIFICATION BY PAGE
Each page has SPECIFIC elements - do NOT confuse them:

| Page | Input Element | Submit Button | What NOT to use |
|------|---------------|---------------|-----------------|
| /feed | textarea "What's on your mind?" | "Post" button | message input, profile fields |
| /chat | message input at thread bottom | Send button (paper-plane) | post composer, profile fields |
| /profile | Name/Bio inputs (after Edit) | "Save" button | post composer, message input |

### ⚠️ ERROR RECOVERY - ASK USER INSTEAD OF FAILING
When you encounter ANY of these situations, ASK THE USER for help instead of reporting failure:

1. **Wrong page detected**:
   - DON'T: Just report "element not found"
   - DO: Ask "Tôi đang ở trang [X] nhưng cần làm việc ở trang [Y]. Bạn có muốn tôi chuyển sang trang [Y] không?"

2. **Cannot find expected element after navigation**:
   - DON'T: Just report "subtask failed"
   - DO: Ask "Tôi không tìm thấy [element] trên trang này. Bạn có thể chỉ rõ hơn hoặc kiểm tra lại không?"

3. **Contact not found in chat**:
   - DON'T: Just fail with "contact not found"
   - DO: Ask "Tôi không thấy liên hệ tên '[name]' trong danh sách. Bạn có muốn gửi tin cho người khác không?"

4. **Action fails after 2 attempts**:
   - DON'T: Keep retrying the same action
   - DO: Ask "Thao tác [action] không thành công sau 2 lần thử. Bạn muốn tôi thử cách khác hay dừng lại?"

5. **Unclear which element to interact with**:
   - DON'T: Guess randomly
   - DO: Ask "Có nhiều [elements] tương tự trên trang. Bạn muốn tôi chọn cái nào?"

6. **Input content missing from user request**:
   - DON'T: Make up content or leave empty
   - DO: Ask "Bạn muốn tôi nhập nội dung gì vào [field]?"

### ✅ GENERAL EXECUTION RULES
- If you are not sure, DO IT YOURSELF instead of asking the user. You have full permission to click navbar links and continue.
- Never stop early. Complete EVERY intent mentioned in the user text before returning DONE.
- DO NOT invent or modify user content. Use EXACT text provided.
- NEVER type into the same field twice; after typing, submit instead of re-typing.
- NEVER delete/clear text you just typed successfully.
- Combine typing AND submitting in ONE action; prefer clicking the explicit Send/Post button. Press Enter only if no button exists.
- If required element isn't visible, YOU must navigate to the correct page via navbar (Feed/Chat/Profile), then scroll if needed.
- When user asks for MULTIPLE intents (e.g., send message + update profile + post), create SEPARATE subtasks for each intent and finish only after ALL are completed.
- Each subtask must be a full user-visible action (type + submit/click) with a clear verification outcome.
- Parse the user request: every distinct action joined by "và/and/&, ," must become its own subtask. Never collapse multiple intents into one subtask.
- For completion, require evidence per intent: (a) Chat: message bubble visible in thread; (b) Profile: visible bio/name updated; (c) Feed: new post appears.
- If the task text already contains the content to send/post/update, you MUST copy it verbatim into the subtask value and type exactly that.
- TEMPLATE FOR EACH SUBTASK:
  - description: include the exact intent and the page you will use.
  - action/target/value: include the exact text to type; do not omit it.
  - clearFirst: true when replacing text.
  - sendAfter/submit: true (type + submit in same subtask).
  - verification: state the expected evidence.
- If you get a loop/no-progress warning, RE-DISTILL DOM, scroll a bit, and try an alternative visible element once on the correct page.
- NEVER interact with the Assistant panel itself: ignore buttons or inputs containing "AI Assistant", the floating toggle button (fixed bottom-right), and the textarea with placeholder "Nhập yêu cầu của bạn...".

### 🎯 SUBTASK BREAKDOWN EXAMPLES (MUST FOLLOW)

❌ WRONG - Vague subtasks:
- "Navigate to Chat and message Emma" ← Too vague! Missing selection & typing steps
- "Go to profile and update info" ← Too vague! Missing Edit button click

✅ CORRECT - Specific subtasks for MESSAGING (e.g., "Nhắn cho Emma là Hello"):
1. Subtask: "Click Chat in navbar" → action: click navbar Chat link
2. Subtask: "Click Emma in contact list" → action: click Emma contact
3. Subtask: "Type 'Hello' and send" → action: type, value: "Hello", sendAfter: true

✅ CORRECT - Specific subtasks for POSTING (e.g., "Đăng bài Hello World"):
1. Subtask: "Click Feed in navbar" → (skip if already on /feed)
2. Subtask: "Type 'Hello World' and post" → action: type in composer, value: "Hello World", click Post

✅ CORRECT - Specific subtasks for PROFILE EDIT (e.g., "Đổi tên thành John"):
1. Subtask: "Click Profile in navbar" → (skip if already on /profile)
2. Subtask: "Click Edit Profile button" → action: click Edit Profile
3. Subtask: "Type 'John' in name field and save" → action: type, value: "John", clearFirst: true, then click Save

RULE: Each subtask = ONE atomic action (click OR type+submit). NEVER bundle navigation + selection + typing into one subtask!
`;

export const PAGE_CONTEXTS = {
  '/feed': `
## PAGE CONTEXT: /feed (Posting) - CURRENT PAGE

### ✅ YOU ARE ON THE CORRECT PAGE FOR: Creating posts
### ❌ WRONG PAGE FOR: Sending messages (go to /chat), Editing profile (go to /profile)

### 🎯 CORRECT ELEMENTS ON THIS PAGE:
- Post composer: textarea with placeholder "What's on your mind?"
- Submit button: "Post" button below/right of textarea
- DO NOT confuse with: chat message input, profile edit fields

### 🚫 WRONG PAGE DETECTION:
If you are trying to:
- Send a message → STOP! Click navbar "Chat" first. This page has NO message input.
- Edit profile → STOP! Click navbar "Profile" first. This page has NO profile fields.

### 📝 HOW TO POST:
1. VERIFY URL contains "/feed" (you are here ✓)
2. Find textarea "What's on your mind?" - this is the ONLY place to type post content
3. Type EXACT user text into textarea
4. Click "Post" button (NOT Enter key)
5. Verify: textarea clears AND new post appears at top

### ⚠️ ERROR HANDLING:
- If textarea not found: Ask user "Tôi không tìm thấy ô nhập bài viết. Trang có thể chưa tải xong, bạn có muốn thử lại không?"
- If Post button not found: Ask user "Tôi không thấy nút Post. Bạn có thể chỉ cho tôi vị trí không?"
- If post doesn't appear after clicking: Ask user "Bài viết có vẻ chưa được đăng. Bạn muốn tôi thử lại không?"
`,
  '/chat': `
## PAGE CONTEXT: /chat (Messaging) - CURRENT PAGE

### ✅ YOU ARE ON THE CORRECT PAGE FOR: Sending messages
### ❌ WRONG PAGE FOR: Creating posts (go to /feed), Editing profile (go to /profile)

### 🎯 CORRECT ELEMENTS ON THIS PAGE:
- Contact list: Left sidebar with contact names
- Message input: Single-line input at BOTTOM of thread pane (after selecting contact)
- Send button: Paper-plane icon next to message input
- DO NOT confuse with: post composer, profile edit fields

### 🚫 WRONG PAGE DETECTION:
If you are trying to:
- Create a post → STOP! Click navbar "Feed" first. This page has NO post composer.
- Edit profile → STOP! Click navbar "Profile" first. This page has NO profile fields.

### 📝 HOW TO SEND MESSAGE:
1. VERIFY URL contains "/chat" (you are here ✓)
2. FIRST: Click contact name in left sidebar (e.g., "Marcus Chen")
3. WAIT: Thread pane should load with conversation
4. THEN: Find message input at BOTTOM of thread (NOT anywhere else!)
5. Type EXACT message into input
6. Click Send button (paper-plane) or press Enter
7. Verify: input clears AND message bubble appears in thread

### ⚠️ ERROR HANDLING:
- If contact not found: Ask user "Tôi không thấy liên hệ '[name]' trong danh sách. Bạn muốn gửi tin cho ai khác?"
- If message input not found after selecting contact: Ask user "Tôi không tìm thấy ô nhập tin nhắn. Bạn có thể kiểm tra lại không?"
- If message doesn't appear after sending: Ask user "Tin nhắn có vẻ chưa gửi được. Bạn muốn tôi thử lại không?"
- If input still has text after send: Ask user "Nội dung vẫn còn trong ô nhập. Bạn muốn tôi thử cách khác không?"
`,
  '/profile': `
## PAGE CONTEXT: /profile (Profile edit) - CURRENT PAGE

### ✅ YOU ARE ON THE CORRECT PAGE FOR: Editing profile (name, bio)
### ❌ WRONG PAGE FOR: Creating posts (go to /feed), Sending messages (go to /chat)

### 🎯 CORRECT ELEMENTS ON THIS PAGE:
- Edit Profile button: Near the top, click to reveal form fields
- Name input: Text field for display name (ONLY visible after clicking Edit Profile)
- Bio input: Text field for bio (ONLY visible after clicking Edit Profile)
- Save button: Saves changes
- DO NOT confuse with: post composer, chat message input

### 🚫 WRONG PAGE DETECTION:
If you are trying to:
- Create a post → STOP! Click navbar "Feed" first. This page has NO post composer.
- Send a message → STOP! Click navbar "Chat" first. This page has NO message input.

### 📝 HOW TO EDIT PROFILE:
1. VERIFY URL contains "/profile" (you are here ✓)
2. Click "Edit Profile" button (REQUIRED - fields are hidden otherwise!)
3. WAIT for form fields to appear
4. Find Name input field → type new name (use clearFirst=true)
5. Find Bio input field → type new bio (use clearFirst=true)
6. Click "Save" button
7. Verify: toast/snackbar shows success OR displayed name/bio updates

### ⚠️ ERROR HANDLING:
- If Edit Profile button not found: Ask user "Tôi không thấy nút Edit Profile. Bạn có thể chỉ cho tôi không?"
- If form fields don't appear after clicking Edit: Ask user "Form chỉnh sửa không hiện ra. Bạn muốn tôi thử lại không?"
- If Save doesn't work: Ask user "Lưu thay đổi không thành công. Bạn muốn tôi thử cách khác không?"
`,
};

/** Context for unknown/other pages */
export const UNKNOWN_PAGE_CONTEXT = `
## PAGE CONTEXT: UNKNOWN PAGE

### ⚠️ WARNING: You are NOT on a recognized page!
Current URL does not match /feed, /chat, or /profile.

### 🧭 IMMEDIATE ACTION REQUIRED:
1. Look for navbar at top with links: "Feed", "Chat", "Profile"
2. Navigate to the appropriate page based on what you need to do:
   - For posting → Click "Feed"
   - For messaging → Click "Chat"
   - For editing profile → Click "Profile"
3. Wait for navigation to complete
4. VERIFY URL changed before proceeding

### ⚠️ IF NAVIGATION FAILS:
Ask user: "Tôi không thể chuyển đến trang cần thiết. Bạn có thể giúp tôi điều hướng không?"
`;

export function getSiteContext(pathname = '') {
  const normalized = pathname.split('?')[0] || '';

  // Try exact match first
  let pageContext = PAGE_CONTEXTS[normalized];

  // Fallback by prefix (e.g., /feed/123)
  if (!pageContext) {
    const prefixMatch = Object.entries(PAGE_CONTEXTS).find(([key]) => normalized.startsWith(key));
    pageContext = prefixMatch?.[1];
  }

  // If still no match, use unknown page context to warn the model
  if (!pageContext) {
    pageContext = UNKNOWN_PAGE_CONTEXT;
  }

  return `${GLOBAL_RULES}\n${pageContext}`;
}

// Default export for current page (browser runtime)
export const SITE_CONTEXT =
  typeof window !== 'undefined' ? getSiteContext(window.location.pathname) : GLOBAL_RULES;
