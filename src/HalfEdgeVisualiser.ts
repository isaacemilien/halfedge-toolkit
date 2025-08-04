import * as THREE from 'three';
import { Halfedge } from "three-mesh-halfedge"
import { HalfedgeDS } from "three-mesh-halfedge"
import { Vertex } from "three-mesh-halfedge"

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
      const material = new THREE.LineBasicMaterial({ color: 0x0000ff });
      this.edgeLines = new THREE.LineSegments(geometry, material);
      this.scene.add(this.edgeLines);
    }
  }
}