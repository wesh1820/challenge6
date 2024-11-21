import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { gsap } from 'gsap';
import * as dat from 'dat.gui'; // Import dat.GUI

// Texture Loader
const textureLoader = new THREE.TextureLoader();
const matcapTexture = textureLoader.load('assets/textures/matcap.png');
const texturecamo = textureLoader.load('assets/textures/bliksem.png');
const flash = textureLoader.load('assets/textures/flash08.png');

// Scene
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(100, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.shadowMap.enabled = true; // Enable shadow mapping
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Soft shadows
document.body.appendChild(renderer.domElement);

// HDR Background
const hdrLoader = new RGBELoader();
hdrLoader.load('assets/textures/warehouse.hdr', (hdrTexture) => {
    hdrTexture.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = hdrTexture;
    scene.environment = hdrTexture;
}, undefined, (error) => {
    console.error('Error loading HDR texture:', error);
});

// GLTF Loader
const loader = new GLTFLoader();
let model;
loader.load('assets/models/shoe_compressed.gltf', (gltf) => {
    gltf.scene.traverse((child) => {
        if (child.name === 'sole_top') {
            child.material = new THREE.MeshStandardMaterial({
                map: texturecamo,
                color: 0xff0000, // Red for the sole
                metalness: 0.9,
                roughness: 0.1,
            });
        } else if (child.name === 'meshes5_1') {
            child.material = new THREE.MeshStandardMaterial({
                map: texturecamo,
                color: 0x00ff00, // Green for this mesh
                metalness: 0.9,
                roughness: 0.1,
            });
        } else if (child.name === 'laces') {
            child.material = new THREE.MeshStandardMaterial({
                map: texturecamo,
                color: 0x0000ff, // Blue for the laces
                metalness: 0.5,
                roughness: 0.2,
            });
            child.castShadow = true; // Enable casting shadows on the model
            child.receiveShadow = true; // Enable receiving shadows
        }
    });

    gltf.scene.position.z = 4.7;
    gltf.scene.position.y = 0;
    scene.add(gltf.scene);
    model = gltf.scene;

    function animateModel() {
        if (model) model.rotation.y += 0.01;
        requestAnimationFrame(animateModel);
    }
    animateModel();
});

// Lighting
const light = new THREE.PointLight(0xffffff, 1, 100);
light.position.set(10, 10, 10);
light.castShadow = true; // Enable the light to cast shadows
scene.add(light);

// Add a ground plane to receive shadows
const groundGeometry = new THREE.PlaneGeometry(500, 500);
const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.5 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = - Math.PI / 2; // Rotate the ground to make it horizontal
ground.position.y = -1; // Position it below the model
ground.receiveShadow = true; // Enable receiving shadows on the ground
scene.add(ground);

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Responsive Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Scroll Event
window.addEventListener('scroll', () => {
    const scrollPosition = window.scrollY;
    gsap.to(camera.position, {
        duration: 0.5,
        ease: 'power2.out',
        z: Math.max(5, scrollPosition * 0.01),
    });
});

// Smoke Particles
const smokeParticles = new THREE.Group();
const smokeMaterial = new THREE.MeshBasicMaterial({
    map: flash,
    transparent: true,
    opacity: 0.5,
    color: 0xffffff,
});
for (let i = 0; i < 20; i++) {
    const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(3, 3),
        smokeMaterial
    );
    plane.position.set(
        Math.random() * 20 - 10,
        Math.random() * 20 - 10,
        Math.random() * 20 - 10
    );
    smokeParticles.add(plane);
}
scene.add(smokeParticles);

// dat.GUI Setup
const gui = new dat.GUI({ width: 300 });

// Camera Controls
const cameraFolder = gui.addFolder('Camera');
cameraFolder.add(camera.position, 'z', 1, 10).name('Camera Zoom');

// Light Controls
const lightFolder = gui.addFolder('Light');
lightFolder.add(light.position, 'x', -20, 20).name('Light X');
lightFolder.add(light.position, 'y', -20, 20).name('Light Y');
lightFolder.add(light.position, 'z', -20, 20).name('Light Z');
lightFolder.add(light, 'intensity', 0, 2).name('Light Intensity');

// Material Controls
const materialFolder = gui.addFolder('Material');
const materialControls = {
    metalness: 0.9,
    roughness: 0.1,
    color: '#ffffff',
};
materialFolder.add(materialControls, 'metalness', 0, 1).onChange((value) => {
    if (model) {
        model.traverse((child) => {
            if (child.isMesh) {
                child.material.metalness = value;
            }
        });
    }
});
materialFolder.add(materialControls, 'roughness', 0, 1).onChange((value) => {
    if (model) {
        model.traverse((child) => {
            if (child.isMesh) {
                child.material.roughness = value;
            }
        });
    }
});
materialFolder.addColor(materialControls, 'color').onChange((value) => {
    if (model) {
        model.traverse((child) => {
            if (child.isMesh) {
                child.material.color.set(value);
            }
        });
    }
});
materialFolder.open();

// Smoke Controls
const smokeFolder = gui.addFolder('Smoke');
const smokeControls = {
    opacity: 0.5,
    scale: 1,
};
smokeFolder.add(smokeControls, 'opacity', 0, 1).onChange((value) => {
    smokeParticles.children.forEach((particle) => {
        particle.material.opacity = value;
    });
});
smokeFolder.add(smokeControls, 'scale', 0.1, 5).onChange((value) => {
    smokeParticles.children.forEach((particle) => {
        particle.scale.set(value, value, value);
    });
});
smokeFolder.open();

// Manually adjust the GUI position if not visible
gui.domElement.style.position = 'absolute';
gui.domElement.style.top = '10px';
gui.domElement.style.right = '10px';
gui.domElement.style.zIndex = '9999'; // Ensure GUI is on top of other elements
document.body.appendChild(gui.domElement);

// Animation Loop
function animate() {
    controls.update();
    renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
