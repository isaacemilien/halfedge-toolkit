import * as THREE from 'three';

export function getRaycastHit(renderer: THREE.Renderer, camera: THREE.Camera, raycaster: THREE.Raycaster, mouse: THREE.Vector2, event: MouseEvent, obj: THREE.Object3D): THREE.Intersection | null{
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(obj, true);

        return intersects.length > 0 ? intersects[0] : null;
}

