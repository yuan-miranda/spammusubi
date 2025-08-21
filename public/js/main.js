import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const config = {
    miniMusubiScale: 0.2,
    gravity: 9.81,
    removeFloorY: -3
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xF0F0F0);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 1;
camera.position.y = 1;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;

const hemiLight = new THREE.HemisphereLight(0xffffff, 0x888888, 0.6);
hemiLight.position.set(0, 1, 0);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(3, 5, 2);
scene.add(dirLight);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let musubiModel = null;
let miniMusubis = [];

// https://skfb.ly/oVqKQ
const loader = new GLTFLoader();
loader.load('spam_musubi.glb', (gltf) => {
    musubiModel = gltf.scene;
    musubiModel.position.y = -0.5;
    musubiModel.rotation.y = Math.PI / 2;
    scene.add(musubiModel);
});

const clock = new THREE.Clock();

let clickCount = localStorage.getItem('clickCount') || 0;
const counter = document.getElementById('counter');

window.addEventListener('click', ({ clientX, clientY }) => {
    if (!musubiModel) return;

    mouse.set(
        (clientX / window.innerWidth) * 2 - 1,
        -(clientY / window.innerHeight) * 2 + 1
    );

    raycaster.setFromCamera(mouse, camera);
    const [intersect] = raycaster.intersectObject(musubiModel, true);
    if (!intersect) return;

    const miniMusubi = musubiModel.clone();
    miniMusubi.scale.setScalar(config.miniMusubiScale);
    miniMusubi.position.copy(intersect.point);
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

    clickCount++;
    counter.innerText = clickCount;
    localStorage.setItem('clickCount', clickCount);
});

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    const delta = clock.getDelta();

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
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});