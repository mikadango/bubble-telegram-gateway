# Creating a Telegram Group with Topics (For Bubble ↔ Telegram Gateway)

## Why Do You Need a Telegram Group with Topics?

This gateway connects your Bubble app to a Telegram group using **topics** (also called "forum topics").
- **Topics** allow you to organize conversations by customer or subject, so each customer chat is kept separate.
- The gateway sends each new customer message to its own topic, and team replies in that topic go back to the right customer in Bubble.
- **Without topics, the gateway cannot organize conversations and will not work as intended.**

## Step-by-Step: How to Create a Telegram Group with Topics Enabled

### 1. Open Telegram
- Use the Telegram app on your phone or desktop.

### 2. Create a New Group
1. Click the **menu** (three lines or pencil icon).
2. Select **New Group**.
3. Add at least one other person (you can remove them later if needed).
4. Give your group a name (e.g., `Customer Support`).
5. Tap **Create**.

### 3. Enable Topics (Forum Mode)
1. Open your group.
2. Tap the group name at the top to open **Group Info**.
3. Tap the **Edit** (pencil) icon.
4. Go to **Group Type** or **Permissions**.
5. Find the **Topics** or **Forum** option and turn it **ON**.
   - It may be called "Enable Topics" or "Forum Mode".
6. Save your changes.

### 4. Add Your Bot to the Group
1. In the group, tap the group name to open **Group Info**.
2. Tap **Add Member** or **Invite to Group**.
3. Search for your bot (created with @BotFather) and add it.
4. **Important:**
   - Give the bot **admin rights**:
     - Can manage topics
     - Can read messages
     - Can post messages

### 5. Get the Group ID
- The group ID is needed for your `.env` file (`TELEGRAM_GROUP_ID`).
- **How to get it:**
  1. Add [@userinfobot](https://t.me/userinfobot) to your group.
  2. Type `/start` in the group.
  3. The bot will reply with the group ID (it will be a negative number, e.g., `-1001234567890`).
  4. Remove @userinfobot if you wish.

### 6. (Optional) Remove Extra Members
- If you added someone just to create the group, you can remove them now.

---

## Tips
- **Screenshots:** For each step, you can search "How to create Telegram group" or "Enable topics in Telegram group" for up-to-date screenshots.
- **Bot Permissions:** If your bot can't create topics or send messages, double-check its admin rights.
- **Group Privacy:** You can make the group private or public, as long as topics are enabled.

---

**Now your Telegram group is ready!**
- Use the group ID in your `.env` file for `TELEGRAM_GROUP_ID`.
- Add your bot token and other settings, then deploy your gateway. 