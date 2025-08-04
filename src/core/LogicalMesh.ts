import * as THREE from 'three';
import { HalfedgeDS, Face, Vertex, Halfedge } from 'three-mesh-halfedge';

export class LogicalMesh {
    public struct: HalfedgeDS;
    constructor(struct: HalfedgeDS) { this.struct = struct; }

    /**
     * Creates a cube logical mesh with the specified size
     * 
     * @param size The size of the cube (default: 1.0)
     * @returns A new LogicalMesh representing a cube
     */
    static createCube(size: number = 1.0): LogicalMesh {
        const struct = new HalfedgeDS();
        const halfSize = size / 2;

        // Create the 8 vertices of the cube
        const v000 = struct.addVertex(new THREE.Vector3(-halfSize, -halfSize, -halfSize));
        const v100 = struct.addVertex(new THREE.Vector3(halfSize, -halfSize, -halfSize));
        const v110 = struct.addVertex(new THREE.Vector3(halfSize, halfSize, -halfSize));
        const v010 = struct.addVertex(new THREE.Vector3(-halfSize, halfSize, -halfSize));
        const v001 = struct.addVertex(new THREE.Vector3(-halfSize, -halfSize, halfSize));
        const v101 = struct.addVertex(new THREE.Vector3(halfSize, -halfSize, halfSize));
        const v111 = struct.addVertex(new THREE.Vector3(halfSize, halfSize, halfSize));
        const v011 = struct.addVertex(new THREE.Vector3(-halfSize, halfSize, halfSize));

        // Create edges for each face, we'll handle them one face at a time

        // Bottom face (y = -halfSize)
        const bottomHE1 = struct.addEdge(v000, v100);
        const bottomHE2 = struct.addEdge(v100, v101);
        const bottomHE3 = struct.addEdge(v101, v001);
        const bottomHE4 = struct.addEdge(v001, v000);
        struct.addFace([bottomHE1, bottomHE2, bottomHE3, bottomHE4]);

        // Front face (z = halfSize)
        const frontHE1 = struct.addEdge(v001, v101);
        const frontHE2 = struct.addEdge(v101, v111);
        const frontHE3 = struct.addEdge(v111, v011);
        const frontHE4 = struct.addEdge(v011, v001);
        struct.addFace([frontHE1, frontHE2, frontHE3, frontHE4]);

        // Right face (x = halfSize)
        const rightHE1 = struct.addEdge(v100, v110);
        const rightHE2 = struct.addEdge(v110, v111);
        const rightHE3 = struct.addEdge(v111, v101);
        const rightHE4 = struct.addEdge(v101, v100);
        struct.addFace([rightHE1, rightHE2, rightHE3, rightHE4]);

        // Back face (z = -halfSize)
        const backHE1 = struct.addEdge(v000, v010);
        const backHE2 = struct.addEdge(v010, v110);
        const backHE3 = struct.addEdge(v110, v100);
        const backHE4 = struct.addEdge(v100, v000);
        struct.addFace([backHE1, backHE2, backHE3, backHE4]);

        // Left face (x = -halfSize)
        const leftHE1 = struct.addEdge(v000, v001);
        const leftHE2 = struct.addEdge(v001, v011);
        const leftHE3 = struct.addEdge(v011, v010);
        const leftHE4 = struct.addEdge(v010, v000);
        struct.addFace([leftHE1, leftHE2, leftHE3, leftHE4]);

        // Top face (y = halfSize)
        const topHE1 = struct.addEdge(v010, v011);
        const topHE2 = struct.addEdge(v011, v111);
        const topHE3 = struct.addEdge(v111, v110);
        const topHE4 = struct.addEdge(v110, v010);
        struct.addFace([topHE1, topHE2, topHE3, topHE4]);

        return new LogicalMesh(struct);
    }
}