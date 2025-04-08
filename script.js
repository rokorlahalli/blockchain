// List of video and image pairs (video and image may be optional)
const adVideos = [
    { image: '/images/ad1.jpg' },
    { image: '/images/ad2.jpg' },
    { image: '/images/ad3.jpg' },
    { image: '/images/ad4.jpg' }
];

document.getElementById('connect').addEventListener('click', async () => {
    if (window.ethereum) {
        const web3 = new Web3(window.ethereum);
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const accounts = await web3.eth.getAccounts();
        console.log(`Connected Wallet: ${accounts[0]}`);
        alert(`Connected Wallet: ${accounts[0]}`);
        
        // Show the ad section after connecting wallet
        document.getElementById('ad-container').style.display = 'block';
        
        // Load a random ad (video and thumbnail)
        loadAd();
    } else {
        alert('Please install Metamask!');
    }
});

// Load a random ad from the list (video and image)
function loadAd() {
    const randomAd = adVideos[Math.floor(Math.random() * adVideos.length)];
    
    // Set the thumbnail
    document.getElementById('ad-thumbnail').src = randomAd.image;
    
    // Check if the ad has a video, and display it accordingly
    if (randomAd.video) {
        document.getElementById('ad-video').src = randomAd.video;
        document.getElementById('ad-video').style.display = 'none';  // Hide the video player initially
        document.getElementById('ad-thumbnail').style.display = 'block';  // Show the image thumbnail
        document.getElementById('ad-thumbnail').style.cursor = 'pointer'; // Make the thumbnail clickable
        document.getElementById('ad-thumbnail').removeEventListener('click', rewardUserForWatchingAd);  // Remove previous click event
        
        // Add the click event to play the video
        document.getElementById('ad-thumbnail').addEventListener('click', () => {
            // Hide the thumbnail and show the video
            document.getElementById('ad-thumbnail').style.display = 'none';
            const adVideo = document.getElementById('ad-video');
            adVideo.style.display = 'block';
            adVideo.play();  // Play the ad video
        });
    } else {
        // If no video, display only the image and set up an interaction to reward the user
        document.getElementById('ad-thumbnail').style.cursor = 'pointer';
        document.getElementById('ad-thumbnail').addEventListener('click', rewardUserForWatchingAd);
    }
}

// Watch Ad Button (if you prefer using a button instead of the thumbnail to play the video)
document.getElementById('watch-ad').addEventListener('click', () => {
    const adVideo = document.getElementById('ad-video');
    adVideo.play();  // Start playing the video
    
    // Optionally hide the "Watch Ad" button
    document.getElementById('watch-ad').style.display = 'none';
});

// Track when the video ends and reward the user
document.getElementById('ad-video').addEventListener('ended', () => {
    console.log("Ad finished!");
    rewardUserForWatchingAd();  // Reward the user after the ad finishes
});

// Reward the user with tokens after the ad finishes or if they clicked an image
function rewardUserForWatchingAd() {
    const userAddress = getUserAddress();
    const rewardAmount = 10;  // Define how many tokens you want to reward for watching the ad

    // Validate Ethereum address before proceeding
    if (!isValidEthereumAddress(userAddress)) {
        console.error('Invalid Ethereum address:', userAddress);
        alert('Invalid Ethereum address. Please try again!');
        return;
    }

    console.log('Reward request for user:', userAddress); // Log the user address

    // Call backend to reward the user
    fetch('/reward', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userAddress, amount: rewardAmount }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(`You have been rewarded ${rewardAmount} tokens!`);
            document.getElementById('reward-message').style.display = 'block';  // Show reward message
            getUserBalance(userAddress);  // Update the balance on the frontend
        } else {
            alert('Failed to reward. Try again later.');
        }
    })
    .catch(err => {
        console.error('Error rewarding user:', err);  // Log error
    });
}

// Get the user's address (Metamask)
async function getUserAddress() {
    if (window.ethereum) {
        const web3 = new Web3(window.ethereum);
        const accounts = await web3.eth.getAccounts();
        if (accounts.length > 0) {
            return accounts[0];  // Return the first connected account address
        } else {
            console.error('No accounts found!');
            return null;
        }
    }
    console.error('Ethereum object not found!');
    return null;
}

// Validate Ethereum address format (using regex)
function isValidEthereumAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);  // Validates a 42 character address starting with '0x'
}

function getUserBalance(userAddress) {
    fetch(`/balance/${userAddress}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('user-balance').innerText = data.balance;
            }
        })
        .catch(err => {
            console.error('Error fetching balance:', err);
        });
}