
// Bingo challenges for LCMS Youth Gathering
const CHALLENGES = [
    "Share your faith story", "Pray for a friend", "Read John 3:16", "Help a stranger", "Attend worship",
    "Join a Bible study", "Thank a volunteer", "Make a new friend", "Sing a hymn", "Share a meal",
    "Give encouragement", "Practice forgiveness", "Show kindness", "Learn a verse", "Serve others",
    "Share testimony", "Invite someone", "Practice gratitude", "Listen deeply", "Show compassion",
    "Spread joy", "Be patient", "Offer help", "Share hope", "Love neighbor"
];

let scene, camera, renderer, raycaster, mouse;
let tiles = [];
let completedTiles = new Set();
let dailyChallenge = 12; // Center tile by default
let confettiParticles = [];

export function initBingo3D() {
    const container = document.getElementById('bingo-container');
    if (!container) {
        console.error('Bingo container not found');
        return;
    }
    
    // Clear placeholder text
    container.innerHTML = '';
    
    // Load saved state
    loadGameState();
    
    try {
        // Initialize Three.js
        setupScene(container);
        createBingoBoard();
        setupLighting();
        setupInteraction();
        animate();
        
        // Set daily challenge
        setDailyChallenge();
        
        console.log('Bingo 3D initialized successfully');
    } catch (error) {
        console.error('Error initializing Bingo 3D:', error);
        container.innerHTML = '<p class="text-red-600">Error loading 3D bingo. Please refresh the page.</p>';
    }
}

// Expose initializer globally
window.initBingo3D = initBingo3D;

function setupScene(container) {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf3f4f6);
    scene.fog = new THREE.Fog(0xf3f4f6, 10, 50);
    
    // Camera
    const aspect = container.clientWidth / container.clientHeight;
    camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    camera.position.set(0, 8, 12);
    camera.lookAt(0, 0, 0);
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    
    // Handle resize
    window.addEventListener('resize', () => {
        const width = container.clientWidth;
        const height = container.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    });
}

function createBingoBoard() {
    const gridSize = 5;
    const tileSize = 1.8;
    const gap = 0.2;
    const totalSize = (tileSize + gap) * gridSize - gap;
    const startPos = -totalSize / 2 + tileSize / 2;
    
    // Create tiles
    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            const index = row * gridSize + col;
            const challenge = CHALLENGES[index];
            
            // Tile geometry
            const geometry = new THREE.BoxGeometry(tileSize, 0.3, tileSize);
            geometry.computeBoundingBox();
            
            // Glassmorphism material
            const material = new THREE.MeshPhysicalMaterial({
                color: completedTiles.has(index) ? 0x7c3aed : 0xffffff,
                metalness: 0.0,
                roughness: 0.1,
                transmission: completedTiles.has(index) ? 0.7 : 0.9,
                thickness: 0.5,
                envMapIntensity: 1,
                clearcoat: 1,
                clearcoatRoughness: 0.1,
                opacity: 0.95,
                transparent: true,
                side: THREE.DoubleSide
            });
            
            const tile = new THREE.Mesh(geometry, material);
            tile.position.set(
                startPos + col * (tileSize + gap),
                0,
                startPos + row * (tileSize + gap)
            );
            tile.castShadow = true;
            tile.receiveShadow = true;
            tile.userData = { index, challenge, originalY: 0 };
            
            // Add text (simplified - in production, use TextGeometry or sprites)
            const canvas = createTextCanvas(challenge, index === dailyChallenge);
            const texture = new THREE.CanvasTexture(canvas);
            const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
            const sprite = new THREE.Sprite(spriteMaterial);
            sprite.scale.set(tileSize, tileSize * 0.5, 1);
            sprite.position.y = 0.5;
            tile.add(sprite);
            
            scene.add(tile);
            tiles.push(tile);
        }
    }
}

function createTextCanvas(text, isDaily) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = isDaily ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 255, 255, 0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Text
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Word wrap
    const words = text.split(' ');
    let line = '';
    let y = canvas.height / 2 - 15;
    
    for (let word of words) {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > canvas.width - 20 && line !== '') {
            ctx.fillText(line, canvas.width / 2, y);
            line = word + ' ';
            y += 25;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, canvas.width / 2, y);
    
    if (isDaily) {
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
    }
    
    return canvas;
}

function setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    // Directional light
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 5);
    dirLight.castShadow = true;
    dirLight.shadow.camera.left = -10;
    dirLight.shadow.camera.right = 10;
    dirLight.shadow.camera.top = 10;
    dirLight.shadow.camera.bottom = -10;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);
    
    // Point lights for glow effect
    const purpleLight = new THREE.PointLight(0x7c3aed, 0.5, 20);
    purpleLight.position.set(-5, 3, -5);
    scene.add(purpleLight);
    
    const goldLight = new THREE.PointLight(0xfbbf24, 0.3, 20);
    goldLight.position.set(5, 3, 5);
    scene.add(goldLight);
}

function setupInteraction() {
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    
    const container = renderer.domElement;
    
    // Mouse/touch events
    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('click', onClick);
    container.addEventListener('touchstart', onTouchStart);
}

function onMouseMove(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Update raycaster
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(tiles);
    
    // Reset all tiles
    tiles.forEach(tile => {
        tile.scale.set(1, 1, 1);
    });
    
    // Highlight hovered tile
    if (intersects.length > 0) {
        const hoveredTile = intersects[0].object;
        hoveredTile.scale.set(1.05, 1.05, 1.05);
        renderer.domElement.style.cursor = 'pointer';
    } else {
        renderer.domElement.style.cursor = 'default';
    }
}

function onTouchStart(event) {
    event.preventDefault();
    const touch = event.touches[0];
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
    onClick();
}

function onClick() {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(tiles);
    
    if (intersects.length > 0) {
        const clickedTile = intersects[0].object;
        const index = clickedTile.userData.index;
        
        // Toggle completion
        if (completedTiles.has(index)) {
            completedTiles.delete(index);
            animateTileUncheck(clickedTile);
        } else {
            completedTiles.add(index);
            animateTileCheck(clickedTile);
            
            // Check for Bingo
            if (checkForBingo()) {
                triggerConfetti();
                showBingoMessage();
            }
        }
        
        // Save state
        saveGameState();
    }
}

function animateTileCheck(tile) {
    // Color transition
    tile.material.color.setHex(0x7c3aed);
    tile.material.transmission = 0.7;
    
    // Bounce animation
    const startY = tile.position.y;
    const bounce = { y: startY };
    
    // Using simple animation loop instead of GSAP
    let startTime = null;
    const duration = 500;
    
    function animateBounce(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Bounce curve
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const bounceHeight = Math.sin(progress * Math.PI) * 0.5;
        
        tile.position.y = startY + bounceHeight;
        tile.rotation.y = progress * Math.PI * 2;
        
        if (progress < 1) {
            requestAnimationFrame(animateBounce);
        } else {
            tile.position.y = startY;
            tile.rotation.y = 0;
        }
    }
    
    requestAnimationFrame(animateBounce);
}

function animateTileUncheck(tile) {
    tile.material.color.setHex(0xffffff);
    tile.material.transmission = 0.9;
    
    // Shake animation
    const startX = tile.position.x;
    let startTime = null;
    const duration = 300;
    
    function animateShake(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const shake = Math.sin(progress * Math.PI * 8) * 0.1 * (1 - progress);
        tile.position.x = startX + shake;
        
        if (progress < 1) {
            requestAnimationFrame(animateShake);
        } else {
            tile.position.x = startX;
        }
    }
    
    requestAnimationFrame(animateShake);
}

function checkForBingo() {
    const size = 5;
    
    // Check rows
    for (let row = 0; row < size; row++) {
        let complete = true;
        for (let col = 0; col < size; col++) {
            if (!completedTiles.has(row * size + col)) {
                complete = false;
                break;
            }
        }
        if (complete) return true;
    }
    
    // Check columns
    for (let col = 0; col < size; col++) {
        let complete = true;
        for (let row = 0; row < size; row++) {
            if (!completedTiles.has(row * size + col)) {
                complete = false;
                break;
            }
        }
        if (complete) return true;
    }
    
    // Check diagonals
    let diagonal1 = true, diagonal2 = true;
    for (let i = 0; i < size; i++) {
        if (!completedTiles.has(i * size + i)) diagonal1 = false;
        if (!completedTiles.has(i * size + (size - 1 - i))) diagonal2 = false;
    }
    
    return diagonal1 || diagonal2;
}

