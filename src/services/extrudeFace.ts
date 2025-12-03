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
import { HalfedgeDS, Vertex, Halfedge, Face } from 'three-mesh-halfedge';

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

    // Collect all vertices and boundary halfedges of the face in order
    const originalVertices: Vertex[] = [];
    const originalHalfedges: Halfedge[] = [];
    for (const he of face.halfedge.nextLoop()) {
        originalVertices.push(he.vertex);
        originalHalfedges.push(he);
    }

    const n = originalVertices.length;
    if (n < 3) {
        throw new Error('Cannot extrude a face with fewer than 3 vertices');
    }

    // Create new vertices, top ring and vertical half-edges

    const newVertices: Vertex[] = [];
    for (const vertex of originalVertices) {
        const newPos = vertex.position.clone().add(offset);
        const newVertex = struct.addVertex(newPos, false, tolerance);
        newVertices.push(newVertex);
    }

    const topHalfedges: Halfedge[] = [];
    const topHalfedgesTwin: Halfedge[] = [];

    for (let i = 0; i < n; i++) {
        const v1 = newVertices[i];
        const v2 = newVertices[(i + 1) % n];

        const he = new Halfedge(v1);  // v1 -> v2
        const heTwin = new Halfedge(v2); // v2 -> v1

        he.twin = heTwin;
        heTwin.twin = he;

        topHalfedges.push(he);
        topHalfedgesTwin.push(heTwin);

        struct.halfedges.push(he, heTwin);

        if (!v1.halfedge) {
            v1.halfedge = he;
        }
    }

    const verticalUp: Halfedge[] = [];    
    const verticalDown: Halfedge[] = []; 

    for (let i = 0; i < n; i++) {
        const vBottom = originalVertices[i];
        const vTop = newVertices[i];

        const heUp = new Halfedge(vBottom); 
        const heDown = new Halfedge(vTop); 

        heUp.twin = heDown;
        heDown.twin = heUp;

        verticalUp.push(heUp);
        verticalDown.push(heDown);

        struct.halfedges.push(heUp, heDown);

        if (!vTop.halfedge) {
            vTop.halfedge = heDown;
        }
        // Update bottom vertex reference free 
        if (!vBottom.halfedge) {
            vBottom.halfedge = heUp;
        }
    }

    // Wire new top face
    // Connect top halfedges loop
    for (let i = 0; i < n; i++) {
        const he = topHalfedges[i];
        const heNext = topHalfedges[(i + 1) % n];
        const hePrev = topHalfedges[(i - 1 + n) % n];

        he.next = heNext;
        he.prev = hePrev;
    }

    // Create the top face
    const topFace = new Face(topHalfedges[0]);
    struct.faces.push(topFace);

    for (const he of topHalfedges) {
        he.face = topFace;
    }

    // Create side faces using existing half-edges
    const sideFaces: Face[] = [];

    for (let i = 0; i < n; i++) {

        const v0 = originalVertices[i];
        const v1 = originalVertices[(i + 1) % n];
        const v2 = newVertices[(i + 1) % n];
        const v3 = newVertices[i];

        const heBottom = originalHalfedges[i];       // v0 -> v1
        const heRight = verticalUp[(i + 1) % n];     // v1 -> v2
        const heTop = topHalfedgesTwin[i];           // v2 -> v3
        const heLeft = verticalDown[i];              // v3 -> v0

        heBottom.next = heRight;
        heRight.next = heTop;
        heTop.next = heLeft;
        heLeft.next = heBottom;

        heBottom.prev = heLeft;
        heRight.prev = heBottom;
        heTop.prev = heRight;
        heLeft.prev = heTop;

        // Create the side face
        const sideFace = new Face(heBottom);
        sideFaces.push(sideFace);
        struct.faces.push(sideFace);

        heBottom.face = sideFace;
        heRight.face = sideFace;
        heTop.face = sideFace;
        heLeft.face = sideFace;

        // Refresh vertex .halfedge pointers 
        if (!v1.halfedge) {
            v1.halfedge = heRight;
        }
        if (!v3.halfedge) {
            v3.halfedge = heLeft;
        }
    }

    // Remove original face

    struct.removeFace(face);

    return {
        topFace,
        sideFaces,
        newVertices,
    };
}
