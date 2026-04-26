document.addEventListener('DOMContentLoaded', () => {
    // --- UI Elements ---
    const toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);

    function showToast(message, type = 'success') {
        toast.textContent = message;
        toast.className = `toast show ${type}`;
        setTimeout(() => {
            toast.className = 'toast';
        }, 3000);
    }

    // --- Utility: Copy to Clipboard ---
    function setupCopyToClipboard() {
        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.getAttribute('data-target');
                const targetEl = document.getElementById(targetId);
                if (targetEl && targetEl.value) {
                    navigator.clipboard.writeText(targetEl.value).then(() => {
                        showToast('Copied to clipboard!');
                    }).catch(err => {
                        console.error('Could not copy text: ', err);
                        showToast('Failed to copy', 'error');
                    });
                } else {
                    showToast('Nothing to copy', 'error');
                }
            });
        });
    }

    // --- State Elements ---
    // Key Generation
    const btnGenerate = document.getElementById('btn-generate');
    const loadingKeys = document.getElementById('loading-keys');
    const publicKeyEl = document.getElementById('public-key');
    const privateKeyEl = document.getElementById('private-key');
    const blurOverlay = document.getElementById('blur-overlay');
    const copyPublicBtn = document.querySelector('.copy-btn[data-target="public-key"]');

    // Encryption
    const btnEncrypt = document.getElementById('btn-encrypt');
    const loadingEncrypt = document.getElementById('loading-encrypt');
    const receiverPublicKeyEl = document.getElementById('receiver-public-key');
    const messageToEncryptEl = document.getElementById('message-to-encrypt');
    const encryptedResultEl = document.getElementById('encrypted-result');
    const copyEncryptedBtn = document.querySelector('.copy-btn[data-target="encrypted-result"]');

    // Decryption
    const btnDecrypt = document.getElementById('btn-decrypt');
    const loadingDecrypt = document.getElementById('loading-decrypt');
    const encryptedMessageEl = document.getElementById('encrypted-message');
    const decryptedResultEl = document.getElementById('decrypted-result');

    // --- Core Functions ---

    function generateKeys() {
        btnGenerate.disabled = true;
        loadingKeys.classList.remove('hidden');
        publicKeyEl.value = '';
        privateKeyEl.value = '';
        if (copyPublicBtn) copyPublicBtn.disabled = true;

        setTimeout(() => {
            try {
                const crypt = new JSEncrypt({default_key_size: 2048});
                crypt.getKey();
                
                publicKeyEl.value = crypt.getPublicKey();
                privateKeyEl.value = crypt.getPrivateKey();

                // Re-apply blur for safety on new key generation
                if (blurOverlay) {
                    blurOverlay.classList.remove('hidden');
                    privateKeyEl.classList.add('blurred');
                }
                
                if (copyPublicBtn) copyPublicBtn.disabled = false;
                showToast('Keys generated successfully!');
            } catch (error) {
                console.error(error);
                showToast('Error generating keys', 'error');
            } finally {
                btnGenerate.disabled = false;
                loadingKeys.classList.add('hidden');
            }
        }, 100);
    }

    function encryptMessage() {
        const message = messageToEncryptEl.value.trim();
        const publicKey = receiverPublicKeyEl.value.trim();

        if (!publicKey) {
            showToast("Please provide the receiver's public key", 'error');
            return;
        }
        if (!message) {
            showToast('Please enter a message to encrypt', 'error');
            return;
        }
        
        // RSA max length depends on key size. A 2048-bit key can typically encrypt ~245 bytes.
        if (message.length > 200) {
            showToast('Message too long for basic RSA. Max ~200 chars.', 'error');
            return;
        }

        btnEncrypt.disabled = true;
        loadingEncrypt.classList.remove('hidden');
        encryptedResultEl.value = '';
        if (copyEncryptedBtn) copyEncryptedBtn.disabled = true;

        setTimeout(() => {
            try {
                const encrypt = new JSEncrypt();
                encrypt.setPublicKey(publicKey);
                const encrypted = encrypt.encrypt(message);

                if (encrypted) {
                    encryptedResultEl.value = encrypted;
                    if (copyEncryptedBtn) copyEncryptedBtn.disabled = false;
                    showToast('Message encrypted successfully!');
                } else {
                    showToast('Encryption failed. Check the public key format.', 'error');
                }
            } catch (error) {
                console.error(error);
                showToast('An error occurred during encryption', 'error');
            } finally {
                btnEncrypt.disabled = false;
                loadingEncrypt.classList.add('hidden');
            }
        }, 500); // Simulate processing time for better UX
    }

    function decryptMessage() {
        const encryptedMessage = encryptedMessageEl.value.trim();
        const privateKey = privateKeyEl.value.trim();

        if (!encryptedMessage) {
            showToast('Please enter an encrypted message', 'error');
            return;
        }
        if (!privateKey) {
            showToast('Private key missing. Please generate keys first.', 'error');
            return;
        }

        btnDecrypt.disabled = true;
        loadingDecrypt.classList.remove('hidden');
        decryptedResultEl.value = '';

        setTimeout(() => {
            try {
                const decrypt = new JSEncrypt();
                decrypt.setPrivateKey(privateKey);
                const decrypted = decrypt.decrypt(encryptedMessage);

                if (decrypted) {
                    decryptedResultEl.value = decrypted;
                    showToast('Message decrypted successfully!');
                } else {
                    showToast('Decryption failed. Invalid key or corrupted message.', 'error');
                }
            } catch (error) {
                console.error(error);
                showToast('An error occurred during decryption', 'error');
            } finally {
                btnDecrypt.disabled = false;
                loadingDecrypt.classList.add('hidden');
            }
        }, 500); // Simulate processing time for better UX
    }

    // --- Event Listeners ---

    // Reveal Private Key
    if (blurOverlay) {
        blurOverlay.addEventListener('click', () => {
            blurOverlay.classList.add('hidden');
            privateKeyEl.classList.remove('blurred');
        });
    }

    // Primary Actions
    if (btnGenerate) btnGenerate.addEventListener('click', generateKeys);
    if (btnEncrypt) btnEncrypt.addEventListener('click', encryptMessage);
    if (btnDecrypt) btnDecrypt.addEventListener('click', decryptMessage);

    // Dynamic Button Disabling
    function checkEncryptInputs() {
        if (btnEncrypt) {
            btnEncrypt.disabled = !messageToEncryptEl.value.trim() || !receiverPublicKeyEl.value.trim();
        }
    }
    
    function checkDecryptInputs() {
        if (btnDecrypt) {
            btnDecrypt.disabled = !encryptedMessageEl.value.trim();
        }
    }

    if (messageToEncryptEl) messageToEncryptEl.addEventListener('input', checkEncryptInputs);
    if (receiverPublicKeyEl) receiverPublicKeyEl.addEventListener('input', checkEncryptInputs);
    if (encryptedMessageEl) encryptedMessageEl.addEventListener('input', checkDecryptInputs);

    // Initialize Copy logic
    setupCopyToClipboard();
});
