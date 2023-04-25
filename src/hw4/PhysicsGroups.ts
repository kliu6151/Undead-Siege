/**
 * An enum with all of the physics groups for HW4
 */
export const PhysicsGroups = {
  // Physics groups for the player and the player's weapon
  //PLAYER: "PLAYER",
  PLAYER_WEAPON: "WEAPON",
  /* 
        Physics groups for the different tilemap layers. Physics groups for tilemaps are
        embedded in the tilemap layer data by a property called "Group". This lets you
        set the physics group for a particular tilemap layer.
    */
  ZOMBIE: "ZOMBIE",
  //GROUND: "GROUND",
  //DESTRUCTIBLE: "DESTRUCTIBLE",
} as const;
