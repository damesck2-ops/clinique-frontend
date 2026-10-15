/** Reflète org.springframework.data.domain.Page<T> renvoyé par l'API. */
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // page courante (0-indexée)
  size: number;
}
