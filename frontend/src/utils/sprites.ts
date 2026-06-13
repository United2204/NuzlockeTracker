/** Convierte la URL de un sprite normal a su variante shiny. */
export function toShinySpriteUrl(url: string): string {
  return url.replace(/\/sprites\/pokemon\/(\d+\.png)$/, '/sprites/pokemon/shiny/$1');
}

/**
 * Devuelve la URL del sprite a mostrar para un Pokémon capturado,
 * usando la variante shiny cuando corresponde.
 */
export function spriteFor(spriteUrl: string | null | undefined, shiny: boolean): string | null {
  if (!spriteUrl) return null;
  return shiny ? toShinySpriteUrl(spriteUrl) : spriteUrl;
}
