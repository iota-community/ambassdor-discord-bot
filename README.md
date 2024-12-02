# Ambassador Program Discord Bot

This is a Discord bot for managing ambassador contributions, roles, and incentives seamlessly. The bot tracks Twitter activity, assigns points, manages roles, and handles referrals without requiring ambassadors to self-report.

## Features

### Twitter Activity Tracking

The bot connects users' Discord accounts with their Twitter accounts to monitor and assign points based on Twitter activity.

- **Supported Activity and Points**:
  - **Likes**: 0.5 point each
  - **Retweets**: 2 points each
  - **Comments**: 1 point each
  - **Impressions**: 0.05 point each

- **Tweet Monitoring**:
  - Listens to every tweet link posted in `#ambassador-tweets`.
  - If a tweet link is posted in `#ambassador-chat`, the bot verifies if the Discord user is the author of the tweet and assigns points accordingly.
  - **Point Eligibility**: Tweets are eligible for points for 72 hours after being posted on Twitter.

- **Emoji Filter**: A 🥒 (cucumber) emoji reaction applied within 24 hours of posting the tweet link in Discord will prevent points from being assigned.
- **Bonus Feature**: (Optional) Assign additional points for the top 3 tweets each epoch based on engagement.

### Role Reassignment

The bot manages roles by reassigning them every epoch (2 weeks) based on the users' accumulated points and XP decay.

- **Role Levels**:
  - **Novice**: 0-249 points, no decay
  - **Intermediate**: 250-749 points, 100 points decay per epoch
  - **Advanced**: 750-4,999 points, 250 points decay per epoch
  - **Expert**: 5,000+ points, 500 points decay per epoch

- **Decay**: Points are decayed based on the user's current role at the end of each epoch, influencing role reassignment.

### Referral System

Encourages ambassadors to refer new participants to the program.
- **Successful Referral**: 200 points awarded to an ambassador when their referral reaches the Intermediate level.
- **Continued Engagement**: An additional 100 points awarded when the referred participant reaches the Advanced level.

### Points Management

- **Manual Adjustment**: The Ambassador Management team (`Role ID: `) can manually add or deduct points using commands.
  - Example commands: `/add 500 @discordusername` and `/deduct 500 @discordusername`

### Leaderboard Display

Displays a leaderboard table within Discord to track ambassadors' points and ranks.

---

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Discord Developer Portal Application
- Twitter Developer API Access

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/iota-community/ambassdor-discord-bot.git

   cd ambassdor-discord-bot
   ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Set up environment variables:

Create a `config.json` file in the project root with the following credentials. Here’s what they are and how to obtain them:

