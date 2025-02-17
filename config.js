// Never expose API keys in public repositories
const GEMINI_API_KEY = 'AIzaSyCaPmbnu2xKfMGQzlNdrJWF5i8sCEwPPVY';

// Basic encryption for demonstration (not for production use)
function encodeKey(key) {
    return btoa(key);
}

function decodeKey(encodedKey) {
    return atob(encodedKey);
}

// Export encoded key
export default encodeKey(GEMINI_API_KEY); 