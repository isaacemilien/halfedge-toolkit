import * as THREE from 'three'
import './style.css'
import { HalfedgeDS, Face } from 'three-mesh-halfedge'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { HalfEdgeVisualiser } from './HalfEdgeVisualiser'; 

import { parseOBJToHalfedge, extrudeFace, Wrapper, LogicalMesh, RenderMesh} from 'three-mesh-edit';

class ThreeJSApp {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private controls: OrbitControls
  private light: THREE.AmbientLight
  private logicalMesh: LogicalMesh
  private renderMesh: RenderMesh
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private mouse: THREE.Vector2 = new THREE.Vector2();
  private selectedFace: Face | None;
  private faceHighlightObject: THREE.Mesh;

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
    this.halfEdgeVisualiser = new HalfEdgeVisualiser(this.scene, heds);

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

    this.logicalMesh = new LogicalMesh(heds);

    const material = new THREE.MeshStandardMaterial({
      color: 0x808080});

    this.renderMesh = new RenderMesh(material);
    this.renderMesh.updateFrom(this.logicalMesh);


    this.halfEdgeVisualiser.drawEdges();
    this.scene.add(this.light);
    this.scene.add(this.renderMesh.mesh)

    

    window.addEventListener('click', this.onMouseClick);
    window.addEventListener("keydown", (event) => {
      if (event.isComposing || event.keyCode === 69) {
	this.callExtrude();
      }
    });

    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array( [
    	-1.0, -1.0,  1.0, // v0
    	 1.0, -1.0,  1.0, // v1
    	 1.0,  1.0,  1.0, // v2
    	 1.0,  1.0,  1.0, // v3
    	-1.0,  1.0,  1.0, // v4
    	-1.0, -1.0,  1.0  // v5
    ] );
    // itemSize = 3 because there are 3 values (components) per vertex
    geometry.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
    const selectionMaterial = new THREE.MeshStandardMaterial( { color: 0xf5e4a9, opacity: 0.5 } );
    this.faceHighlightObject = new THREE.Mesh( geometry, selectionMaterial );

    this.scene.add(this.faceHighlightObject); 
    this.faceHighlightObject.visible = false;
  }

  private callExtrude(): void{
    if(this.selectedFace != null){
      const normal = new THREE.Vector3();
      this.selectedFace.getNormal(normal);
      normal.normalize();
      
      extrudeFace(this.logicalMesh.struct, this.selectedFace, normal, 2)
      this.renderMesh.updateFrom(this.logicalMesh);
      this.halfEdgeVisualiser.drawEdges();

      this.selectedFace = null;

      this.faceHighlightObject.visible = false;
    }
  }

  private onMouseClick = (event: MouseEvent) => {
    console.log(this.logicalMesh.struct.faces);	
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    this.raycaster.setFromCamera(this.mouse, this.camera);

    if(this.raycaster.intersectObject(this.renderMesh.mesh, true).length > 0){
      this.selectedFace = this.checkHit(this.raycaster.intersectObject(this.renderMesh.mesh, true)[0].point);
      this.faceHighlightObject.visible = true;
      const geometry = new THREE.BufferGeometry();
      let v0 = this.selectedFace.halfedge.vertex.position;
      let v1 = this.selectedFace.halfedge.next.vertex.position;
      let v2 = this.selectedFace.halfedge.next.next.vertex.position;
      let v3 = this.selectedFace.halfedge.vertex.position;
      let v4 = this.selectedFace.halfedge.prev.vertex.position;
      let v5 = this.selectedFace.halfedge.prev.prev.vertex.position;
      console.log(v0);

      const vertices = new Float32Array( [
	 v0.x, v0.y, v0.z,
	 v1.x, v1.y, v1.z,
	 v2.x, v2.y, v2.z,
	 v5.x, v5.y, v5.z,
	 v4.x, v4.y, v4.z,
	 v3.x, v3.y, v3.z,
      ] );

      this.faceHighlightObject.geometry.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
    }
  };

  private checkHit(point: THREE.Vector3): Face | null{

    const epsilon = 1e-6 
    // const point = new THREE.Vector3(0.7609004637915316, -0.3033319416466239, 1.0000000000000004 )

    for(let i = 0; i < this.logicalMesh.struct.faces.length; i++){
      // console.log(this.logicalMesh.struct.faces[i].halfedge.vertex.position);

      let v0: THREE.Vector3 = this.logicalMesh.struct.faces[i].halfedge.vertex.position;
      let v1: THREE.Vector3 = this.logicalMesh.struct.faces[i].halfedge.next.vertex.position;
      let v2: THREE.Vector3 = this.logicalMesh.struct.faces[i].halfedge.next.next.vertex.position;
      let v3: THREE.Vector3 = this.logicalMesh.struct.faces[i].halfedge.next.next.next.vertex.position;

      const a = new THREE.Vector3().subVectors(v1, v0);
      const b = new THREE.Vector3().subVectors(v2, v0);

      const n = new THREE.Vector3().crossVectors(a, b);

      const pMinusV0 = new THREE.Vector3().subVectors(point, v0);

      const d = n.dot(pMinusV0);

      console.log(Math.abs(d) < epsilon);

      // Check on correct play
      if(Math.abs(d) < epsilon){

	
	if(this.pointInQuad(point, v0, v1, v2, v3)){
	  return this.logicalMesh.struct.faces[i]
	}
      }
    }


    return
  }

    
  private init(): void {
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    document.getElementById('app')?.appendChild(this.renderer.domElement)

    this.camera.position.z = 5
  }

  private animate(): void {
    requestAnimationFrame(this.animate.bind(this))
    this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }

  private pointInTriangle(p: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3): boolean {
      // Compute vectors
      const v0 = new THREE.Vector3().subVectors(b, a);
      const v1 = new THREE.Vector3().subVectors(c, a);
      const v2 = new THREE.Vector3().subVectors(p, a);
  
      // Compute dot products
      const d00 = v0.dot(v0);
      const d01 = v0.dot(v1);
      const d11 = v1.dot(v1);
      const d20 = v2.dot(v0);
      const d21 = v2.dot(v1);
  
      // Compute barycentric coordinates
      const denom = d00 * d11 - d01 * d01;
      if (Math.abs(denom) < 1e-6) return false; 
  
      const v = (d11 * d20 - d01 * d21) / denom;
      const w = (d00 * d21 - d01 * d20) / denom;
      const u = 1.0 - v - w;
  
      // Inside if all barycentric coords >= 0
      return (u >= 0) && (v >= 0) && (w >= 0);
  }
  private pointInQuad(
      p: THREE.Vector3,
      v0: THREE.Vector3,
      v1: THREE.Vector3,
      v2: THREE.Vector3,
      v3: THREE.Vector3
  ): boolean {
      return this.pointInTriangle(p, v0, v1, v2) || this.pointInTriangle(p, v0, v2, v3);
  }
}

new ThreeJSApp()