- **`clientId`**:
  The unique ID of your bot.
  - Go to the [Discord Developer Portal](https://discord.com/developers/applications).  
  - Select your application.
  - Navigate to **OAuth2 > General** to find the `Client ID`.

- **`guildId`**:
  The unique ID of the Discord server where the bot operates.
  - In Discord, right-click the server name and select **Copy ID**.
  - *(Note: Enable Developer Mode in your Discord settings if you don’t see this option.)*

- **`token`**:
  The bot’s authentication token.
  - Go to the [Discord Developer Portal](https://discord.com/developers/applications).
  - Select your application.
  - Navigate to **Bot > Token** to copy the bot token.
  - **Important**: Keep this token secret and never share it publicly.

- **`epochStart`**:
  The starting timestamp or date for the epoch cycle.
  - Set this value manually based on your project’s epoch configuration.
  - Example: "epochStart":"Dec 27 2024, 8:53:20 PM",

- **`adminRoleId`**:
  The unique ID of the admin role in your server.
  - In Discord, go to your server settings and find the role.
  - Right-click the role and select **Copy ID**.

- **`twitter_api_key`**:  
  The API key for accessing the Twitter API.  
  - Go to the [Twitter Developer Portal](https://developer.twitter.com/).
  - Create a new project and app if you don’t already have one.
  - Navigate to **Keys and Tokens** under your app settings to find the API key.

- **`twitter_api_key_secret`**:
  The secret key corresponding to your Twitter API key.
  - Go to the **Keys and Tokens** section in your app on the [Twitter Developer Portal](https://developer.twitter.com/).
  - Copy the **API Secret Key** from the same section as the API key.

**Important**: Keep both the API key and secret key private and do not share them publicly.

Make sure to replace placeholders in your configuration file with the corresponding values before running the bot.

4. Deploy commands:

    ```bash
    node deploy-commands.js
    ```

5. Running the Bot:

    ```bash
    node index.js
    ```
The bot should now be active in your server.

## Usage

### Step 1: Invite the Bot to Your Server  

1. Use the bot's **invite URL** to add it to your Discord server.
2. Ensure the server has a channel named `#ambassador-tweets`.
3. Assign the bot the necessary permissions, including:  
   - Read Messages  
   - Send Messages  
   - Manage Roles  
   - Read Message History  
   - Add Reactions  
4. Confirm that the bot is successfully added and active in the `#ambassador-tweets` channel.

### Step 1: Test Twitter Activity Points 

1. **Link a Twitter Account** 
   - Use the `/link` command to connect your Discord account with your Twitter handle.
   - Use the `/authpin` command to validate the generated pin

2. **Post a Tweet Link** 
   - Share a tweet in the `#ambassador-tweets` channel.

3. **Check Points Assignment**
   - Verify that the bot calculates and assigns points based on the following criteria:
     - **Likes**: 0.5 points each
     - **Retweets**: 2 points each
     - **Comments**: 1 point each
     - **Impressions**: 0.05 points each
   - Confirm that points are assigned only if the tweet is not reacted to with a 🥒 emoji within 24 hours.

4. **Test Tweet Time Cutoff**
  - Post a tweet in the `#ambassador-tweets` channel that is **older than 74 hours**.
  - Confirm that the bot does **not calculate or assign points** for this tweet.

5. **Test Unlinked Twitter Accounts**
  - Post a tweet link in `#ambassador-tweets` from a Twitter account **not linked** to the Discord account.
  - Confirm the following:
    - The bot flags the tweet as **unlinked**
    - No points are assigned for the tweet.

---

### Step 2: Test Referral System  

1. Use `/refcode` command to view your referral code, and share with anyone.
    - Ask them to input this value when joing the Server
2. Confirm the following: 
   - Once code is used by the referred member, points should awared to the referrer
   - 200 points are assigned when the referred member reaches **Intermediate Level**.  
   - An additional 100 points are assigned when they reach **Advanced Level**.  

---

### Step 3: Test Role Reassignment  

1. Allow an epoch (2 weeks) but for testing purposes you can adjust it to two minutes by changing the value of `epochInSeconds` on line 8 of the ready.js file in the events directory.
2. Verify that roles are updated based on the following point ranges: 
   - **Novice Level**: 0–249 points  
   - **Intermediate Level**: 250–749 points  
   - **Advanced Level**: 750–4,999 points  
   - **Expert Level**: 5,000+ points  

3. Check that XP decay is applied correctly at the end of the epoch:  
   - **Intermediate Level**: -100 points  
   - **Advanced Level**: -250 points  
   - **Expert Level**: -500 points  

---

### Step 4: Test Admin Controls  
1. Test point adjustments using the following admin-only commands:  
   - **Add Points**: `/add` command
   - **Deduct Points**: `/deduct` command

2. Confirm that only users with the designated admin role can execute these commands.  

---

### Step 5: Verify Leaderboard Display  
1. Use the leaderboard command to display current points.  
2. Confirm that the leaderboard is correctly formatted.  


## Contributing

**This project is open source** and we welcome contributions from the community! Whether you’re looking to improve features, fix bugs, or add new functionalities, your input is valued. Join us in building a better tool for community engagement!

### How to Contribute

1. Create an issue describing what you want to fix or add
2. Fork the repository and create your branch.
3. Make your changes and submit a pull request.
4. Review feedback and adjust as necessary.

Together, we can make this bot a powerful tool for managing and growing ambassador communities! 

## License

This project is licensed under the MIT License.