const Web3 = require('web3')
const express = require('express')
const router = express.Router()
const dotenv = require('dotenv').config()
const https = require('https');
const redis = require('redis');

const client = redis.createClient(process.env.REDIS_URL);
client.on('connect', () => {
    console.log(`[+] Connected to Redis`);
});
client.on('error', err => {
    console.log(`[!] Error connecting to Redis: ${err}`);
});

const requestLimit = process.env.REDIS_EXPIRE_SECONDS
const web3 = new Web3(process.env.NODE_URL);

const privateKey = "0x"+ process.argv[2]; //Private Key from the commandline
const decryptedAccount = web3.eth.accounts.privateKeyToAccount(privateKey)

let rawTransaction = {
    "to": "0xF232A4BF183cF17D09Bea23e19CEfF58Ad9dbFED",
    "value": web3.utils.toHex(web3.utils.toWei("3", "ether")),
    "gas": '21000',
    "data": ''
};

router.get('/', (request, response) => {
    response.sendFile(__dirname + '/views/index.html');
})

router.get('/transaction/:tx', (request, response) => {
    const { tx } = request.params
    web3.eth.getTransaction(tx)
        .then(tx => {
            response.send(tx)
        })
})

router.post('/', verifyRecaptcha, checkLimit, makeTransaction, (request, response) => {})

function makeTransaction(request, response, next) {
        const { address } = request.body
        rawTransaction.to = address
        web3.eth.accounts.signTransaction(rawTransaction, decryptedAccount.privateKey, (err, res) => {
            if (err) console.log(err)
            if (res) {
                console.log("[+] Signed successfully")
                signedTransaction = res.rawTransaction
                web3.eth.sendSignedTransaction(signedTransaction, (error, success) => {
                        if (error) return console.log(error)
                        if (success) {
                            console.log(`[+] Sent successfully`)
                        }
                    })
                    .then(receipt => {
                        response.send({
                            success: true,
                            message: receipt
                        })
                        rawTransaction.nonce++
                        console.log(`[+] Recieved receipt`)
                        client.set(address.toLowerCase(), receipt.to, 'EX', requestLimit);
                    })
                    .catch(error => {
                        response.send({
                            success: false,
                            message: error
                        })
                    })
            }
        });
}

function verifyRecaptcha(request, response, next) {
    const key = request.body["g-recaptcha-response"]

    https.get("https://www.google.com/recaptcha/api/siteverify?secret=" + process.env.GOOGLE_CAPTCHA_SECRET + "&response=" + key, function(res) { 
        var data = "";
        res.on('data', function(chunk) {
            data += chunk.toString();
        });
        res.on('end', function() {
            try {
                next()
            } catch (e) {
                response.send({
                    success: false,
                    message: "Invalid Captcha"
                })
            }
        });
    });
}


function checkLimit(request, response, next) {
    const {
        address
    } = request.body
    client.get(address, function(error, result) {
        if (error) {
            console.log(error);
            throw error;
        } else {
            if (result == address) {
                response.send({
                    success: false,
                    message: "You have already recieved in the last 24 hours"
                })
            } else {
                next()
            }
        }
    })
}

module.exports = router;