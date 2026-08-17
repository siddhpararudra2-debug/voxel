/** Orbital Field Manual reminder: movement transitions should feel like real equipment modes—grounded, then deliberately free in EVA. */
import * as CANNON from "cannon-es";
import * as THREE from "three";

export type MovementInput = Record<"forward" | "back" | "left" | "right" | "ascend" | "descend" | "jump" | "rollLeft" | "rollRight" | "pitchUp" | "pitchDown", boolean>;

export class PlayerController {
  readonly body: CANNON.Body;
  zeroG = false;
  private jumpArmed = false;

  constructor(world: CANNON.World) {
    this.body = new CANNON.Body({ mass: 72, position: new CANNON.Vec3(-4, 9, 8), linearDamping: 0.22 });
    const radius = 0.45;
    const cylinder = new CANNON.Cylinder(radius, radius, 0.9, 8);
    this.body.addShape(cylinder, new CANNON.Vec3(), new CANNON.Quaternion().setFromEuler(Math.PI / 2, 0, 0));
    this.body.addShape(new CANNON.Sphere(radius), new CANNON.Vec3(0, 0.45, 0));
    this.body.addShape(new CANNON.Sphere(radius), new CANNON.Vec3(0, -0.45, 0));
    world.addBody(this.body);
  }

  update(input: MovementInput, camera: THREE.PerspectiveCamera, delta: number) {
    this.zeroG = this.body.position.y > 12;
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
    const direction = new THREE.Vector3();
    if (input.forward) direction.add(forward);
    if (input.back) direction.sub(forward);
    if (input.right) direction.add(right);
    if (input.left) direction.sub(right);
    if (direction.lengthSq() > 0) direction.normalize();

    if (this.zeroG) {
      const thruster = 11;
      this.body.velocity.x += direction.x * thruster * delta;
      this.body.velocity.z += direction.z * thruster * delta;
      if (input.ascend) this.body.velocity.y += thruster * delta;
      if (input.descend) this.body.velocity.y -= thruster * delta;
      this.body.velocity.scale(0.995, this.body.velocity);
      return;
    }

    const walkingSpeed = 5.2;
    this.body.velocity.x = direction.x * walkingSpeed;
    this.body.velocity.z = direction.z * walkingSpeed;
    if (input.jump && !this.jumpArmed && this.body.position.y < 8.3) this.body.velocity.y = 6.8;
    this.jumpArmed = input.jump;
    if (!input.jump) this.jumpArmed = false;
  }

  syncCamera(camera: THREE.PerspectiveCamera) {
    camera.position.set(this.body.position.x, this.body.position.y + 1.45, this.body.position.z);
  }
}
