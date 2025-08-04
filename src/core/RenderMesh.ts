import * as THREE from 'three';
import { LogicalMesh } from './LogicalMesh';
import { HalfedgeDS, Face, Vertex } from 'three-mesh-halfedge';
import Queries from '../services/Queries';

export class RenderMesh {
    public mesh: THREE.Mesh;
    private posAttrName = 'position';
    constructor(material: THREE.MeshStandardMaterial) {
        const geom = new THREE.BufferGeometry();
        geom.setAttribute(this.posAttrName, new THREE.BufferAttribute(new Float32Array(), 3));
        this.mesh = new THREE.Mesh(geom, material);
    }

    updateFrom(logical: LogicalMesh) {
        // Extract positions and indices from the halfedge structure
        const positions = Queries.extractPositions(logical.struct);
        const indices = Queries.extractIndices(logical.struct);
        
        // Update the existing geometry
        const geom = this.mesh.geometry as THREE.BufferGeometry;
        geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geom.setIndex(indices);
        geom.computeVertexNormals();
        
        // Flag updates
        (geom.attributes.position as any).needsUpdate = true;
    }
}
