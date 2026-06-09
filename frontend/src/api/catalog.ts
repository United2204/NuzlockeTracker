import { client } from './client';
import type { GameResponse, BadgeResponse, PokemonSearchResponse } from '../types/api';

export const catalogApi = {
  games: () =>
    client.get<GameResponse[]>('/api/catalog/games'),

  badges: (gameId: number) =>
    client.get<BadgeResponse[]>(`/api/catalog/games/${gameId}/badges`),

  searchPokemon: (q: string, lang = 'en') =>
    client.get<PokemonSearchResponse[]>('/api/catalog/pokemon/search', { params: { q, lang } }),

  evolutionChain: (pokemonId: number, lang = 'en') =>
    client.get<PokemonSearchResponse[]>(`/api/catalog/pokemon/${pokemonId}/evolutions`, { params: { lang } }),
};
