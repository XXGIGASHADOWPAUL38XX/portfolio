/** Données d'une entrée de contenu ; une entrée absente arrête le build avec le fichier attendu. */
export function entryData<T>(entry: { data: T } | undefined, file: string): T {
  if (!entry) throw new Error(`Contenu manquant : src/content/${file}`);
  return entry.data;
}
