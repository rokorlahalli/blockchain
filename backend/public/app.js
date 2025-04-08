async function connectMetamask() {
    if (window.ethereum) {
        window.web3 = new Web3(window.ethereum);
        await window.ethereum.request({ method: "eth_requestAccounts" });
        console.log("Metamask connected!");
    } else {
        console.error("Please install Metamask.");
    }
}
document.getElementById("connect").addEventListener("click", connectMetamask);

