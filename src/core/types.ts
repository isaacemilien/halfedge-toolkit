import * as THREE from 'three';
import { HalfedgeDS, Vertex, Halfedge, Face} from 'three-mesh-halfedge';
import { RenderMesh } from './RenderMesh';
import { LogicalMesh } from './LogicalMesh';

/**
 * Interface representing a wrapper for a mesh with its half-edge structure
 */
export interface Wrapper{
    logical: LogicalMesh
    render: RenderMesh
    pivot?: THREE.Object3D
}

export type SelectionMode = 'OBJECT' | 'VERTEX' | 'EDGE' | 'FACE';

export interface PickResult {
    pickedObject: THREE.Object3D;
    pickedElement: Vertex | Halfedge | Face | null;
    pivotPosition: THREE.Vector3 | null;
    wrapper: Wrapper;
}
 