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

- **Manual Adjustment**: The Ambassador Management team (`Role ID: 1298996063214239775`) can manually add or deduct points using commands.
  - Example commands: `/add 500 @discordusername` and `/deduct 500 @discordusername`

### Leaderboard Display

Displays a leaderboard table within Discord to track ambassadors' points and ranks.

### Twitter Developer Access

**Note**: Live environment testing requires a $100 Twitter developer subscription. Holger will handle the payment when notified by Gino.

---

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Discord Bot Token
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

Create a `.env` file in the project root with the following credentials.

	- "clientId": "",
	- "guildId": "",
	- "token": "",
	- "epochStart":"",
	- "adminRoleId":"",
    - "redirectURL":""

4. Deploy commands:

    ```bash
    node deploy-commands.js
    ```

5. Running the Bot:

    ```bash
    node index.js

## Usage

    - Assign Points: Points are automatically assigned based on Twitter activity and referral engagement.
    - Manual Adjustment: Use /add and /deduct commands to adjust points manually (available only to the Ambassador Management team).
    - Leaderboard: View the leaderboard within the Discord server for an updated list of points and ranks.

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