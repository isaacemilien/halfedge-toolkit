import * as THREE from 'three'
import './style.css'
import { HalfedgeDS } from 'three-mesh-halfedge'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { HalfEdgeVisualiser } from './HalfEdgeVisualiser'; 

import { parseOBJToHalfedge, extrudeFace, insetFace } from 'three-mesh-edit';

class ThreeJSApp {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
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

    const heds = new HalfedgeDS();

    const objText = `
      v 4.726442 1.000000 -1.000000
      v 4.726442 -1.000000 -1.000000
      v 4.726442 1.000000 1.000000
      v 4.726442 -1.000000 1.000000
      v -4.726442 1.000000 -1.000000
      v -4.726442 -1.000000 -1.000000
      v -4.726442 1.000000 1.000000
      v -4.726442 -1.000000 1.000000
      f 1/1/1 5/2/1 7/3/1 3/4/1
      f 4/5/2 3/4/2 7/6/2 8/7/2
      f 8/8/3 7/9/3 5/10/3 6/11/3
      f 6/12/4 2/13/4 4/5/4 8/14/4
      f 2/13/5 1/1/5 3/4/5 4/5/5
      f 6/11/6 5/10/6 1/1/6 2/13/6
    `

    parseOBJToHalfedge(heds, objText)
    console.log("before", heds.halfedges);

    extrudeFace(heds, heds.faces[0], new THREE.Vector3(0, 1, 0), 5, 2);
    console.log("after", heds.halfedges);
    insetFace(heds, heds.faces[0], 1, 1);

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
