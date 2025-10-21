/*
 * Extrudes a face along a direction vector by a given distance.
 * The original face is removed and replaced with new geometry.
 * 
 * @param struct - The halfedge data structure
 * @param face - The face to extrude
 * @param direction - The direction vector for extrusion (will be normalized)
 * @param distance - The extrusion distance
 * @param tolerance - Tolerance for vertex position comparison
 * @returns Object containing the new top face and side faces created by the extrusion
 */

import { Vector3 } from 'three';
import { HalfedgeDS, Vertex, Halfedge, Face } from 'three-mesh-halfedge'


export interface ExtrusionResult {
    topFace: Face;
    sideFaces: Face[];
    newVertices: Vertex[];
}

export function extrudeFace(
    struct: HalfedgeDS,
    face: Face,
    direction: Vector3,
    distance: number,
    tolerance = 1e-10
): ExtrusionResult {

    if (!face.halfedge) {
        throw new Error('Face has no halfedge reference');
    }

    // Normalise the direction vector
    const extrudeDir = direction.clone().normalize();
    const offset = extrudeDir.multiplyScalar(distance);

    // Collect all vertices of the face in order
    const originalVertices: Vertex[] = [];
    const originalHalfedges: Halfedge[] = [];

    for (const he of face.halfedge.nextLoop()) {
        originalVertices.push(he.vertex);
        originalHalfedges.push(he);
    }

    const n = originalVertices.length;

    // Create new vertices at extruded positions
    const newVertices: Vertex[] = [];
    for (const vertex of originalVertices) {
        const newPos = vertex.position.clone().add(offset);
        const newVertex = struct.addVertex(newPos, false, tolerance);
        newVertices.push(newVertex);
    }

    // Create the top face
    const topHalfedges: Halfedge[] = [];

    for (let i = 0; i < n; i++) {
        const v1 = newVertices[i];
        const v2 = newVertices[(i + 1) % n];

        // Create halfedge from v1 to v2
        const he = new Halfedge(v1);
        const heTwin = new Halfedge(v2);

        he.twin = heTwin;
        heTwin.twin = he;

        topHalfedges.push(he);

        struct.halfedges.push(he);
        struct.halfedges.push(heTwin);

        // Update vertex reference if needed
        if (!v1.halfedge) {
            v1.halfedge = he;
        }
    }

    // Connect the top halfedges in a loop
    for (let i = 0; i < n; i++) {
        topHalfedges[i].next = topHalfedges[(i + 1) % n];
        topHalfedges[i].prev = topHalfedges[(i - 1 + n) % n];
    }

    // Create the top face
    const topFace = new Face(topHalfedges[0]);
    struct.faces.push(topFace);

    for (const he of topHalfedges) {
        he.face = topFace;
    }

    // Create side faces connecting original vertices to new vertices
    const sideFaces: Face[] = [];

    for (let i = 0; i < n; i++) {
        const v0 = originalVertices[i];
        const v1 = originalVertices[(i + 1) % n];
        const v2 = newVertices[(i + 1) % n];
        const v3 = newVertices[i];

        // Create a quad face: v0 -> v1 -> v2 -> v3 -> v0

        // Halfedge from v0 to v1
        const he01 = originalHalfedges[i];

        // Halfedge from v1 to v2 
        const he12 = new Halfedge(v1);
        const he12Twin = new Halfedge(v2);
        he12.twin = he12Twin;
        he12Twin.twin = he12;

        // Halfedge from v2 to v3
        const he23 = topHalfedges[i].twin;

        // Halfedge from v3 to v0
        const he30 = new Halfedge(v3);
        const he30Twin = new Halfedge(v0);
        he30.twin = he30Twin;
        he30Twin.twin = he30;

        // Connect the side face loop
        he01.next = he12;
        he12.next = he23;
        he23.next = he30;
        he30.next = he01;

        he01.prev = he30;
        he12.prev = he01;
        he23.prev = he12;
        he30.prev = he23;

        // Create the side face
        const sideFace = new Face(he01);
        sideFaces.push(sideFace);
        struct.faces.push(sideFace);

        he01.face = sideFace;
        he12.face = sideFace;
        he23.face = sideFace;
        he30.face = sideFace;

        // Add new halfedges to structure
        struct.halfedges.push(he12);
        struct.halfedges.push(he12Twin);
        struct.halfedges.push(he30);
        struct.halfedges.push(he30Twin);

        // Update vertex references
        if (!v1.halfedge || v1.halfedge === he01) {
            v1.halfedge = he12;
        }
        if (!v3.halfedge) {
            v3.halfedge = he30;
        }
    }

    // Remove the original face
    struct.removeFace(face);

    return {
        topFace,
        sideFaces,
        newVertices
    };
}