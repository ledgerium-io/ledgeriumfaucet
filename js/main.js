let web3; 
axios.get('/q')
  .then(response => {
    web3 = new Web3(new Web3.providers.HttpProvider(response.data.web3));
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
    document.getElementById('addressCheck').innerHTML = '<i class="fas fa-times-circle" style="color:#e66653" ></i>'
    return;
  }
  document.getElementById('addressCheck').innerHTML = '<i class="fas fa-check-circle" style="color:#46a656"></i>'

  const balance = web3.eth.getBalance(address, (error, balance) => {
    document.getElementById('xlgBalance').innerHTML = web3.fromWei(balance)
  });
}

function enableRequest() {
  document.getElementById("requestBtn").disabled = false
}


document.querySelector("#requestTokenForm").addEventListener("submit", function(e){
  e.preventDefault();
  const address = e.target.elements[0].value
  if (!web3.isAddress(address)) {
    toastr.error("Please enter a valid address", "Invalid XLG Address");
    return;
  }
  axios.post('/', {
    address
  })
  .then(json => {
    console.log(json.data)
    if(json.data.success) {
      toastr.info('XLGs were transfered to your account', 'Transaction Sent');
      document.getElementById("txUrl").innerHTML = `<a href="transaction/${json.data.message.transactionHash}">View Transaction<a>`
      getXLGBalance(json.data.message.to)
      document.getElementById("requestBtn").disabled = true

    }
    if(!json.data.success) {
      toastr.error(json.data.message, "Something went wrong");
      document.getElementById("requestBtn").disabled = true
    }
  })   
  .catch(console.log)
});






