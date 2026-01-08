import * as THREE from 'three'
import { HalfedgeDS, Face } from 'three-mesh-halfedge'
import { parseOBJToHalfedge, extrudeFace, Wrapper, LogicalMesh, RenderMesh } from 'three-mesh-edit';
import { Demo } from './Demo';
import { cuboid } from './models' 
import { checkHit, convertFaceToPlane, HalfEdgeVisualiser} from './utils'

/**
 * A face extrusion demo base class
 */

class FaceExtrusionDemo extends Demo{
  wrapper: Wrapper;
  raycaster: THREE.Raycaster = new THREE.Raycaster();
  mouse: THREE.Vector2 = new THREE.Vector2();
  selectedFace: Face | None;
  faceHighlightObject: THREE.Mesh;

  constructor() {
    super();

    const heds = new HalfedgeDS();
    parseOBJToHalfedge(heds, cuboid)

    this.wrapper = {
      logical: new LogicalMesh(heds),
      render: new RenderMesh(new THREE.MeshStandardMaterial({ color: 0x808080}))
    };

    this.wrapper.render.updateFrom(this.wrapper.logical);

    this.halfEdgeVisualiser = new HalfEdgeVisualiser(this.scene, this.wrapper.logical.struct);
    this.halfEdgeVisualiser.drawEdges();

    this.faceHighlightObject = new THREE.Mesh( 
      new THREE.BufferGeometry(), 
      new THREE.MeshStandardMaterial( { color: 0xf5e4a9, opacity: 0.5 } )
    );

    this.scene.add(this.faceHighlightObject); 
    this.scene.add(this.wrapper.render.mesh)

    this.faceHighlightObject.visible = false;

    this.init()
    this.animate()

    window.addEventListener('click', this.onMouseClick);
    window.addEventListener("keydown", (event) => {
      if (event.isComposing || event.keyCode === 69) {
	this.onPressE();
      }
    });
  }

  onPressE(): void{
    if(this.selectedFace != null){
      const normal = new THREE.Vector3();
      this.selectedFace.getNormal(normal);
      normal.normalize();
      
      extrudeFace(this.wrapper.logical.struct, this.selectedFace, normal, 2)
      this.wrapper.render.updateFrom(this.wrapper.logical);
      this.halfEdgeVisualiser.drawEdges();

      this.selectedFace = null;

      this.faceHighlightObject.visible = false;
    }
  }

  onMouseClick = (event: MouseEvent) => {
    const rect = this.renderer.domElement.getBoundingClientRect();

    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    this.raycaster.setFromCamera(this.mouse, this.camera);

    if(this.raycaster.intersectObject(this.wrapper.render.mesh, true).length > 0){
      this.selectedFace = checkHit(this.raycaster.intersectObject(this.wrapper.render.mesh, true)[0].point, this.wrapper.logical.struct.faces);
      this.faceHighlightObject.visible = true;
      
      const planeVertices = convertFaceToPlane(this.selectedFace);

      this.faceHighlightObject.geometry.setAttribute( 'position', new THREE.BufferAttribute( planeVertices, 3 ) );
    }
  };
}

new FaceExtrusionDemo()
