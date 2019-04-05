const Web3 = require('web3')
const express = require('express')
const router = express.Router()
const https = require('https');
const redis = require('redis');
const requestLimit = process.env.REDIS_EXPIRE_SECONDS
const web3 = new Web3(process.env.NODE_URL);

const client = redis.createClient(process.env.REDIS_URL);
client.on('connect', () => {
    console.log(`[+] Connected to Redis`);
});
client.on('error', err => {
    console.log(`[!] Error connecting to Redis: ${err}`);
});
defaultAccount = "0x"
web3.eth.getAccounts().then(accounts => {
  defaultAccount = accounts[0]
})
connected = false
makingAnOrder = false
rawTransaction = {
    "to": "",
    "value": "1",
    "gas": '21000',
    "data": ''
};


web3.eth.net.isListening()
    .then( (response) => {
        if(response) {
            console.log('[+] Connected to Ledgerium Node')
            connected = true
        } else {
            console.log(`[!] Error connecting to Ledgerium Node`);
        }
    })
    .catch( error => {console.log('[!] Error connecting to Ledgerium Node')})

const privateKey = "0x"+ process.argv[2];
const decryptedAccount = web3.eth.accounts.privateKeyToAccount(privateKey)



router.get('/', (request, response) => {
    response.sendFile(__dirname + '/views/index.html');
})

router.get('/balance/:address', (request, response) => {
  const { address } = request.params
  if (!web3.utils.isAddress(address)) return
  web3.eth.getBalance(address)
  .then(balance => {
    response.send({
      success: true,
      message: "Got balance",
      balance
    })
  })
  .catch(error => {
    response.send({
      success: false,
      message: error
    })
  })

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
    response.send({limit: parseInt(process.env.REQUEST_LIMIT)})
})

router.post('/', checkNodeStatus, verifyRecaptcha, checkLimit, makeTransaction, (request, response) => {})

function makeTransaction(request, response, next) {
        if(makingAnOrder) return response.send({success: false, message: 'Order que is full, please try again soon'})
        makingAnOrder = true

        if(web3.eth.getBalance(defaultAccount) <= 0) {
          makingAnOrder = false
          return response.send({success: false, message: 'Faucet empty. Please contact the site administrator'})
        }
        web3.eth.getBalance(defaultAccount)
        .then(console.log)
        const { address, amount } = request.body

        if(!web3.utils.isAddress(address)) {
            makingAnOrder = false
            return response.send({success: false, message: 'Please enter a valid address'})
        }
        if(typeof amount !== "number") {
            makingAnOrder = false
            return response.send({success: false, message: 'Amount must be a valid integer'})
        }
        if(amount < 0 || amount > parseInt(process.env.REQUEST_LIMIT)) {
            makingAnOrder = false
            return response.send({success: false, message: `Request must be between 0 and {process.env.REQUEST_LIMIT} XLG`})
        }
        rawTransaction.to = address
        rawTransaction.value = web3.utils.toHex(web3.utils.toWei(amount.toString(), "ether"))
        web3.eth.getTransactionCount(defaultAccount, 'pending')
          .then(txCount => {
            console.log(txCount)
            rawTransaction.nonce = txCount
            web3.eth.accounts.signTransaction(rawTransaction, decryptedAccount.privateKey)
            .then(res => {
                console.log(`[+] Signed transaction successfully`)
                signedTransaction = res.rawTransaction
                console.log(`[+] Attempting to send ${amount} XLG`)
                web3.eth.sendSignedTransaction(signedTransaction)
                .then(receipt => {
                  console.log(`[+] Sent ${amount} XLG successfully`)
                  let netAmount = amount
                  if(request.amount) netAmount += request.amount
                  console.log(`[+] Recieved receipt`)
                  client.set(address.toLowerCase(), JSON.stringify({address: receipt.to, amount: netAmount, timestamp: Date.now()}), 'EX', parseInt(requestLimit))
                  makingAnOrder = false
                  return response.send({
                      success: true,
                      message: `You have successfuly been sent ${netAmount} XLG <br> Requested: ${netAmount}/${parseInt(process.env.REQUEST_LIMIT)}`,
                      receipt,
                      amount
                  })
                })
                .catch(error => {
                  makingAnOrder = false
                  console.log(`[!] Error: ${error.message}`)
                  return response.send({
                      success: false,
                      message: error.message
                  })
                })

            })
            .catch(error => {
              console.log(`[!] Error: ${error.message}`)
              makingAnOrder = false
              return response.send({
                  success: false,
                  message: `Server issue: ${error.message}`
                })
            })
          })
          .catch(error => {
            makingAnOrder = false
            return response.send({
                success: false,
                message: `Server issue: ${error.message}`
              })
          })


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
                return response.send({
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

function checkNodeStatus(request, response, next) {
    if(connected) {
        return next()
    } else {
        return response.send({
            success: false,
            message: "Server Error: Not connected to Ledgerium node"
        })
    }
}


function checkLimit(request, response, next) {
    const { amount, address } = request.body

    client.get(address.toLowerCase(), function(error, result) {
        if (error) {
            console.log(error);
            throw error;
        } else {
            if(!result) return next()
            result = JSON.parse(result)
            if(result.address == address.toLowerCase()) {
                if(result.amount == process.env.REQUEST_LIMIT) {
                    return response.send({
                        success: false,
                        message: `You have reached the daily limit. <br> <b>Requests:</b> ${result.amount}/${parseInt(process.env.REQUEST_LIMIT)} <br><b>Limit expires</b> in ${timeLeft(result.timestamp)}`
                    })
                }
                if(result.amount+amount > parseInt(process.env.REQUEST_LIMIT)) {
                   return response.send({
                        success: false,
                        message: `Requesting ${amount} more will put you over the limit. <br> <b>Requests:</b> ${result.amount}/${parseInt(process.env.REQUEST_LIMIT)} <br><b>Limit expires</b> in ${timeLeft(result.timestamp)}`
                    })
                } else {
                    if(result.amount>0) request.amount = result.amount
                    next()
                }
            }
        }
    })
}

module.exports = router;
