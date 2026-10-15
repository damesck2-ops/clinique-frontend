import { Pipe, PipeTransform } from '@angular/core';

export const TAILLE_PAGE = 10;

/** Découpe une liste côté client : `*ngFor="let x of liste | paginer:page"`. */
@Pipe({ name: 'paginer', standalone: true })
export class PaginerPipe implements PipeTransform {
  transform<T>(liste: T[] | null | undefined, page = 1, taille = TAILLE_PAGE): T[] {
    if (!liste) return [];
    const debut = (page - 1) * taille;
    return liste.slice(debut, debut + taille);
  }
}
