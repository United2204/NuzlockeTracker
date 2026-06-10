import { client } from './client';
import type { GameResponse, BadgeResponse, RouteResponse, PokemonSearchResponse } from '../types/api';

export const catalogApi = {
  games: () =>
    client.get<GameResponse[]>('/api/catalog/games'),

  badges: (gameId: number) =>
    client.get<BadgeResponse[]>(`/api/catalog/games/${gameId}/badges`),

  routes: (gameId: number) =>
    client.get<RouteResponse[]>(`/api/catalog/games/${gameId}/routes`),

  searchPokemon: (q: string, lang = 'en') =>
    client.get<PokemonSearchResponse[]>('/api/catalog/pokemon/search', { params: { q, lang } }),

  evolutionChain: (pokemonId: number, lang = 'en') =>
    client.get<PokemonSearchResponse[]>(`/api/catalog/pokemon/${pokemonId}/evolutions`, { params: { lang } }),
};
