import useWindowSize from './useWindowSize'

// Book grids use 2, 3, 4 or 6 columns. Every one of those divides a page of 12 books
// evenly, so the last row is never left half empty.
export default function useGridColumns() {
  const { width } = useWindowSize()
  if (width >= 1100) return 6
  if (width >= 800) return 4
  if (width >= 560) return 3
  return 2
}
