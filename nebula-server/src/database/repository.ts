import { supabaseAdmin } from '../config/supabase.js';
import type { PlayerState, ShipState, VoxelChunk } from '../models/domain.js';

export type PersistedFaction = { factionId: string; name: string; leaderId: string };

export class GameRepository {
  async saveChunks(chunks: VoxelChunk[]): Promise<void> {
    if (!chunks.length) return;
    const rows = chunks.map((chunk) => ({
      chunk_key: chunk.chunkKey,
      block_data: chunk.blockData,
      updated_at: new Date(chunk.updatedAt).toISOString()
    }));
    const { error } = await supabaseAdmin.from('world_chunks').upsert(rows, { onConflict: 'chunk_key' });
    if (error) throw new Error(`Failed to save chunks: ${error.message}`);
  }

  async savePlayers(players: PlayerState[]): Promise<void> {
    if (!players.length) return;
    const rows = players.map((player) => ({
      user_id: player.userId,
      position_x: player.position.x,
      position_y: player.position.y,
      position_z: player.position.z,
      velocity_x: player.velocity.x,
      velocity_y: player.velocity.y,
      velocity_z: player.velocity.z,
      rotation: player.rotation,
      updated_at: new Date(player.updatedAt).toISOString()
    }));
    const { error } = await supabaseAdmin.from('player_states').upsert(rows, { onConflict: 'user_id' });
    if (error) throw new Error(`Failed to save players: ${error.message}`);
  }

  async saveShips(ships: ShipState[]): Promise<void> {
    if (!ships.length) return;
    const rows = ships.map((ship) => ({
      ship_id: ship.shipId,
      owner_id: ship.ownerId,
      voxel_matrix: ship.voxelMatrix,
      position_x: ship.position.x,
      position_y: ship.position.y,
      position_z: ship.position.z,
      velocity_x: ship.velocity.x,
      velocity_y: ship.velocity.y,
      velocity_z: ship.velocity.z,
      updated_at: new Date(ship.updatedAt).toISOString()
    }));
    const { error } = await supabaseAdmin.from('ships').upsert(rows, { onConflict: 'ship_id' });
    if (error) throw new Error(`Failed to save ships: ${error.message}`);
  }

  async createFaction(name: string, leaderId: string): Promise<string> {
    const { data, error } = await supabaseAdmin.from('factions').insert({ name, leader_id: leaderId }).select('faction_id').single();
    if (error) throw new Error(`Failed to create faction: ${error.message}`);
    return data.faction_id as string;
  }

  async getFaction(factionId: string): Promise<PersistedFaction | null> {
    const { data, error } = await supabaseAdmin.from('factions').select('faction_id, name, leader_id').eq('faction_id', factionId).maybeSingle();
    if (error) throw new Error(`Failed to read faction: ${error.message}`);
    if (!data) return null;
    return { factionId: data.faction_id as string, name: data.name as string, leaderId: data.leader_id as string };
  }

  async addFactionMember(factionId: string, userId: string): Promise<void> {
    const { error } = await supabaseAdmin.from('faction_members').upsert({ faction_id: factionId, user_id: userId });
    if (error) throw new Error(`Failed to add faction member: ${error.message}`);
  }

  async removeFactionMember(factionId: string, userId: string): Promise<void> {
    const { error } = await supabaseAdmin.from('faction_members').delete().eq('faction_id', factionId).eq('user_id', userId);
    if (error) throw new Error(`Failed to roll back faction member: ${error.message}`);
  }

  async deleteFaction(factionId: string): Promise<void> {
    const { error } = await supabaseAdmin.from('factions').delete().eq('faction_id', factionId);
    if (error) throw new Error(`Failed to roll back faction: ${error.message}`);
  }
}
