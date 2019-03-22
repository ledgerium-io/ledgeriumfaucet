const Web3 = require('web3')
const express = require('express')
const router = express.Router()
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
    "to": "",
    "value": "1",
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
            response.send({
                success: true,
                tx
            })
        })
        .catch(err => {
            response.send({
                success: false,
                message: "Could not find transaction ID"
            })
        })
})

router.get('/q', (request, response) => {
    response.send({web3: process.env.NODE_URL, limit: process.env.REQUEST_LIMIT})
})

router.post('/', verifyRecaptcha, checkLimit, makeTransaction, (request, response) => {})

function makeTransaction(request, response, next) {
        const { address, amount } = request.body
        if(!web3.utils.isAddress(address)) return response.send({success: false, message: 'Please enter a valid address'})
        if(typeof amount !== "number")return response.send({success: false, message: 'Amount must be a valid integer'})
        if(amount < 0 || amount > process.env.REQUEST_LIMIT) return response.send({success: false, message: `Request must be between 0 and {process.env.REQUEST_LIMIT} XLG`})

        rawTransaction.to = address
        rawTransaction.value = web3.utils.toHex(web3.utils.toWei(amount.toString(), "ether"))

        web3.eth.accounts.signTransaction(rawTransaction, decryptedAccount.privateKey, (err, res) => {
            if (err) { 
                console.log(err)
                return response.send({
                    success: false,
                    message: `Server issue: ${err}`
                })   
            }
            if (res) {
                console.log("[+] Signed successfully")
                signedTransaction = res.rawTransaction
                web3.eth.sendSignedTransaction(signedTransaction, (error, success) => {
                        if (error) { 
                            console.log(error); 
                            return response.send({
                                success: false,
                                message: `Server issue: ${error}`
                            })  
                        }
                        if (success) {
                            console.log(`[+] Sent successfully`)
                        }
                    })
                    .then(receipt => {
                        rawTransaction.nonce++
                        netAmount = amount
                        if(redis.amount) netAmount += redis.amount
                        console.log(`[+] Recieved receipt`)
                        client.set(address.toLowerCase(), JSON.stringify({address: receipt.to, amount: netAmount, timestamp: Date.now()}), 'EX', requestLimit)
                        return response.send({
                            success: true,
                            message: `You have successfuly been sent ${amount} XLG <br> Requested: ${netAmount}/${process.env.REQUEST_LIMIT}`,
                            receipt
                        })
                    })
                     .catch(error => {
                        return response.send({
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

function secondsToString(uptime) {
    if(uptime > 86400) {
      uptime = uptime/86400;
      return (uptime.toFixed(3) + " days");
    } else if (uptime > 3600) {
      uptime = uptime/3600;
      return (uptime.toFixed(2) + " hours")
    } else if (uptime > 60) {
      uptime = uptime/60;
      return (uptime.toFixed(2) + " minutes")
    } else {
      return(uptime.toFixed(0) + " seconds")
    }
  }

function timeLeft(timestamp) {
    const timeNeeded = process.env.REDIS_EXPIRE_SECONDS*1000
    const timePassed = (Date.now() - timestamp)
    const timeLeft = timeNeeded - timePassed
    return secondsToString(timeLeft/1000)
}

function checkLimit(request, response, next) {
    const { amount, address } = request.body
    client.get(address, function(error, result) {
        if (error) {
            console.log(error);
            throw error;
        } else {
            if(!result) return next()
            result = JSON.parse(result)
            if(result.address == address) {
                if(result.amount+amount > process.env.REQUEST_LIMIT) {
                   return response.send({
                        success: false,
                        message: `Requesting ${amount} more will put you over the limit. <br> Requests: ${result.amount}/${process.env.REQUEST_LIMIT} <br>Limit expires in ${timeLeft(result.timestamp)}`
                    })
                } else {
                    if(result.amount>0) redis.amount = result.amount
                    next()
                }
            }
        }
    })
}

module.exports = router;