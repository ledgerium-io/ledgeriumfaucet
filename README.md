# Ledgerium Token Faucet

## Prerequisites
### NodeJS
Confirm you have NodeJS installed by typing `node -v`, output should look like:

```
v11.1.0
```

[Download NodeJS](https://nodejs.org/en/)

### Node Package Manager (NPM)
Confirm you have NPM installed by typing `npm -v`, output should look like:

```
v6.8.0
```

[Download NPM](https://www.npmjs.com/get-npm)


# Download and Setup
Clone this repository to your local computer
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
Open the `.env` file in any text editor and insert the following then add in your values

* `PRIVATE_KEY` -> Private key of the address you want to use to send out funds

* `CAPTCHA_SECRET` -> Google Captcha secret key

* `NODE_URL` -> Ledgerium node address and port

* `REDIS_EXPIRE_SECONDS` -> Limit in seconds on how long a user must wait to recieve more XLG

```
PRIVATE_KEY=0x0000000000000000000000000000000000000000
CAPTCHA_SECRET=6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe
NODE_URL=http://localhost:8545
REDIS_URL=redis://127.0.0.1:6379
REDIS_EXPIRE_SECONDS=60
```

Install the package dependencies using NPM
```
npm install
```

## Usage

# Getting started

To run the the faucetmake sure your currently in the `ledgeriumfaucet` directory

```
node index
```
