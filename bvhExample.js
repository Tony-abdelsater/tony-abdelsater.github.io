import * as THREE from './build/three.module.js';
import { OrbitControls } from './build//OrbitControls.js';
import { BVHLoader } from './build/BVHLoader.js';

const setupThreeJS = (element) => {
    const clock = new THREE.Clock();
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, element.clientWidth / element.clientHeight, 1, 1000);
    camera.position.set(0, 200, 300);
    scene.background = new THREE.Color(0xeeeeee);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(element.clientWidth, element.clientHeight);
    element.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.minDistance = 300;
    controls.maxDistance = 700;

    let mixer;

    const loader = new BVHLoader();
    loader.load('./bvh2/pirouette.bvh', function (result) {
        const skeletonHelper = new THREE.SkeletonHelper(result.skeleton.bones[0]);
        scene.add(result.skeleton.bones[0]);
        scene.add(skeletonHelper);
        mixer = new THREE.AnimationMixer(result.skeleton.bones[0]);
        mixer.clipAction(result.clip).play();
    });

    function animate() {
        requestAnimationFrame(animate);
        const delta = clock.getDelta();
        if (mixer) mixer.update(delta);
        renderer.render(scene, camera);
    }
    animate();

    return () => {
        renderer.domElement.remove();
        renderer.dispose();
    };
};

export { setupThreeJS };
