const { sendTelegramMessage } = require('./telegramUtils');

const message =
  '🥉 3rd place,  $15K: AToIoTA\nTrack:  DeF(A)i\nAn AI-powered DeFi platform on #IOTA that uses advanced artificial intelligence for portfolio optimization, whale tracking, and natural language analysis – ±making complex crypto investing more accessible. 4/6\n➡️https://t.co/Lp0zM682BZ https://t.co/QpPx7BlXIU';

const mediaGroup = [
  {
    type: 'photo',
    // media: 'https://x.com/iota/status/1932785036379475989/photo/1',
    media:
      'https://pbs.twimg.com/media/GtKhu7xXgAEsaZc?format=jpg&name=900x900',
    // "message" must be included in the first item of the media group
    caption: message,
  },
  {
    type: 'photo',
    media:
      'https://d315pvdvxi2gex.cloudfront.net/d96a337f84c5c900f31e08808.png',
  },
  {
    // If never works if "video" is specified
    type: 'photo',
    media: 'https://files.iota.org/media/IOTA-Link-NFT.mp4',
  },
];

sendTelegramMessage(message, mediaGroup);
