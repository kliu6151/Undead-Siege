import Vec2 from "../../../Wolfie2D/DataTypes/Vec2";
import Input from "../../../Wolfie2D/Input/Input";
import Particle from "../../../Wolfie2D/Nodes/Graphics/Particle";
import ParticleSystem from "../../../Wolfie2D/Rendering/Animations/ParticleSystem";
import Color from "../../../Wolfie2D/Utils/Color";
import { EaseFunctionType } from "../../../Wolfie2D/Utils/EaseFunctions";
import RandUtils from "../../../Wolfie2D/Utils/RandUtils";
import Scene from "../../../Wolfie2D/Scene/Scene";
import { GraphicType } from "../../../Wolfie2D/Nodes/Graphics/GraphicTypes";
import { PhysicsGroups } from "../../PhysicsGroups";
import AnimatedSprite from "../../../Wolfie2D/Nodes/Sprites/AnimatedSprite";
/**
 * // TODO get the particles to move towards the mouse when the player attacks
 *
 * The particle system used for the player's attack. Particles in the particle system should
 * be spawned at the player's position and fired in the direction of the mouse's position.
 */
export default class PlayerWeapon extends ParticleSystem {
  public getPool(): Readonly<Array<Particle>> {
    return this.particlePool;
  }

  public increasePoolSize(amount: number, scene: Scene, layer: string, sprite?: AnimatedSprite): void {
    const newPoolSize = this.particlePool.length + amount;
    for (let i = this.particlePool.length; i < newPoolSize; i++) {
      const particle = <Particle>scene.add.graphic(GraphicType.PARTICLE, layer, {
        position: this.sourcePoint.clone(),
        size: this.particleSize.clone(),
        mass: this.particleMass,
        sprite: this.sprite
      });
  
      particle.addPhysics();
      particle.setGroup(PhysicsGroups.PLAYER_WEAPON);
      particle.isCollidable = false;
      particle.visible = false;
      this.particlePool.push(particle);

      // const particleSprite = new AnimatedSprite(sprite.spritesheet);
      // particleSprite.position.set(particle.position.x, particle.position.y);
      // particleSprite.visible = false;
      // this.sprites.push(particleSprite);
    }
  }
  
  public update(deltaT: number): void {
    // Call the base class update method to update particles
    super.update(deltaT);

    // Update the sprite position to follow the particle
    for (let i = 0; i < this.particlePool.length; i++) {
      const particle = this.particlePool[i];
      if(particle.sprite !== null) {
      if (particle.active) {
          particle.sprite.animation.playIfNotAlready("SPIN", true);
          particle.sprite.position.set(particle.position.x, particle.position.y);
          particle.sprite.visible = true;
      } else {
          particle.sprite.visible = false;
      }
    }
  }
}

  public increaseMaxParticlesPerFrame(amount: number): void {
    this.particlesPerFrame += amount;
  }
  

  /**
   * @returns true if the particle system is running; false otherwise.
   */
  public isSystemRunning(): boolean {
    return this.systemRunning;
  }

  /**
   * Sets the animations for a particle in the player's weapon
   * @param particle the particle to give the animation to
   */
  public setParticleAnimation(particle: Particle) {
    let mouse = Input.getGlobalMousePosition();
    let direction = mouse.sub(particle.position).normalize();
    let velocity = direction.scale(RandUtils.randInt(1000, 1100));

    velocity = velocity.add(
      new Vec2(RandUtils.randInt(-32, 32), RandUtils.randInt(-32, 32))
    );
    particle.vel = velocity;

    // Give the particle tweens
    particle.tweens.add("active", {
      startDelay: 0,
      duration: this.lifetime,
      effects: [
        {
          property: "alpha",
          start: 1,
          end: 0,
          ease: EaseFunctionType.IN_OUT_SINE,
        },
      ],
    });
  }
}
