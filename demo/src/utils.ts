import * as THREE from 'three';
import { HalfedgeDS, Face } from 'three-mesh-halfedge';
import { Queries } from 'three-mesh-edit';

export function getRaycastHit(renderer: THREE.Renderer, camera: THREE.Camera, raycaster: THREE.Raycaster, mouse: THREE.Vector2, event: MouseEvent, obj: THREE.Object3D): THREE.Intersection | null{
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(obj, true);

        return intersects.length > 0 ? intersects[0] : null;
}

/**
 * Converts half-edge face to plane, returns planes vertex positions.
 *
 * @param {Face} face - The face to convert to a plane.
 * @return {Float32Array} The plane's vertex positions
 */

export function convertFaceToPlane(face: Face): Float32Array {
  const v0 = face.halfedge.vertex.position;
  const v1 = face.halfedge.next.vertex.position;
  const v2 = face.halfedge.next.next.vertex.position;
  const v3 = face.halfedge.vertex.position;
  const v4 = face.halfedge.prev.vertex.position;
  const v5 = face.halfedge.prev.prev.vertex.position;

  return new Float32Array([
     v0.x, v0.y, v0.z,
     v1.x, v1.y, v1.z,
     v2.x, v2.y, v2.z,
     v5.x, v5.y, v5.z,
     v4.x, v4.y, v4.z,
     v3.x, v3.y, v3.z,
  ]);
}

/**
 * Checks HEDS faces based on a Vector3 point and returns given face if point is on same plane and between vertices.
 *
 * @param {THREE.Vector3} point - The hit point.
 * @param {Face[]} faces - Array of faces to check.
 * @return {Face} The hit face.
 */

export function checkHit(point: THREE.Vector3, faces: Face[]): Face | null{
  const queries: Queries = new Queries();

  const epsilon = 1e-6 

  for(let i = 0; i < faces.length; i++){
    const v0: THREE.Vector3 = faces[i].halfedge.vertex.position;
    const v1: THREE.Vector3 = faces[i].halfedge.next.vertex.position;
    const v2: THREE.Vector3 = faces[i].halfedge.next.next.vertex.position;
    const v3: THREE.Vector3 = faces[i].halfedge.next.next.next.vertex.position;

    const a = new THREE.Vector3().subVectors(v1, v0);
    const b = new THREE.Vector3().subVectors(v2, v0);

    const n = new THREE.Vector3().crossVectors(a, b);

    const pMinusV0 = new THREE.Vector3().subVectors(point, v0);

    const d = n.dot(pMinusV0);

    if(Math.abs(d) < epsilon){
      if(queries.pointInQuad(point, v0, v1, v2, v3)){
        return faces[i]
      }
    }
  }

  return null;
}

export class HalfEdgeVisualiser {
  private scene: THREE.Scene;
  private hes: HalfedgeDS;
  private vertexMeshes: THREE.Mesh[] = [];
  private edgeLines: THREE.LineSegments | null = null;

  constructor(scene: THREE.Scene, halfEdgeStructure: HalfedgeDS) {
    this.scene = scene;
    this.hes = halfEdgeStructure;
  }

  public visualise(): void {
    this.drawVertices();
    this.drawEdges();
  }

  private drawVertices(): void {
    const geometry = new THREE.SphereGeometry(0.05);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });

    for (const vertex of this.hes.vertices) {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(vertex.position);
      this.scene.add(mesh);
      this.vertexMeshes.push(mesh);
    }
  }

  private drawEdges(): void {
    const points: THREE.Vector3[] = [];
    for (const he of this.hes.halfedges) {
      if (he.twin && he.id < he.twin.id) { // Draw each edge once
        points.push(he.vertex.position, he.twin.vertex.position);
      }
    }

    if (points.length > 0) {
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ color: 0x66ff66});
      this.edgeLines = new THREE.LineSegments(geometry, material);
      this.scene.add(this.edgeLines);
    }
  }
}
