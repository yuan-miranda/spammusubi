import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const config = {
    miniMusubiScale: 0.2,
    gravity: 9.81,
    removeFloorY: -3
};

let scene, camera, renderer, controls, raycaster, mouse;
const clock = new THREE.Clock();
let popup = null;
let counterEl = null;
let clickCount = 0;
let musubiModel = null;
let miniMusubis = [];

document.addEventListener('DOMContentLoaded', () => {
    initScene();
    initRenderer();
    initLighting();
    initOrbitControls();
    initRaycaster();

    initUI();
    loadMusubiModel();
    eventListeners();
    animate();

});


function initScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xF0F0F0);

    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 1.25, 1);
}

function initRenderer() {
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
}

function initLighting() {
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x888888, 0.6);
    hemiLight.position.set(0, 1, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(3, 5, 2);
    scene.add(dirLight);
}

function initOrbitControls() {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
}

function initRaycaster() {
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
}

function initUI() {
    popup = document.getElementById('popup');
    counterEl = document.getElementById('counter');
    clickCount = parseInt(localStorage.getItem('clickCount') || '0');
}

function loadMusubiModel() {
    const loader = new GLTFLoader();
    // https://skfb.ly/oVqKQ
    loader.load('spam_musubi.glb', (gltf) => {
        musubiModel = gltf.scene;
        musubiModel.position.y = -0.5;
        musubiModel.rotation.y = Math.PI / 2;
        scene.add(musubiModel);
    });
}

function eventListeners() {
    // load counter animation
    popup.addEventListener('click', () => {
        popup.classList.add('hidden');
        setTimeout(() => {
            popup.style.display = 'none';
            animateCounter(clickCount);
        }, 500);
    });

    window.addEventListener('click', handleMouseClick);
    window.addEventListener('resize', handleWindowResize);
}

function handleMouseClick(event) {
    if (popup && popup.style.display !== 'none') return;
    if (!musubiModel) return;

    mouse.set(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
    );

    raycaster.setFromCamera(mouse, camera);
    const [intersect] = raycaster.intersectObject(musubiModel, true);
    if (!intersect) return;

    spawnMiniMusubi(intersect.point);
}

function handleWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animateCounter(target) {
    let current = 0;
    const duration = 500;
    const startTime = performance.now();

    function update(time) {
        const progress = Math.min((time - startTime) / duration, 1);
        current = Math.floor(progress * target);
        counterEl.innerText = current;

        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

function spawnMiniMusubi(position) {
    const miniMusubi = musubiModel.clone();
    miniMusubi.scale.setScalar(config.miniMusubiScale);
    miniMusubi.position.copy(position);

    miniMusubis.push({
        mesh: miniMusubi,
        velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 0.5,
            1 + Math.random() * 0.5,
            (Math.random() - 0.5) * 0.5
        ),
        rotationSpeed: new THREE.Vector3(
            (Math.random() - 0.5) * 6,
            (Math.random() - 0.5) * 6,
            (Math.random() - 0.5) * 6
        )
    });

    scene.add(miniMusubi);
    updateCounter();
}

function updateCounter() {
    clickCount++;
    counterEl.innerText = clickCount;
    localStorage.setItem('clickCount', clickCount);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();

    const delta = clock.getDelta();
    updateMiniMusubis(delta);

    renderer.render(scene, camera);
}

function updateMiniMusubis(delta) {
    for (let i = miniMusubis.length - 1; i >= 0; i--) {
        const { mesh, velocity, rotationSpeed } = miniMusubis[i];
        velocity.y -= config.gravity * delta;
        mesh.position.addScaledVector(velocity, delta);
        mesh.rotation.x += rotationSpeed.x * delta;
        mesh.rotation.y += rotationSpeed.y * delta;
        mesh.rotation.z += rotationSpeed.z * delta;

        if (mesh.position.y < config.removeFloorY) {
            scene.remove(mesh);
            miniMusubis.splice(i, 1);
        }
    }
}