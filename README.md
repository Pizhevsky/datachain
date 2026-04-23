# Datachain — Multi-Exchange Cryptocurrency Arbitrage Platform

Node.js/Express and AngularJS-based MVP/POC developed as part of a broader cryptocurrency arbitrage platform.

The project combined a backend/API layer, an included web frontend for account and authentication flows, integration with multiple cryptocurrency exchanges, and communication with a separate Python balancing component through RabbitMQ.

Built during a self-employed engagement. The core platform was assembled in roughly 3 months to validate the arbitrage concept in practice.

---

## Overview

Datachain was built for a technically demanding product idea: a multi-exchange cryptocurrency arbitrage platform operating in a latency-sensitive environment.

At the start of the project, the domain itself was new to me: AWS, cryptocurrency trading, exchange APIs, and arbitrage workflows. The challenge was not only to learn those areas quickly, but to turn that understanding into a working platform within a short timeframe.

The result was an MVP that:

- connected 5 cryptocurrency exchanges
- unified different exchange response formats into a common internal model
- normalised request actions across providers
- included backend and frontend application layers
- supported secure user/account workflows
- integrated into a wider distributed system involving Python-based balancing logic via RabbitMQ

A key design goal was extensibility: new exchanges could be added by implementing the required methods and data mappings, without refactoring the whole platform.

---

## Architecture Overview

This project sat within a broader distributed system:

- **Backend API (this repository / `app`)** — Node.js / Express service handling authentication, account management, security workflows, exchange integration, REST endpoints, and trading-related data operations
- **Frontend layer (this repository / `front`)** — AngularJS-based web client for authentication and account-entry workflows, connected to the backend API
- **Python balancing service** *(separate component)* — consumed messages via RabbitMQ and handled balancing logic for cross-exchange currency allocation
- **Infrastructure** — AWS-hosted environment with Nginx reverse proxy and SSL termination

---

## Key Features

- **Multi-exchange integration** — integrated Bitfinex, Bittrex, Kraken, Poloniex, and Wex through exchange-specific Node.js API clients
- **Unified exchange abstraction** — normalised provider-specific responses and request actions into a common platform-facing model
- **Extensible integration design** — adding a new exchange mainly required implementing the necessary methods and response mappings rather than refactoring platform logic
- **Authentication and session handling** — Passport.js local strategy, bcrypt password hashing, and express-session
- **Two-factor authentication** — TOTP-based 2FA using Speakeasy with QR code provisioning
- **Frontend auth flows** — AngularJS client-side flows for signup, signin, reset password, and 2FA-related user interaction
- **Distributed-system integration** — passed data to a separate Python balancing service through RabbitMQ as part of the wider arbitrage workflow
- **Relational persistence layer** — MySQL with Sequelize ORM for users, exchange accounts, balances, orders, arbitrage records, and transaction history
- **Registration hardening** — reCAPTCHA, email verification, and account-related mail flows
- **Operational logging** — log4js-based logging across backend processes

---

## Tech Stack

| Layer | Technologies |
|---|---|
| Backend / API | Node.js, Express |
| Frontend | AngularJS 1.x, Webpack, Bootstrap |
| Authentication & Security | Passport.js, Passport Local, bcrypt, express-session, Speakeasy (2FA), reCAPTCHA, Nodemailer |
| Database / ORM | MySQL, Sequelize ORM |
| Exchange Integrations | Bitfinex, Bittrex, Kraken, Poloniex, Wex |
| Messaging / Distributed Processing | RabbitMQ, Python balancing service *(adjacent component)* |
| Templating | Express-Handlebars |
| Infrastructure | AWS, Nginx |

---

## Engineering Highlights

What made this project interesting was not just the stack, but the combination of constraints:

- a new technical and business domain learned under time pressure
- multiple third-party exchange APIs with inconsistent behaviours and formats
- the need for a common abstraction layer across exchanges
- coordination between Node.js backend services, frontend account flows, and Python-side processing
- designing the MVP so the platform could grow by adding new exchanges without major structural rewrites

This repository is therefore best understood as a portfolio example of backend integration, full-stack MVP delivery, distributed-system thinking, and rapid delivery in an unfamiliar domain.

---

## Repository Scope

This public repository contains the main Node.js backend and an AngularJS frontend layer used for platform entry and account workflows.

It represents one practical slice of the original system rather than a polished standalone product. Some surrounding infrastructure, deployment details, and adjacent services from the original platform are not included here.

---

## Status

Historical MVP / POC.

The platform was built to validate the arbitrage concept quickly and establish a working multi-exchange system.

It is not actively maintained, and the dependencies reflect the period in which it was developed. A modern production version would require dependency upgrades, environment-based secret management, security hardening, stronger test coverage, and general refactoring.

---

## Notes

This repository is shared as a portfolio example of full-stack engineering work completed as part of a larger system.

My role covered backend delivery, service-layer architecture, exchange integration design, coordination with Python-side processing through RabbitMQ, and practical delivery of a working MVP in a new domain within a short timeframe.
