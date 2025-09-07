import * as THREE from 'three';
import { HalfedgeDS, Face, Vertex } from 'three-mesh-halfedge';

class Queries {
    /**
     * Collects the ordered vertices around a face by traversing its half-edges.
     */
    getFaceVertices(face: Face): Vertex[] {
        const vertices: Vertex[] = [];
        const start = face.halfedge;
        let edge = start;

        do {
            vertices.push(edge.vertex);
            edge = edge.next;
        } while (edge !== start);

        return vertices;
    }

    /**
     * Converts a HalfedgeDS structure into a THREE.BufferGeometry.
     */
    halfedgeToGeometry(struct: HalfedgeDS): THREE.BufferGeometry {
        const positions: number[] = [];
        const indices: number[] = [];

        // Map vertices to indices and collect positions
        const vertexMap = new Map<Vertex, number>();
        let index = 0;

        for (const vertex of struct.vertices) {
            vertexMap.set(vertex, index++);
            const v = vertex.position;
            positions.push(v.x, v.y, v.z);
        }

        // Triangulate each face using fan triangulation
        for (const face of struct.faces) {
            const verts = this.getFaceVertices(face);
            if (verts.length < 3) continue;

            const a = vertexMap.get(verts[0]);
            for (let i = 1; i < verts.length - 1; i++) {
                const b = vertexMap.get(verts[i]);
                const c = vertexMap.get(verts[i + 1]);

                if (a !== undefined && b !== undefined && c !== undefined) {
                    indices.push(a, b, c);
                }
            }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();

        return geometry;
    }


    extractPositions(struct: HalfedgeDS): Float32Array {
        const positions = new Float32Array(struct.vertices.length * 3);

        struct.vertices.forEach((vertex, index) => {
            positions[index * 3] = vertex.position.x;
            positions[index * 3 + 1] = vertex.position.y;
            positions[index * 3 + 2] = vertex.position.z;
        });

        return positions;
    }

    extractIndices(struct: HalfedgeDS): number[] {
        const indices: number[] = [];

        struct.faces.forEach(face => {
            // Get the first halfedge of the face
            const halfedge = face.halfedge;

            // For triangular faces, we can simply extract the three vertices
            const vertexIndices: number[] = [];

            // Iterate through the halfedges of the face
            for (const he of halfedge.nextLoop()) {
                // Get the vertex index
                const vertexIndex = struct.vertices.indexOf(he.vertex);
                vertexIndices.push(vertexIndex);
            }

            // Add triangular face indices
            if (vertexIndices.length >= 3) {
                indices.push(vertexIndices[0], vertexIndices[1], vertexIndices[2]);

                // For faces with more than 3 vertices, triangulate
                for (let i = 3; i < vertexIndices.length; i++) {
                    indices.push(vertexIndices[0], vertexIndices[i - 1], vertexIndices[i]);
                }
            }
        });

        return indices;
    }

}

export default new Queries();