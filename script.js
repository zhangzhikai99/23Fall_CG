import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

let scene, camera, renderer, model, sunLight, moonLight, ambientLight, skyLight, groundLight, controls;
let angle = Math.PI / 2; // Start at sunrise
let fogActive = false; // Initial state of fog
let fogend = false;
let fogTimer = 0; // Timer for fog effect
const fogMaxDensity = 0.15; // Consistent intensity of the fog
const fogChangeSpeed = 0.01; // Speed at which fog density changes


function init() {
    // Create the scene
    scene = new THREE.Scene();

    // Create the camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 4;
    camera.position.y = 1;

    // Create the renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Load the model
    const loader = new GLTFLoader();
    loader.load('scene.gltf', function (gltf) {  
        const model = gltf.scene;  
        model.traverse((object) => {
            if(object.name == "Pyramid_01_-_Default_0" || object.name == "Pyramid_02_-_Default_0") {
                object.castShadow = true
                object.receiveShadow = true;
            }
            if(object.name == "Skybox_03_-_Default_0") {
                object.receiveShadow = true;
            }
        });
        scene.add(gltf.scene);
    }, undefined, function (error) {
        console.error(error);
    });

    // Set up lighting
    ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Ambient light slightly dim
    scene.add(ambientLight);

    sunLight = new THREE.PointLight(0xffaa00, 200); // Simulate sunlight

    moonLight = new THREE.PointLight(0xffaa00, 100); // Simulate moonlight

    skyLight = new THREE.DirectionalLight(0xffffff, 0); // Initially turned off
    skyLight.position.set(0, -0.01, 0); // Set light direction downwards to illuminate "sky"
    scene.add(skyLight);

    groundLight = new THREE.DirectionalLight(0xffffff, 0.5); // Initially turned on
    groundLight.position.set(0, 0.01, 0); // Set light direction upwards to illuminate "ground"
    scene.add(groundLight);

    // Enable Shadow
    renderer.shadowMap.enabled = true;
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(4096, 4096);
    scene.add(sunLight);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.set(4096, 4096);
    scene.add(moonLight);

    scene.fog = new THREE.FogExp2(0xaaaaaa, 0); // Initial density set to 0

    // Initialize OrbitControls
    controls = new OrbitControls(camera, renderer.domElement);

    // Set parameters for the controller (optional)
    controls.enableDamping = true; // Enable damping (inertia) for a smoother control experience
    controls.dampingFactor = 0.05;

    // Add a listener for window resize
    window.addEventListener('resize', onWindowResize, false);

    // Start the rendering loop
    animate();
}

function animate() {
    requestAnimationFrame(animate);

    // Update the controller
    controls.update();

    // Update the position of the sunlight
    sunLight.position.set(
        Math.cos(angle) * 9.5,
        Math.sin(angle) * 9.5,
        0
    );

    moonLight.position.set(
        Math.cos(angle + Math.PI) * 9.5,
        Math.sin(angle + Math.PI) * 9.5,
        0
    );

    // Change light color to simulate sunrise and sunset
    const lightColor = new THREE.Color();
    lightColor.setHSL(0.1, 1, (Math.sin(angle) * 0.5 + 0.5));
    sunLight.color = lightColor;

    // Change light color to simulate sunrise and sunset
    const moonColor = new THREE.Color();
    moonColor.setHSL(0.5, 1, (Math.sin(angle + Math.PI) * 0.15 + 0.85));
    moonLight.color = moonColor;

    // Change background color to simulate sky color
    const skyColor = new THREE.Color();
    skyColor.setHSL(0.65, 1, Math.max(0,Math.sin(angle) * 0.5 + 0.6));
    skyLight.color = skyColor;

    // Change background color to simulate ground color
    const groundColor = new THREE.Color();
    groundColor.setHSL(0.55, 0.3, Math.max(0, Math.sin(angle) * 0.2 + 0.7));
    groundLight.color = groundColor;

    if (Math.sin(angle) > 0) {
        // During the day, increase sky / ground light intensity
        skyLight.intensity = 5 + Math.min(15, Math.sin(angle) * 50);
        groundLight.intensity = 5 + Math.min(15, Math.sin(angle) * 5);
    } else {
        // At night, decrease sky / ground light intensity
        skyLight.intensity = 5 + Math.sin(angle) * 3;
        groundLight.intensity = 5 + Math.sin(angle) * 3;
    }
    // Increase angle to simulate the movement of the sun / moon
    angle += 0.002;

    updateFog();

    renderer.render(scene, camera);
}

// Function to update fog effect
function updateFog() {
    if (fogActive) {
        // If fog is active, decrease timer
        fogTimer -= 1;
        if (fogend == false){
            if(scene.fog.density < fogMaxDensity){
                scene.fog.density += 0.001;
            } else {
                fogend = true;
            }
        } else{
            scene.fog.density = Math.min(fogMaxDensity, fogTimer * 0.001);
        }   
        if (fogTimer <= 0) {
            // Disable fog when timer ends
            fogActive = false;
            scene.fog.density = 0;
        }
    } else {
        // If fog is not active, randomly start fog
        if (Math.random() < 0.003) { // Random chance to start fog
            fogActive = true;
            fogend = false;
            fogTimer = Math.random() * 120 + 300; // Random duration between 1-3 minutes
            scene.fog.density = 0;
        }
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

init();