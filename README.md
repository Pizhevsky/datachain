# Datachain — Multi-Exchange Cryptocurrency Arbitrage Platform

A Node.js backend service built as part of a larger arbitrage system, 
connecting to multiple cryptocurrency exchanges to monitor prices, 
manage user accounts, and route data to a Python-based balancing service 
via RabbitMQ.

Built as an MVP/POC during a self-employed engagement (2017–2019).

---

## Architecture Overview

This service was one component in a distributed system:

- **This repo** — Node.js/Express backend: user auth, exchange API 
  integration, session management, 2FA, REST endpoints
- **Python balancing service** (separate) — consumed messages from this 
  service via RabbitMQ to manage cross-exchange currency allocation
- **Frontend** — React/Angular dashboard for analytics, reporting, 
  and market interaction workflows
- **Infrastructure** — AWS-hosted, Nginx reverse proxy, SSL termination

## Key Features

- **Multi-exchange integration** — Bitfinex, Bittrex, Kraken, Poloniex
  and Wex, connected via their respective Node.js API clients
- **Authentication system** — Passport.js local strategy, bcrypt password 
  hashing, express-session
- **Two-factor authentication** — TOTP via Speakeasy with QR code 
  provisioning
- **RabbitMQ messaging** — Emitted exchange data to a downstream Python 
  service for arbitrage calculation and cross-exchange balancing
- **MySQL + Sequelize ORM** — Relational data layer for users, accounts, 
  and transaction records
- **reCAPTCHA + email verification** — Nodemailer, express-recaptcha for 
  registration hardening
- **Logging** — log4js structured logging throughout

## Tech Stack

| Layer | Technologies |
|---|---|
| Runtime | Node.js, Express |
| Auth | Passport.js, bcrypt, Speakeasy (2FA), express-session |
| Database | MySQL, Sequelize ORM |
| Messaging | RabbitMQ (producer side) |
| Exchange APIs | Bitfinex, Bittrex, Kraken, Poloniex, Wex |
| Templating | Express-Handlebars |
| Infrastructure | AWS, Nginx |

## Status

MVP/POC — built to validate the arbitrage concept and establish the 
integration layer. The system operated in a latency-sensitive environment 
and formed the foundation for a working multi-exchange platform.

Not actively maintained. Dependencies reflect the era (2017–2018) and 
would require updating for production use.

## Notes

Led a small engineering team across this engagement. Responsible for 
architecture decisions, backend delivery, and coordinating the 
Node.js ↔ Python ↔ exchange API integration chain.
