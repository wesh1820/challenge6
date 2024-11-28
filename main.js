import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { gsap } from 'gsap';
import * as dat from 'dat.gui'; // Import dat.GUI

// Texture Loader
const textureLoader = new THREE.TextureLoader();
const matcapTexture = textureLoader.load('assets/textures/matcap.png');
const texturecamo = textureLoader.load('assets/textures/dam.jpg');
const flash = textureLoader.load('assets/textures/flash08.png');

// Scene
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(100, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 10;

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

// Globale variabelen voor het huidige object
let currentObjectIndex = 0;
let selectedObject = null;

// Objecten die we willen aanpassen
const objectsToCustomize = ['laces', 'sole_top', 'meshes5_1', 'outside_1', 'outside_2', 'outside_3', 'sole_bottom'];
const objectMap = {};

// Kleurkeuzes (4 kleuren)
const colors = [
    0xFF0000, // Red
    0x00FF00, // Green
    0x0000FF, // Blue
    0xFFFF00  // Yellow
];

// Laad de objecten en geef ze de mogelijkheid om gekleurd en getextureerd te worden
loader.load('assets/models/shoe.gltf', (gltf) => {
    gltf.scene.traverse((child) => {
        if (objectsToCustomize.includes(child.name)) {
            objectMap[child.name] = child; // Voeg het object toe aan de map
            child.material = new THREE.MeshStandardMaterial({
                color: 0xFFFFFF, // Standaard kleur wit
                metalness: 0.9,
                roughness: 0.1,
            });
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
    
    gltf.scene.position.z = 4.7;
    gltf.scene.position.y = 0;
    scene.add(gltf.scene);
    model = gltf.scene;

    // Start customization menu voor het eerste object
    openCustomizationMenu(objectsToCustomize[currentObjectIndex]);
});
document.querySelectorAll('.texture-preview').forEach(button => {
    button.addEventListener('click', () => {
        const textureName = button.getAttribute('data-texture');
        if (selectedObject) {
            if (textureName === 'Dam') {
                selectedObject.material.map = texturecamo;
            } else if (textureName === 'matcap') {
                selectedObject.material.map = matcapTexture;
            } else {
                selectedObject.material.map = null;
            }
            selectedObject.material.needsUpdate = true;
        }
    });
});
document.querySelectorAll('.color-preview').forEach(button => {
    button.addEventListener('click', () => {
        const colorHex = button.getAttribute('data-color');
        if (selectedObject) {
            selectedObject.material.color.set(colorHex); // Stel de kleur direct in
            selectedObject.material.needsUpdate = true; // Zorg dat de wijzigingen worden weergegeven
        } else {
            console.warn("Geen object geselecteerd om kleur toe te passen.");
        }
    });
});

// Functie om het menu voor het object te openen
function openCustomizationMenu(objectName) {
    selectedObject = objectMap[objectName]; // Verkrijg het object uit de objectMap
    const menu = document.getElementById('customization-menu');
    const objectNameLabel = document.getElementById('object-name');
    const colorPicker = document.getElementById('color-picker');
    const texturePicker = document.getElementById('texture-picker');

    // Toon het menu
    menu.style.display = 'block';

    // Toon de naam van het geselecteerde onderdeel
    objectNameLabel.textContent = `Customize ${selectedObject.name}`;

    // Standaardkleur van het object instellen
    colorPicker.value = `#${selectedObject.material.color.getHexString()}`;

    // Eventlistener voor 'Apply' knop
    document.getElementById('apply-changes').onclick = () => {
        // Pas de kleur aan
        const newColor = colorPicker.value;
        selectedObject.material.color.set(newColor);

        // Pas de textuur aan
        const selectedTexture = texturePicker.value;
        if (selectedTexture === 'Dam') {
            selectedObject.material.map = texturecamo;
        } else if (selectedTexture === 'matcap') {
            selectedObject.material.map = matcapTexture;
        } else {
            selectedObject.material.map = null;
        }

        selectedObject.material.needsUpdate = true;

        // Verberg het menu na wijzigingen
        menu.style.display = 'none';
    };

    // Eventlistener voor 'Close' knop
    document.getElementById('close-menu').onclick = () => {
        menu.style.display = 'none';
    };
}

// Functie om naar het volgende object te gaan
document.getElementById('next-object').onclick = () => {
    currentObjectIndex = (currentObjectIndex + 1) % objectsToCustomize.length;
    openCustomizationMenu(objectsToCustomize[currentObjectIndex]);
};

// Functie om naar het vorige object te gaan
document.getElementById('previous-object').onclick = () => {
    currentObjectIndex = (currentObjectIndex - 1 + objectsToCustomize.length) % objectsToCustomize.length;
    openCustomizationMenu(objectsToCustomize[currentObjectIndex]);
};

// Raycasting om objecten aan te klikken en menu te openen
document.addEventListener('click', (event) => {
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        const clickedObject = intersects[0].object;

        // Alleen specifieke onderdelen toestaan
        if (objectsToCustomize.includes(clickedObject.name)) {
            openCustomizationMenu(clickedObject.name);
        }
    }
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
    scale: 1.5,
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

// Animation Loop
function animate() {
    // Draai de schoen of het hele model elke frame
    if (model) {
        model.rotation.y += 0.01; // Draai de schoen langzaam om de Y-as
    }

    // Update de orbit controls voor interactie
    controls.update();
    
    // Render de scene
    renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
