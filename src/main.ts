import * as THREE from 'three'
import './style.css'
import { HalfedgeDS } from 'three-mesh-halfedge'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { splitEdge } from './edgeSplit';
import { HalfEdgeVisualiser } from './HalfEdgeVisualiser';

class ThreeJSApp {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private cube: THREE.Mesh
  private controls: OrbitControls
  private light: THREE.AmbientLight
  private halfEdgeVisualiser: HalfEdgeVisualiser;

  constructor() {
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    this.renderer = new THREE.WebGLRenderer()
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.light = new THREE.AmbientLight()

    this.init()
    this.createCube()
    this.animate()

    const geometry = new THREE.BoxGeometry()
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 })
    this.cube = new THREE.Mesh(geometry, material)
    // this.scene.add(this.cube)
    const heds = this.createHEDS()


    const heToSplit = heds.halfedges[1]
    const pos1 = heToSplit.vertex.position;
    const pos2 = heToSplit.twin.vertex.position;

    const midpoint = new THREE.Vector3(
      (pos1.x + pos2.x) / 2, 
      (pos1.y + pos2.y) / 2, 
      (pos1.z + pos2.z) / 2)

    console.log(midpoint);

    splitEdge(heds, heToSplit, midpoint);

    this.halfEdgeVisualiser = new HalfEdgeVisualiser(this.scene, heds);


    const bruh = new THREE.Mesh(this.setFromHEDS(heds), material)
    // this.scene.add(bruh);

    this.halfEdgeVisualiser.visualise();
    this.scene.add(this.light);
  }

  private init(): void {
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    document.getElementById('app')?.appendChild(this.renderer.domElement)

    this.camera.position.z = 5

    window.addEventListener('resize', this.onWindowResize.bind(this))
  }

  private createCube(): void {
    const geometry = new THREE.BoxGeometry()
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    this.cube = new THREE.Mesh(geometry, material)
    // this.scene.add(this.cube)
  }

  private createHEDS(): HalfedgeDS {
    const HEDS = new HalfedgeDS();

    HEDS.setFromGeometry(this.cube.geometry);
    return HEDS;
  }

  private setFromHEDS(HEDS: HalfedgeDS): THREE.BufferGeometry {

    let flatPositions = new Array<number>();
    let positions = new Float32Array(HEDS.vertices.length * 3);
    HEDS.vertices.forEach(vertex => {
      flatPositions.push(vertex.position.x);
      flatPositions.push(vertex.position.y);
      flatPositions.push(vertex.position.z);
    });

    positions.set(flatPositions)

    // Index array faces
    let indices = new Array<number>();

    HEDS.faces.forEach(face => {
      for (const HE of face.halfedge.nextLoop()) {
        indices.push(HE.vertex.id);
      }
    });

    let obj = new THREE.BufferGeometry();
    obj.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    obj.setIndex(new THREE.BufferAttribute(new Uint16Array(indices), 1));
    return obj;
  }

  private animate(): void {
    requestAnimationFrame(this.animate.bind(this))

    // this.cube.rotation.x += 0.01
    // this.cube.rotation.y += 0.01
    this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }
}

new ThreeJSApp()