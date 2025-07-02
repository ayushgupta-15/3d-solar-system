// 3D Solar System with Three.js
class SolarSystem {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.clock = new THREE.Clock();
        this.planets = [];
        this.sun = null;
        this.animationSpeed = 1;
        this.isAnimating = true;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.isDarkTheme = true;
        this.tooltip = document.getElementById('planet-tooltip');
        this.asteroidBelt = null;
        this.earthMoon = null;
        
        // Planet data with realistic properties
        this.planetData = [
            { name: 'Mercury', size: 0.4, distance: 8, speed: 4.74, color: 0x8C7853, info: 'Closest planet to the Sun, hot and rocky.' },
            { name: 'Venus', size: 0.7, distance: 11, speed: 3.50, color: 0xFFC649, info: 'Hottest planet due to greenhouse effect.' },
            { name: 'Earth', size: 0.8, distance: 15, speed: 2.98, color: 0x6B93D6, info: 'Our home planet, the only known planet with life.' },
            { name: 'Mars', size: 0.6, distance: 20, speed: 2.41, color: 0xCD5C5C, info: 'The Red Planet, with polar ice caps and canyons.' },
            { name: 'Jupiter', size: 2.5, distance: 30, speed: 1.31, color: 0xD8CA9D, info: 'Largest planet, a gas giant with Great Red Spot.' },
            { name: 'Saturn', size: 2.2, distance: 40, speed: 0.97, color: 0xFAD5A5, info: 'Famous for its prominent ring system.' },
            { name: 'Uranus', size: 1.8, distance: 50, speed: 0.68, color: 0x4FD0E7, info: 'Ice giant that rotates on its side.' },
            { name: 'Neptune', size: 1.7, distance: 60, speed: 0.54, color: 0x4B70DD, info: 'Farthest planet, with the strongest winds.' }
        ];
        
