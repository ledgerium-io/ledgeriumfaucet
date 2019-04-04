console.log('Version: 1.338')
let web3; 
axios.get('/q')
  .then(response => {
    web3 = new Web3(new Web3.providers.HttpProvider(response.data.web3));
    console.log(`Conencted to Web3 (${response.data.web3})`)
    document.getElementById('requestLimit').innerText = `Request limit: ${response.data.limit} XLG`
  })
  .catch(error => {
    console.log(error)
  })


const inputAddress= document.querySelector("#address");
inputAddress.addEventListener("input", alertAddress);
inputAddress.value = ""
function alertAddress() {
  console.log(inputAddress.value)
  getXLGBalance(inputAddress.value)
 
}
document.getElementById("requestBtn").disabled = true 

function getXLGBalance(address) {
  if (!web3.isAddress(address)) {
    document.getElementById('addressCheck').innerHTML = '<i class="fas fa-times"" style="color:#e66653" ></i>'
    return;
  }
  document.getElementById('addressCheck').innerHTML = '<i class="fas fa-check"" style="color:#46a656"></i>'

  const balance = web3.eth.getBalance(address, (error, balance) => {
    document.getElementById('xlgBalance').innerHTML = web3.fromWei(balance)
  });
}

function enableRequest() {
  document.getElementById("requestBtn").disabled = false
}

amount = 1
document.querySelector("#amountSelector").onchange = function (e) {
  amount = parseInt(e.target.value)
}
  

document.querySelector("#requestTokenForm").addEventListener("submit", function(e){
  e.preventDefault();
  const address = e.target.elements[0].value
  document.getElementById("requestBtn").disabled = true
  if (!web3.isAddress(address)) {
    toastr.error("Please enter a valid address", "Invalid XLG Address");
    return;
  }
  document.getElementById("requestBtn").innerHTML = '<div class="spinner-border" role="status"></div>'
  axios.post('/', {
    address,
    amount
  })
  .then(json => {
    console.log(json.data)
    if(json.data.success) {
      toastr.info(`${json.data.message}`, 'Transaction Sent');
      const receipt = json.data.receipt
      const quantity = json.data.amount
      const {blockHash, blockNumber, gasUsed, from, to, transactionHash} = receipt
      document.getElementById('blockHash').innerHTML = blockHash
      document.getElementById('blockNumber').innerHTML = blockNumber.toLocaleString()
      document.getElementById('gasUsed').innerHTML = gasUsed
      document.getElementById('from').innerHTML = from
      document.getElementById('to').innerHTML = to
      document.getElementById('transactionHash').innerHTML = transactionHash
      document.getElementById('quantity').innerHTML = quantity + " XLG"

      document.getElementById("txUrl").innerHTML = `<a href="#" data-toggle="modal" data-target="#exampleModalCenter">View Transaction<a>`
      document.getElementById("requestBtn").disabled = false
      document.getElementById("requestBtn").innerHTML = "Submit"

    }
    if(!json.data.success) {
      toastr.error(json.data.message, "Something went wrong");
      document.getElementById("requestBtn").innerHTML = "Submit"
      document.getElementById("requestBtn").disabled = false
    }
  })   
  .catch(console.log)
});


setInterval( () => {
  const address = document.getElementById("address").value 
  if (!web3.isAddress(address)) return
  const balance = web3.eth.getBalance(address, (error, balance) => {
    document.getElementById('xlgBalance').innerHTML = web3.fromWei(balance)
  });
},2500)