function triggerConfetti() {
    const colors = [0x7c3aed, 0xfbbf24, 0xf59e0b, 0x8b5cf6, 0xa78bfa];
    
    for (let i = 0; i < 100; i++) {
        const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        const material = new THREE.MeshBasicMaterial({
            color: colors[Math.floor(Math.random() * colors.length)]
        });
        const particle = new THREE.Mesh(geometry, material);
        
        particle.position.set(
            (Math.random() - 0.5) * 10,
            Math.random() * 5 + 5,
            (Math.random() - 0.5) * 10
        );
        
        particle.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.2,
            -Math.random() * 0.1 - 0.05,
            (Math.random() - 0.5) * 0.2
        );
        
        particle.rotationSpeed = new THREE.Vector3(
            Math.random() * 0.1,
            Math.random() * 0.1,
            Math.random() * 0.1
        );
        
        scene.add(particle);
        confettiParticles.push(particle);
    }
}

function updateConfetti() {
    for (let i = confettiParticles.length - 1; i >= 0; i--) {
        const particle = confettiParticles[i];
        particle.position.add(particle.velocity);
        particle.rotation.x += particle.rotationSpeed.x;
        particle.rotation.y += particle.rotationSpeed.y;
        particle.rotation.z += particle.rotationSpeed.z;
        
        // Remove if below ground
        if (particle.position.y < -5) {
            scene.remove(particle);
            confettiParticles.splice(i, 1);
        }
    }
}

function setDailyChallenge() {
    // Change daily challenge based on date
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
    dailyChallenge = dayOfYear % 25;
    
    // Update visual for daily challenge
    if (tiles[dailyChallenge]) {
        animateDailyChallenge();
    }
}

function animateDailyChallenge() {
    const tile = tiles[dailyChallenge];
    if (!tile) return;
    
    // Pulsing glow effect
    function pulse() {
        const time = Date.now() * 0.001;
        const scale = 1 + Math.sin(time * 2) * 0.05;
        tile.scale.set(scale, scale, scale);
        
        // Golden glow
        const intensity = 0.5 + Math.sin(time * 3) * 0.3;
        tile.material.emissive = new THREE.Color(0xfbbf24);
        tile.material.emissiveIntensity = intensity;
    }
    
    // Add to animation loop
    tile.userData.pulse = pulse;
}

function showBingoMessage() {
    // Create celebration message
    const message = document.createElement('div');
    message.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-purple-600 text-white px-8 py-4 rounded-lg shadow-lg z-50';
    message.innerHTML = '<h3 class="text-2xl font-bold">BINGO! 🎉</h3><p class="mt-2">Great job completing a line!</p>';
    document.body.appendChild(message);
    
    // Remove after 3 seconds
    setTimeout(() => {
        message.remove();
    }, 3000);
}

function saveGameState() {
    try {
        localStorage.setItem('bingoCompleted', JSON.stringify([...completedTiles]));
    } catch (error) {
        console.warn('Could not save game state:', error);
    }
}

function loadGameState() {
    try {
        const saved = localStorage.getItem('bingoCompleted');
        if (saved) {
            completedTiles = new Set(JSON.parse(saved));
        }
    } catch (error) {
        console.warn('Could not load game state:', error);
        completedTiles = new Set();
    }
}

function animate() {
    requestAnimationFrame(animate);
    
    // Rotate camera slightly
    const time = Date.now() * 0.0001;
    camera.position.x = Math.sin(time) * 0.5;
    camera.position.z = 12 + Math.cos(time) * 0.5;
    camera.lookAt(0, 0, 0);
    
    // Update daily challenge pulse
    tiles.forEach(tile => {
        if (tile.userData.pulse) {
            tile.userData.pulse();
        }
    });
    
    // Update confetti
    updateConfetti();
    
    renderer.render(scene, camera);
}

// Expose initializer globally
window.initBingo3D = initBingo3D;
