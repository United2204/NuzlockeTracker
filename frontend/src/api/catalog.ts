import { client } from './client';
import type { GameResponse, BadgeResponse, RouteResponse, PokemonSearchResponse, PokemonDetailResponse } from '../types/api';

export const catalogApi = {
  games: () =>
    client.get<GameResponse[]>('/api/catalog/games'),

  badges: (gameId: number, lang = 'en') =>
    client.get<BadgeResponse[]>(`/api/catalog/games/${gameId}/badges`, { params: { lang } }),

  routes: (gameId: number, lang = 'en') =>
    client.get<RouteResponse[]>(`/api/catalog/games/${gameId}/routes`, { params: { lang } }),

  searchPokemon: (q: string, lang = 'en') =>
    client.get<PokemonSearchResponse[]>('/api/catalog/pokemon/search', { params: { q, lang } }),

  evolutionChain: (pokemonId: number, lang = 'en') =>
    client.get<PokemonSearchResponse[]>(`/api/catalog/pokemon/${pokemonId}/evolutions`, { params: { lang } }),

  getPokemon: (id: number, lang = 'en') =>
    client.get<PokemonDetailResponse>(`/api/catalog/pokemon/${id}`, { params: { lang } }),
};
