# Ambassador Program Discord Bot

Implemented by IOTA Foundation.

## Introduction

This is a Discord bot for managing ambassador contributions, roles, and incentives seamlessly. The bot tracks Twitter activity, assigns points, manages roles, and etc. In addition, there is also another Twitter-Telegram bot for forwarding the latest tweets on `iota` and `iotalabs_` to a Telegram group.

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Discord Developer Portal Application
- Twitter Developer API Access
- Telegram bot know-how

### Installation

`npm i`

### Configuration

Copy the sample config file `config.example.json` to `config.json` and edit accordingly.

### Lint check

`npm run lint`

### Format code

`npm run format`

### Start locally

`npm start`

## Deploy on server with Docker

### Config

Copy the sample config file `config.example.json` to `config.json` and edit accordingly.

### Build

`docker compose build`

### Start

`docker compose up -d`

### Stop

`docker compose down -t1`

### View logs

`docker logs -tf ambassdor-discord-bot`
