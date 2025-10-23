/*
 * Insets a face by moving its edges inward toward the center by a given distance.
 * The original face is replaced with a smaller inset face and connecting side faces.
 * 
 * @param struct - The halfedge data structure
 * @param face - The face to inset
 * @param distance - The inset distance (how far to move edges toward center)
 * @param tolerance - Tolerance for vertex position comparison
 * @returns Object containing the new inset face and side faces created by the inset
 */

import { Vector3 } from 'three';
import { HalfedgeDS, Vertex, Halfedge, Face } from 'three-mesh-halfedge'

export interface InsetResult {
    insetFace: Face;
    sideFaces: Face[];
    newVertices: Vertex[];
}

export function insetFace(
    struct: HalfedgeDS,
    face: Face,
    distance: number,
    tolerance = 1e-10
): InsetResult {

    if (!face.halfedge) {
        throw new Error('Face has no halfedge reference');
    }

    // Collect all vertices of the face in order
    const originalVertices: Vertex[] = [];
    const originalHalfedges: Halfedge[] = [];

    for (const he of face.halfedge.nextLoop()) {
        originalVertices.push(he.vertex);
        originalHalfedges.push(he);
    }

    const n = originalVertices.length;

    // Calculate the centroid of the face
    const centroid = new Vector3();
    for (const vertex of originalVertices) {
        centroid.add(vertex.position);
    }
    centroid.divideScalar(n);

    // Create new vertices at inset positions
    // Each vertex moves toward the centroid by the inset distance
    const newVertices: Vertex[] = [];

    for (const vertex of originalVertices) {
        // Direction from vertex to centroid
        const toCenter = new Vector3().subVectors(centroid, vertex.position);
        const dirLength = toCenter.length();

        if (dirLength < tolerance) {
            throw new Error('Vertex is too close to face centroid, cannot inset');
        }

        if (distance >= dirLength) {
            throw new Error('Inset distance is too large, would collapse the face');
        }

        // Normalise and scale by inset distance
        toCenter.normalize().multiplyScalar(distance);

        // New position is original position + offset toward center
        const newPos = vertex.position.clone().add(toCenter);
        const newVertex = struct.addVertex(newPos, false, tolerance);
        newVertices.push(newVertex);
    }

    // Create the inset face (center face)
    const insetHalfedges: Halfedge[] = [];

    for (let i = 0; i < n; i++) {
        const v1 = newVertices[i];
        const v2 = newVertices[(i + 1) % n];

        // Create halfedge from v1 to v2
        const he = new Halfedge(v1);
        const heTwin = new Halfedge(v2);

        he.twin = heTwin;
        heTwin.twin = he;

        insetHalfedges.push(he);

        struct.halfedges.push(he);
        struct.halfedges.push(heTwin);

        // Update vertex reference if needed
        if (!v1.halfedge) {
            v1.halfedge = he;
        }
    }

    // Connect the inset halfedges in a loop
    for (let i = 0; i < n; i++) {
        insetHalfedges[i].next = insetHalfedges[(i + 1) % n];
        insetHalfedges[i].prev = insetHalfedges[(i - 1 + n) % n];
    }

    // Create the inset face
    const insetFace = new Face(insetHalfedges[0]);
    struct.faces.push(insetFace);

    for (const he of insetHalfedges) {
        he.face = insetFace;
    }

    // Create side faces connecting original vertices to new inset vertices
    const sideFaces: Face[] = [];

    for (let i = 0; i < n; i++) {
        const v0 = originalVertices[i];
        const v1 = originalVertices[(i + 1) % n];
        const v2 = newVertices[(i + 1) % n];
        const v3 = newVertices[i];

        // Create a quad face: v0 -> v1 -> v2 -> v3 -> v0

        // Halfedge from v0 to v1 (this is the original boundary edge)
        const he01 = originalHalfedges[i];

        // Halfedge from v1 to v2 (connecting edge)
        const he12 = new Halfedge(v1);
        const he12Twin = new Halfedge(v2);
        he12.twin = he12Twin;
        he12Twin.twin = he12;

        // Halfedge from v2 to v3 (inset edge twin)
        const he23 = insetHalfedges[i].twin;

        // Halfedge from v3 to v0 (connecting edge)
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
        insetFace,
        sideFaces,
        newVertices
    };
}