        this.init();
    }
    
    init() {
        this.createScene();
        this.createCamera();
        this.createRenderer();
        this.createControls();
        this.createLighting();
        this.createSun();
        this.createPlanets();
        this.createStars();
        this.createAsteroidBelt();
        this.createEarthMoon();
        this.createPlanetControls();
        this.setupEventListeners();
        this.animate();
    }
    
    createScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000011);
    }
    
    createCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 20, 40);
    }
    
    createRenderer() {
        const canvas = document.getElementById('solar-system');
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: canvas,
            antialias: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    
    createControls() {
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 10;
        this.controls.maxDistance = 200;
    }
    
    createLighting() {
        // Ambient light for subtle illumination
        const ambientLight = new THREE.AmbientLight(0x404040, 0.1);
        this.scene.add(ambientLight);
        
        // Point light from the sun
        const sunLight = new THREE.PointLight(0xffffff, 2, 200);
        sunLight.position.set(0, 0, 0);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        this.scene.add(sunLight);
    }
    
    createSun() {
        const sunGeometry = new THREE.SphereGeometry(3, 32, 32);
        const sunMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xFDB813,
            emissive: 0xFDB813,
            emissiveIntensity: 1,
            roughness: 1,
            metalness: 0
        });
        this.sun = new THREE.Mesh(sunGeometry, sunMaterial);
        this.sun.name = 'Sun';
        this.scene.add(this.sun);
        
        // Add sun glow effect
        const glowGeometry = new THREE.SphereGeometry(4, 32, 32);
        const glowMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 1.0 },
                color: { value: new THREE.Color(0xFDB813) }
            },
            vertexShader: `
                varying vec3 vNormal;
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 color;
                varying vec3 vNormal;
                void main() {
                    float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
                    gl_FragColor = vec4(color, 1.0) * intensity;
                }
            `,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            transparent: true
        });
        const sunGlow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.scene.add(sunGlow);
    }
    
    createPlanets() {
        this.planetData.forEach((planetInfo, index) => {
            const planet = this.createPlanet(planetInfo);
            this.planets.push(planet);
            this.scene.add(planet.group);
        });
    }
    
    createPlanet(planetInfo) {
        const group = new THREE.Group();
        
        // Create planet sphere
        const geometry = new THREE.SphereGeometry(planetInfo.size, 32, 32);
        const material = new THREE.MeshLambertMaterial({ 
            color: planetInfo.color,
            transparent: true,
            opacity: 0.9
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.name = planetInfo.name;
        
        // Position planet at its orbital distance
        mesh.position.x = planetInfo.distance;
        group.add(mesh);
        
        // Create orbit line
        const orbitGeometry = new THREE.RingGeometry(planetInfo.distance - 0.1, planetInfo.distance + 0.1, 64);
        const orbitMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x333333, 
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.3
        });
        const orbitLine = new THREE.Mesh(orbitGeometry, orbitMaterial);
        orbitLine.rotation.x = Math.PI / 2;
        this.scene.add(orbitLine);
        
        // Special case for Saturn - add enhanced rings
        if (planetInfo.name === 'Saturn') {
            this.createSaturnRings(mesh, planetInfo.size);
        }
        
        return {
            group: group,
            mesh: mesh,
            distance: planetInfo.distance,
            speed: planetInfo.speed,
            angle: Math.random() * Math.PI * 2,
            info: planetInfo
        };
    }
    
    createStars() {
        const starsGeometry = new THREE.BufferGeometry();
        const starsCount = 1000;
        const positions = new Float32Array(starsCount * 3);
        
        for (let i = 0; i < starsCount * 3; i++) {
            positions[i] = (Math.random() - 0.5) * 400;
        }
        
        starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const starsMaterial = new THREE.PointsMaterial({ 
            color: 0xffffff,
            size: 0.5
        });
        const stars = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(stars);
    }
    
    createAsteroidBelt() {
        // Create asteroid belt between Mars and Jupiter (distance 20-30)
        const asteroidCount = 500;
        const asteroidGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(asteroidCount * 3);
        
        for (let i = 0; i < asteroidCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 25 + (Math.random() - 0.5) * 8; // Between Mars and Jupiter
            const height = (Math.random() - 0.5) * 2;
            
            positions[i * 3] = Math.cos(angle) * distance;
            positions[i * 3 + 1] = height;
            positions[i * 3 + 2] = Math.sin(angle) * distance;
        }
        
        asteroidGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const asteroidMaterial = new THREE.PointsMaterial({ 
            color: 0x8B7355,
            size: 0.3,
            transparent: true,
            opacity: 0.8
        });
        this.asteroidBelt = new THREE.Points(asteroidGeometry, asteroidMaterial);
        this.scene.add(this.asteroidBelt);
    }
    
    createEarthMoon() {
        // Find Earth planet
        const earthPlanet = this.planets.find(p => p.info.name === 'Earth');
        if (earthPlanet) {
            // Create moon
            const moonGeometry = new THREE.SphereGeometry(0.2, 16, 16);
            const moonMaterial = new THREE.MeshLambertMaterial({ 
                color: 0xC0C0C0
            });
            const moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
            moonMesh.name = 'Moon';
            moonMesh.castShadow = true;
            moonMesh.receiveShadow = true;
            
            this.earthMoon = {
                mesh: moonMesh,
                distance: 2.5,
                speed: 12,
                angle: 0,
                parent: earthPlanet
            };
            
            earthPlanet.group.add(moonMesh);
        }
    }
    
    createSaturnRings(saturnMesh, planetSize) {
        // Create multiple ring layers for Saturn with different characteristics
        const ringLayers = [
            { innerRadius: planetSize * 1.1, outerRadius: planetSize * 1.4, color: 0xCCCCCC, opacity: 0.8 },
            { innerRadius: planetSize * 1.5, outerRadius: planetSize * 1.8, color: 0xFFFFFF, opacity: 0.6 },
            { innerRadius: planetSize * 1.9, outerRadius: planetSize * 2.1, color: 0xDDDDDD, opacity: 0.7 },
            { innerRadius: planetSize * 2.2, outerRadius: planetSize * 2.4, color: 0xBBBBBB, opacity: 0.5 }
        ];
        
        ringLayers.forEach((ring, index) => {
            // Create ring geometry
            const ringGeometry = new THREE.RingGeometry(ring.innerRadius, ring.outerRadius, 64);
            
            // Create ring material with enhanced properties
            const ringMaterial = new THREE.MeshLambertMaterial({
                color: ring.color,
                transparent: true,
                opacity: ring.opacity,
                side: THREE.DoubleSide,
                depthWrite: false // Prevents z-fighting between rings
            });
            
            const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
            ringMesh.rotation.x = Math.PI / 2;
            ringMesh.name = `SaturnRing${index}`;
            
            // Add subtle rotation to rings for realism
            ringMesh.userData = {
                rotationSpeed: 0.001 + (index * 0.0005) // Different speeds for each ring
            };
            
            saturnMesh.add(ringMesh);
        });
        
        // Create Cassini Division (gap between rings)
        const cassiniGeometry = new THREE.RingGeometry(planetSize * 1.65, planetSize * 1.75, 64);
        const cassiniMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
        });
        const cassiniDivision = new THREE.Mesh(cassiniGeometry, cassiniMaterial);
        cassiniDivision.rotation.x = Math.PI / 2;
        cassiniDivision.name = 'CassiniDivision';
        saturnMesh.add(cassiniDivision);
    }
    
    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Mouse interaction
        this.renderer.domElement.addEventListener('click', (event) => this.onMouseClick(event));
        this.renderer.domElement.addEventListener('mousemove', (event) => this.onMouseMove(event));
        
        // Control buttons
        document.getElementById('play-pause').addEventListener('click', () => this.toggleAnimation());
        document.getElementById('reset-camera').addEventListener('click', () => this.resetCamera());
        document.getElementById('theme-toggle').addEventListener('click', () => this.toggleTheme());
        
        // Global speed control
        const globalSpeedSlider = document.getElementById('global-speed-slider');
        const globalSpeedValue = document.getElementById('global-speed-value');
        globalSpeedSlider.addEventListener('input', (e) => {
            this.animationSpeed = parseFloat(e.target.value);
            globalSpeedValue.textContent = `${this.animationSpeed}x`;
        });
    }
    
    onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        const intersects = this.raycaster.intersectObjects(
            this.planets.map(p => p.mesh).concat([this.sun])
        );
        
        if (intersects.length > 0) {
            const selectedObject = intersects[0].object;
            this.showTooltip(event, selectedObject.name);
            document.body.style.cursor = 'pointer';
        } else {
            this.hideTooltip();
            document.body.style.cursor = 'default';
        }
    }
    
    showTooltip(event, planetName) {
        this.tooltip.textContent = planetName;
        this.tooltip.style.left = event.clientX + 10 + 'px';
        this.tooltip.style.top = event.clientY - 30 + 'px';
        this.tooltip.classList.add('visible');
    }
    
    hideTooltip() {
        this.tooltip.classList.remove('visible');
    }
    createPlanetControls() {
        const slidersContainer = document.getElementById('planet-sliders');
        this.planetData.forEach(planetInfo => {
            const sliderDiv = document.createElement('div');
            sliderDiv.className = 'planet-speed-control ' + planetInfo.name.toLowerCase();

            const label = document.createElement('label');
            label.textContent = planetInfo.name + ' Speed';
            sliderDiv.appendChild(label);

            const input = document.createElement('input');
            input.type = 'range';
            input.min = '0.1';
            input.max = '3';
            input.step = '0.1';
            input.value = '1';
            input.addEventListener('input', (e) => {
                const speedMultiplier = parseFloat(e.target.value);
                const planet = this.planets.find(p => p.info.name === planetInfo.name);
                if (planet) {
                    planet.speed = planet.info.speed * speedMultiplier;
                    sliderDiv.querySelector('.speed-value').textContent = speedMultiplier.toFixed(1) + 'x';
                }
            });
            sliderDiv.appendChild(input);

            const speedValue = document.createElement('span');
            speedValue.className = 'speed-value';
            speedValue.textContent = '1.0x';
            sliderDiv.appendChild(speedValue);

            slidersContainer.appendChild(sliderDiv);
        });
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    toggleTheme() {
        this.isDarkTheme = !this.isDarkTheme;
        document.body.classList.toggle('light-theme', !this.isDarkTheme);
        document.getElementById('theme-toggle').textContent = this.isDarkTheme ? '🌙 Dark Mode' : '🌞 Light Mode';
    }
    onMouseClick(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        const intersects = this.raycaster.intersectObjects(
            this.planets.map(p => p.mesh).concat([this.sun])
        );
        
        if (intersects.length > 0) {
            const selectedObject = intersects[0].object;
            this.displayPlanetInfo(selectedObject.name);
        }
    }
    
    displayPlanetInfo(planetName) {
        const infoDiv = document.getElementById('selected-planet');
        
        if (planetName === 'Sun') {
            infoDiv.innerHTML = `
                <h4>Sun</h4>
                <p>The star at the center of our solar system. It's a nearly perfect sphere of hot plasma, heated by nuclear fusion reactions in its core.</p>
                <p><strong>Type:</strong> G-type main-sequence star</p>
                <p><strong>Age:</strong> ~4.6 billion years</p>
            `;
        } else {
            const planet = this.planets.find(p => p.info.name === planetName);
            if (planet) {
                infoDiv.innerHTML = `
                    <h4>${planet.info.name}</h4>
                    <p>${planet.info.info}</p>
                    <p><strong>Distance from Sun:</strong> ${planet.info.distance} AU (scaled)</p>
                    <p><strong>Orbital Speed:</strong> ${planet.info.speed} km/s (scaled)</p>
                `;
            }
        }
    }
    
    toggleAnimation() {
        this.isAnimating = !this.isAnimating;
        const button = document.getElementById('play-pause');
        button.textContent = this.isAnimating ? 'Pause' : 'Play';
    }
    
    resetCamera() {
        this.camera.position.set(0, 20, 40);
        this.controls.reset();
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (this.isAnimating) {
            const deltaTime = this.clock.getDelta();
            
            // Rotate sun
            this.sun.rotation.y += deltaTime * 0.5;
            
            // Update planet positions
            this.planets.forEach(planet => {
                planet.angle += deltaTime * planet.speed * 0.1 * this.animationSpeed;
                planet.mesh.position.x = Math.cos(planet.angle) * planet.distance;
                planet.mesh.position.z = Math.sin(planet.angle) * planet.distance;
                
                // Rotate planet on its axis
                planet.mesh.rotation.y += deltaTime * 2;
                
                // Animate Saturn's rings
                if (planet.info.name === 'Saturn') {
                    planet.mesh.children.forEach(child => {
                        if (child.name && child.name.startsWith('SaturnRing') && child.userData.rotationSpeed) {
                            child.rotation.z += deltaTime * child.userData.rotationSpeed * this.animationSpeed;
                        }
                    });
                }
            });
            
            // Update Earth's moon
            if (this.earthMoon) {
                this.earthMoon.angle += deltaTime * this.earthMoon.speed * this.animationSpeed;
                this.earthMoon.mesh.position.x = Math.cos(this.earthMoon.angle) * this.earthMoon.distance;
                this.earthMoon.mesh.position.z = Math.sin(this.earthMoon.angle) * this.earthMoon.distance;
            }
            
            // Rotate asteroid belt slowly
            if (this.asteroidBelt) {
                this.asteroidBelt.rotation.y += deltaTime * 0.1 * this.animationSpeed;
            }
        }
        
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the solar system when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Show loading message
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading';
    loadingDiv.textContent = 'Loading Solar System';
    document.body.appendChild(loadingDiv);
    
    // Initialize solar system after a brief delay to show loading
    setTimeout(() => {
        try {
            new SolarSystem();
            loadingDiv.remove();
        } catch (error) {
            console.error('Error initializing solar system:', error);
            loadingDiv.textContent = 'Error loading Solar System. Please refresh the page.';
        }
    }, 1000);
});
