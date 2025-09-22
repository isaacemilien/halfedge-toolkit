import * as THREE from 'three'
import './style.css'
import { HalfedgeDS, Vertex, Halfedge} from 'three-mesh-halfedge'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
// import { splitEdge } from './edgeSplit';
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
    // Default
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    this.renderer = new THREE.WebGLRenderer()
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.light = new THREE.AmbientLight()

    this.init()
    this.animate()
    
    
    this.createCube()
    const geometry = new THREE.BoxGeometry()
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 })
    this.cube = new THREE.Mesh(geometry, material)
    const heds = this.createHEDS()
    // Extrude face

    // Identify
    const faceToExtrude = heds.faces[0]
    
    const start = faceToExtrude.halfedge;
    const V_old: Vertex[] = [];
    const E_old: Halfedge[] = [];

    for (const he of start.nextLoop()) {
      V_old.push(he.vertex);
      E_old.push(he);
    }

    // Duplicate
    const V_new: Vertex[] = [];
    // const E_new: Halfedge[] = [];

    for (const v of V_old){
      const duplicateV = new Vertex();
      duplicateV.position.copy(v.position);
      V_new.push(duplicateV)
    }





    this.halfEdgeVisualiser = new HalfEdgeVisualiser(this.scene, heds);


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
  }

  private createHEDS(): HalfedgeDS {
    const HEDS = new HalfedgeDS();

    HEDS.setFromGeometry(this.cube.geometry);
    return HEDS;
  }

  private setFromHEDS(HEDS: HalfedgeDS): THREE.BufferGeometry {

    const flatPositions = new Array<number>();
    const positions = new Float32Array(HEDS.vertices.length * 3);
    HEDS.vertices.forEach(vertex => {
      flatPositions.push(vertex.position.x);
      flatPositions.push(vertex.position.y);
      flatPositions.push(vertex.position.z);
    });

    positions.set(flatPositions)

    const indices = new Array<number>();

    HEDS.faces.forEach(face => {
      for (const HE of face.halfedge.nextLoop()) {
        indices.push(HE.vertex.id);
      }
    });

    const obj = new THREE.BufferGeometry();
    obj.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    obj.setIndex(new THREE.BufferAttribute(new Uint16Array(indices), 1));
    return obj;
  }

  private animate(): void {
    requestAnimationFrame(this.animate.bind(this))
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
