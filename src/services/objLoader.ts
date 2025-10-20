/*
 * OBJ to HalfedgeDS converter
 * Converts OBJ text content to half-edge data structure
 * while preserving n-gons (polygons with more than 3 vertices)
 */

import { Vector3 } from "three";
import { HalfedgeDS, Vertex, Halfedge } from 'three-mesh-halfedge'


const pos_ = new Vector3();

/**
 * Parses OBJ text content and converts it to a half-edge data structure
 * while preserving n-gons
 * 
 * @param struct The HalfedgeDS structure to populate
 * @param objText The OBJ file content as text
 * @param tolerance Distance tolerance for merging vertices (default: 1e-10)
 */
export function parseOBJToHalfedge(
    struct: HalfedgeDS,
    objText: string,
    tolerance = 1e-10
): void {

    struct.clear();

    // Arrays to store parsed data
    const positions: number[] = [];
    const faces: number[][] = [];

    // Parse the OBJ file line by line
    const lines = objText.split('\n');

    for (const line of lines) {
        const trimmed = line.trim();

        // Skip empty lines and comments
        if (!trimmed || trimmed.startsWith('#')) {
            continue;
        }

        const parts = trimmed.split(/\s+/);
        const type = parts[0];

        // Parse vertex positions
        if (type === 'v') {
            const x = parseFloat(parts[1]);
            const y = parseFloat(parts[2]);
            const z = parseFloat(parts[3]);
            positions.push(x, y, z);
        }
        // Parse faces (can be triangles, quads, or n-gons)
        else if (type === 'f') {
            const faceIndices: number[] = [];

            for (let i = 1; i < parts.length; i++) {
                // OBJ face format can be: v, v/vt, v/vt/vn, or v//vn
                // We only care about the vertex index (first number)
                const vertexData = parts[i].split('/');
                const vertexIndex = parseInt(vertexData[0]);

                // OBJ indices are 1-based, convert to 0-based
                // Also handle negative indices (relative to end of vertex list)
                const index = vertexIndex > 0
                    ? vertexIndex - 1
                    : (positions.length / 3) + vertexIndex;

                faceIndices.push(index);
            }

            if (faceIndices.length >= 3) {
                faces.push(faceIndices);
            }
        }
    }

    // Compute merged vertices index array
    const indexVertexArray = computeVerticesIndexArrayFromPositions(
        positions,
        tolerance
    );

    // Build the half-edge data structure
    const halfedgeMap = new Map<string, Halfedge>();
    const vertexMap = new Map<number, Vertex>();

    for (const faceIndices of faces) {
        const loopHalfedges: Halfedge[] = [];

        for (let i = 0; i < faceIndices.length; i++) {
            const bufferIndex1 = faceIndices[i];
            const bufferIndex2 = faceIndices[(i + 1) % faceIndices.length];

            // Get the merged vertex indices
            const i1 = indexVertexArray[bufferIndex1];
            const i2 = indexVertexArray[bufferIndex2];

            // Get or create vertex v1
            let v1 = vertexMap.get(i1);
            if (!v1) {
                pos_.set(
                    positions[i1 * 3],
                    positions[i1 * 3 + 1],
                    positions[i1 * 3 + 2]
                );
                v1 = struct.addVertex(pos_);
                vertexMap.set(i1, v1);
            }

            // Get or create vertex v2
            let v2 = vertexMap.get(i2);
            if (!v2) {
                pos_.set(
                    positions[i2 * 3],
                    positions[i2 * 3 + 1],
                    positions[i2 * 3 + 2]
                );
                v2 = struct.addVertex(pos_);
                vertexMap.set(i2, v2);
            }

            // Get or create halfedge from v1 to v2
            const hash1 = i1 + '-' + i2;
            let h1 = halfedgeMap.get(hash1);

            if (!h1) {
                h1 = struct.addEdge(v1, v2);
                const h2 = h1.twin;
                const hash2 = i2 + '-' + i1;
                halfedgeMap.set(hash1, h1);
                halfedgeMap.set(hash2, h2);
            }

            loopHalfedges.push(h1);
        }

        // Add the face with all its halfedges (supports n-gons)
        struct.addFace(loopHalfedges);
    }
}

/**
 * Computes vertex index array for merging duplicate vertices
 * 
 * @param positions Flat array of vertex positions [x1, y1, z1, x2, y2, z2, ...]
 * @param tolerance Distance tolerance for merging vertices
 * @returns Array mapping original indices to merged indices
 */
function computeVerticesIndexArrayFromPositions(
    positions: number[],
    tolerance = 1e-10
): number[] {

    const decimalShift = Math.log10(1 / tolerance);
    const shiftMultiplier = Math.pow(10, decimalShift);

    const hashMap = new Map<string, number>();
    const indexArray: number[] = [];

    const vertexCount = positions.length / 3;

    for (let i = 0; i < vertexCount; i++) {
        // Compute a hash based on the vertex position rounded to a given precision
        let hash = "";
        for (let j = 0; j < 3; j++) {
            hash += `${Math.round(positions[i * 3 + j] * shiftMultiplier)}_`;
        }

        // If hash already exists, use the existing vertex index
        // Otherwise, create a new vertex
        let vertexIndex = hashMap.get(hash);
        if (vertexIndex === undefined) {
            vertexIndex = i;
            hashMap.set(hash, i);
        }
        indexArray.push(vertexIndex);
    }

    return indexArray;
}