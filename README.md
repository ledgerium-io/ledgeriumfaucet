# Ledgerium Token Faucet

## Prerequisites
### NodeJS
Confirm you have NodeJS installed by running `node -v`, output should look like:

```
v11.1.0
```

[Download NodeJS](https://nodejs.org/en/)

### Node Package Manager (NPM)
Confirm you have NPM installed by running `npm -v`, output should look like:

```
v6.8.0
```

[Download NPM](https://www.npmjs.com/get-npm)

### Redis
Confirm you have Redis installed and running by `redis-cli ping`, output should look like:

```
PONG
```

[Download Redis](https://redis.io/download)

# Download and Setup
Clone this repository to your computer
```
git clone https://github.com/ledgerium/ledgeriumfaucet.git
```

Navigate into the `ledgeriumfaucet` directory
```
cd ledgeriumfaucet
```

Create the `.env` file

* Linux/MacOX
```
touch .env
```
* Windows
```
echo.>.env
```
Open the `.env` file in any text editor and insert the following
```
PRIVATE_KEY=0x0000000000000000000000000000000000000000
CAPTCHA_SECRET=6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe
REDIS_URL=redis://127.0.0.1:6379
NODE_URL=http://125.254.27.14:8545
REDIS_EXPIRE_SECONDS=60
```

* `PRIVATE_KEY` -> Private key of the address you want to use to send out funds

* `GOOGLE_CAPTCHA_SECRET` -> Google Captcha secret key, the one above is public for local testing only

* `REDIS_URL` -> Use 'redis' if using in docker, or use an actual url

* `NODE_URL` -> Ledgerium node address and port

* `REDIS_EXPIRE_SECONDS` -> Limit (in seconds) how long a user must wait to receive more XLG



Install the package dependencies using NPM
```
npm install
```

# Usage

## Getting started

To run the the faucet, make sure your currently in the `ledgeriumfaucet` directory

```
node index
```
