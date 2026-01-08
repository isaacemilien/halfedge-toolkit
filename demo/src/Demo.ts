import './style.css'
import * as THREE from "three"
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export class Demo {
  scene: THREE.Scene = new THREE.Scene();
  camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000) 
  renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer()
  controls: OrbitControls = new OrbitControls(this.camera, this.renderer.domElement);
  light: THREE.AmbientLight = new THREE.AmbientLight()

  init(): void {
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    document.getElementById('app')?.appendChild(this.renderer.domElement)

    this.scene.add(this.light);

    this.camera.position.z = 5
  }

  animate(): void {
    requestAnimationFrame(this.animate.bind(this))
    this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }
}
